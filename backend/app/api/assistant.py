from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal
import os
import structlog

from app.db.connection import get_db, fetch_one, fetch_all
from app.api.auth import get_current_officer
from app.services.assistant import get_llm_response

router = APIRouter()
logger = structlog.get_logger()

OUT_OF_SCOPE = [
    "other case", "different case", "all other",
    "another station", "another ps", "entire database",
    "ignore", "forget", "disregard", "pretend",
    "you are now", "act as", "jailbreak",
]

class AssistantQuery(BaseModel):
    mode:     Literal['this_case', 'all_cases']
    question: str
    case_id:  str | None = None

@router.post("/query")
async def query_assistant(
    body: AssistantQuery,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "AI assistant not available for this role")

    question_lower = body.question.lower()

    for phrase in OUT_OF_SCOPE:
        if phrase in question_lower:
            return {
                "answer": (
                    "This assistant only answers questions about "
                    "case files you are authorized to access. "
                    "Please ask about case details, evidence, "
                    "witnesses, or legal sections."
                ),
                "mode": body.mode,
                "source": "system"
            }

    if body.mode == 'this_case':
        if not body.case_id:
            raise HTTPException(400, "case_id required for this_case mode")

        if officer['role'] in ('io', 'sho'):
            case = await fetch_one(db, """
                SELECT victim_name, accused_name, crime_type,
                       crime_narrative, bns_sections, bnss_sections,
                       evidence_items, witnesses, arrest_date,
                       case_status, crime_date, crime_location
                FROM cases
                WHERE case_id = $1 AND ps_id = $2
            """, [body.case_id, str(officer['ps_id'])])
        else:
            case = await fetch_one(db, """
                SELECT victim_name, accused_name, crime_type,
                       crime_narrative, bns_sections, bnss_sections,
                       evidence_items, witnesses, arrest_date,
                       case_status, crime_date, crime_location
                FROM cases
                WHERE case_id = $1
            """, [body.case_id])

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

    else:
        if officer['role'] == 'io':
            cases = await fetch_all(db, """
                SELECT fir_no, crime_type, crime_date, case_status,
                       ward, victim_name, accused_name, bns_sections
                FROM cases WHERE ps_id = $1
                ORDER BY crime_date DESC LIMIT 30
            """, [str(officer['ps_id'])])
        elif officer['role'] == 'sho':
            cases = await fetch_all(db, """
                SELECT fir_no, crime_type, crime_date, case_status,
                       ward, victim_name, accused_name, bns_sections
                FROM cases WHERE ps_id = $1
                ORDER BY crime_date DESC LIMIT 50
            """, [str(officer['ps_id'])])
        else:
            cases = await fetch_all(db, """
                SELECT fir_no, crime_type, crime_date, case_status,
                       ward, victim_name, accused_name, bns_sections
                FROM cases
                ORDER BY crime_date DESC LIMIT 100
            """)

        if not cases:
            return {
                "answer": "No cases found in your jurisdiction.",
                "mode": body.mode,
                "source": "system"
            }

        context = f"CASES DATA ({len(cases)} cases):\n"
        for c in cases:
            context += (
                f"FIR {c['fir_no']}: {c['crime_type']} in {c['ward']}, "
                f"status={c['case_status']}, date={c['crime_date']}\n"
            )

        system_prompt = (
            "You are a police intelligence assistant. "
            "Analyze and summarize the provided case data. "
            "Always cite FIR numbers for specific claims. "
            "Do not speculate beyond the data provided. "
            "Be concise and structured in your response."
        )

    answer = await get_llm_response(system_prompt, context, body.question)

    return {
        "answer": answer,
        "mode":   body.mode,
        "source": "ai"
    }
