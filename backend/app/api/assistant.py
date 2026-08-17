from sqlalchemy import text
from sqlalchemy import text
from app.db.connection import get_db
from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal
import httpx, os, structlog

router = APIRouter()
logger = structlog.get_logger()

LLM_URL    = os.getenv("LLAMACPP_URL", os.getenv("LLM_URL", "http://llamacpp:8080"))
LLM_MODEL  = os.getenv("LLM_MODEL", "llama3.2:3b")  # fallback or placeholder

class AssistantQuery(BaseModel):
    mode: str = 'all_cases'
    question: str = ''
    query: str = ''       # frontend alias for question
    language: str = 'en'
    case_id: str | None = None

    def get_question(self) -> str:
        return self.question or self.query

@router.post("/query")
async def query_assistant(
    body: AssistantQuery,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    question_lower = body.get_question().lower()

    # Fast-path for simple greetings to avoid slow CPU LLM timeout on edge proxies
    q = body.get_question().lower().strip()
    import re
    if re.match(r'^(hi+|hello+|hey+|hola|greetings)', q) and len(q.split()) < 4:
        return {
            "response": "Hello! I am SAMRAKSHA AI, your police intelligence assistant. How can I help you analyze the case data today?",
            "mode": body.mode,
            "source": "system"
        }

    if body.mode == 'this_case':
        if not body.case_id:
            raise HTTPException(400, "case_id required for this_case mode")

        if officer['role'] in ('io', 'sho'):
            case = (await db.execute(text("""
                SELECT victim_name, accused_name, crime_type,
                       crime_narrative, bns_sections, bnss_sections,
                       evidence_items, witnesses, arrest_date,
                       case_status, crime_date, crime_location
                FROM cases
                WHERE case_id = :p1 AND ps_id = :p2
            """), {'p1': body.case_id, 'p2': str(officer['ps_id'])})).mappings().fetchone()
        else:
            case = (await db.execute(text("""
                SELECT victim_name, accused_name, crime_type,
                       crime_narrative, bns_sections, bnss_sections,
                       evidence_items, witnesses, arrest_date,
                       case_status, crime_date, crime_location
                FROM cases
                WHERE case_id = :p1
            """), {'p1': body.case_id})).mappings().fetchone()

        if not case:
            return {
                "answer": "You do not have access to this case file.",
                "mode": body.mode,
                "source": "system"
            }

        context = f"""
CASE FILE DATA (answer only from this):
Crime Type: {case['crime_type']}
Crime Date: {case['crime_date']}
Location: {case['crime_location']}
Status: {case['case_status']}
Victim: {case['victim_name']}
Accused: {case['accused_name'] or 'Not identified'}
Narrative: {case['crime_narrative']}
BNS Sections: {', '.join(case['bns_sections'] or [])}
Evidence: {case['evidence_items']}
Witnesses: {case['witnesses']}
Arrest Date: {case['arrest_date'] or 'Not yet arrested'}
"""
        system_prompt = (
            "You are a police case file assistant. "
            "Answer ONLY from the case data provided. "
            "Do not use external knowledge or make assumptions. "
            "If information is not in the case data, say: "
            "'This information is not recorded in the case file.' "
            "Be concise and factual."
        )

    else:  # all_cases mode
        if officer['role'] == 'io':
            cases = (await db.execute(text("""
                SELECT fir_no, crime_type, crime_date, case_status, ward
                FROM cases WHERE ps_id = :p1
                ORDER BY crime_date DESC LIMIT 10
            """), {'p1': str(officer['ps_id'])})).mappings().fetchall()
        elif officer['role'] == 'sho':
            cases = (await db.execute(text("""
                SELECT fir_no, crime_type, crime_date, case_status, ward
                FROM cases WHERE ps_id = :p1
                ORDER BY crime_date DESC LIMIT 10
            """), {'p1': str(officer['ps_id'])})).mappings().fetchall()
        else:  # dcp, admin
            cases = (await db.execute(text("""
                SELECT fir_no, crime_type, crime_date, case_status, ward
                FROM cases
                ORDER BY crime_date DESC LIMIT 15
            """), {})).mappings().fetchall()

        if not cases:
            return {
                "response": "No cases found in your jurisdiction.",
                "mode": body.mode,
                "source": "system"
            }

        context = f"CASES DATA ({len(cases)} cases):\n"
        for c in cases:
            context += (
                f"FIR Number: {c['fir_no']} | Case Type: {c['crime_type']} | "
                f"Location: {c['ward']} | Status: {c['case_status']} | Date: {c['crime_date']}\n"
            )

        system_prompt = (
            "You are a police intelligence assistant. "
            "Analyze and summarize the provided case data based on the user's question. "
            "Always cite FIR numbers for specific claims. "
            "Do not speculate beyond the data provided. "
            "If the user just says 'hi' or greets you, politely introduce yourself and ask how you can help with the cases. "
            "Be concise and structured in your response."
        )

    from fastapi.responses import StreamingResponse
    import json
    import asyncio

    async def generate_response():
        # Keep connection alive by yielding spaces
        yield b" "
        
        try:
            from app.services.llm_integration import get_llm
            llm = get_llm()
            messages = [
                {"role": "user", "content": f"{context}\n\nQuestion: {body.get_question()}"}
            ]
            
            task = asyncio.create_task(llm.chat_completion(
                messages=messages,
                system=system_prompt,
                temperature=0.1,
                max_tokens=150
            ))
            
            # While the task is running, yield a space every 2 seconds to prevent 60s proxy timeouts
            while not task.done():
                yield b" "
                await asyncio.sleep(2)
                
            answer = task.result()
            
            if not answer or answer == "I'm having trouble processing your request. Please try again.":
                raise ValueError("LLM response empty or fallback triggered")
            final_answer = str(answer).strip()
            source = "llm"
        except Exception as e:
            logger.warning("LLM unavailable, using fallback", error=str(e))
            final_answer = simple_keyword_answer(body.get_question(), context)
            source = "fallback"

        # After LLM finishes, yield the final JSON (which parsers will read properly ignoring the leading spaces)
        res_dict = {
            "response": final_answer,
            "mode": body.mode,
            "source": source
        }
        yield json.dumps(res_dict).encode('utf-8')

    return StreamingResponse(generate_response(), media_type="application/json")

def simple_keyword_answer(question: str, context: str) -> str:
    """Simple fallback when LLM is not available"""
    q = question.lower()
    if 'seized' in q or 'evidence' in q:
        lines = [l for l in context.split('\n') if 'evidence' in l.lower()]
        return lines[0] if lines else "No evidence recorded in case file."
    if 'section' in q or 'bns' in q:
        lines = [l for l in context.split('\n') if 'bns' in l.lower()]
        return lines[0] if lines else "No legal sections recorded."
    if 'arrest' in q:
        lines = [l for l in context.split('\n') if 'arrest' in l.lower()]
        return lines[0] if lines else "No arrest recorded in case file."
    return (
        "Please ask a specific question about the case evidence, "
        "legal sections, arrest details, or witness information."
    )
from fastapi import UploadFile, File
from app.services.voice import voice_service

@router.post("/voice-query")
async def voice_query_assistant(
    mode: Literal['this_case', 'all_cases'],
    audio: UploadFile = File(...),
    case_id: str | None = None,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    audio_bytes = await audio.read()
    transcribed_text = voice_service.transcribe(audio_bytes)
    
    body = AssistantQuery(
        mode=mode,
        question=transcribed_text,
        case_id=case_id
    )
    
    # Reuse query_assistant logic
    response = await query_assistant(body=body, db=db, officer=officer)
    
    # Cannot mutate a StreamingResponse object. Instead, we can inject the transcription 
    # as a custom HTTP header on the streaming response.
    response.headers["X-Voice-Transcription"] = transcribed_text
    return response
