import httpx
import os
import structlog

logger = structlog.get_logger()

LLM_URL = os.getenv("LLM_URL", "http://ollama:11434")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2:3b")

async def get_llm_response(system_prompt: str, context: str, question: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{LLM_URL}/api/generate",
                json={
                    "model":  LLM_MODEL,
                    "prompt": (
                        f"{system_prompt}\n\n"
                        f"{context}\n\n"
                        f"Question: {question}"
                    ),
                    "stream": False,
                    "options": {"temperature": 0.1, "max_tokens": 500}
                }
            )
        return resp.json().get("response", "")
    except Exception as e:
        logger.warning("LLM connection failed, using keyword fallback", error=str(e))
        return simple_keyword_answer(question, context)

def simple_keyword_answer(question: str, context: str) -> str:
    q = question.lower()
    if 'seized' in q or 'evidence' in q or 'property' in q:
        lines = [l for l in context.split('\n') if 'evidence' in l.lower() or 'seized' in l.lower()]
        return lines[0] if lines else "Evidence recorded: None."
    if 'section' in q or 'bns' in q or 'bnss' in q or 'bsa' in q:
        lines = [l for l in context.split('\n') if 'sections' in l.lower() or 'bns' in l.lower()]
        return lines[0] if lines else "Legal sections recorded: None."
    if 'arrest' in q or 'accused' in q:
        lines = [l for l in context.split('\n') if 'arrest' in l.lower() or 'accused' in l.lower()]
        return lines[0] if lines else "Accused/Arrest info not found."
    if 'victim' in q or 'injured' in q:
        lines = [l for l in context.split('\n') if 'victim' in l.lower() or 'injured' in l.lower()]
        return lines[0] if lines else "Victim information not found."
    return (
        "This is a fallback response. The requested details were not matched by keyword. "
        "Here is the case summary context: " + context.replace('\n', '; ')
    )
