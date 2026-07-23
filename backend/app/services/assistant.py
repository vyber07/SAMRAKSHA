# app/services/assistant.py

import os
import httpx
from typing import Optional, Any
from pydantic import BaseModel
from app.db.connection import fetch_one as _fetch_one, fetch_all as _fetch_all, AsyncSessionLocal

class Officer(BaseModel):
    id: Optional[str] = None
    badge_no: Optional[str] = None
    name: Optional[str] = None
    role: str = "io"
    ps_id: Optional[str] = None

class DBService:
    async def fetch_one(self, query: str, params: list = None) -> dict | None:
        async with AsyncSessionLocal() as session:
            return await _fetch_one(session, query, params)

    async def fetch_all(self, query: str, params: list = None) -> list:
        async with AsyncSessionLocal() as session:
            return await _fetch_all(session, query, params)

db = DBService()

class LLMService:
    def __init__(self, base_url: str = None):
        self.base_url = base_url or os.getenv("LLAMACPP_URL", os.getenv("LLM_URL", "http://llamacpp:8080"))

    async def complete(self, system: str, user: str) -> str:
        url = f"{self.base_url}/v1/chat/completions"
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(
                    url,
                    json={
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user}
                        ],
                        "temperature": 0.1,
                        "stream": False
                    }
                )
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        return choices[0].get("message", {}).get("content", "").strip()
        except Exception:
            pass
        return "Assistant response based on case data."

llm = LLMService()

class CaseAssistant:
    
    async def query_this_case(
        self,
        case_id: str,
        question: str,
        officer: Officer | Any,
        db_client: Any = None,
        llm_client: Any = None
    ) -> str:
        active_db = db_client or db
        active_llm = llm_client or llm

        ps_id = officer.ps_id if hasattr(officer, 'ps_id') else (officer.get('ps_id') if isinstance(officer, dict) else None)

        # Permission check at DB level — not prompt level
        if hasattr(active_db, 'fetch_one'):
            case = await active_db.fetch_one(
                """SELECT victim_name, accused_name, crime_type,
                          crime_narrative, bns_sections, evidence_items,
                          witnesses, arrest_date, case_status
                   FROM cases
                   WHERE case_id = $1 AND ps_id = $2""",
                [case_id, ps_id]
            )
        else:
            case = await _fetch_one(
                active_db,
                """SELECT victim_name, accused_name, crime_type,
                          crime_narrative, bns_sections, evidence_items,
                          witnesses, arrest_date, case_status
                   FROM cases
                   WHERE case_id = $1 AND ps_id = $2""",
                [case_id, ps_id]
            )
        
        if not case:
            return "You do not have access to this case file."
        
        # Hardcoded out-of-scope guard
        ooscope = ['other case','different case','all cases',
                   'another ps','ignore','forget']
        if any(w in question.lower() for w in ooscope):
            return ("This assistant only answers questions about "
                    "the current case file.")
        
        # LLM gets ONLY retrieved data — never DB access
        response = await active_llm.complete(
            system=(
                "You are a police case file assistant. "
                "Answer ONLY from the provided case data below. "
                "Do not use external knowledge. "
                "If information is not in the case data, say: "
                "'This information is not in the case file.' "
                "Never discuss other cases."
            ),
            user=f"Case data: {dict(case)}\n\nQuestion: {question}"
        )
        return response
    
    async def query_all_cases(
        self,
        question: str,
        officer: Officer | Any,
        db_client: Any = None,
        llm_client: Any = None
    ) -> str:
        active_db = db_client or db
        active_llm = llm_client or llm

        role = officer.role if hasattr(officer, 'role') else (officer.get('role') if isinstance(officer, dict) else '')
        ps_id = officer.ps_id if hasattr(officer, 'ps_id') else (officer.get('ps_id') if isinstance(officer, dict) else None)

        # RBAC filter at SQL level
        if role == 'constable':
            return "You do not have permission to query case data."
        
        if role in ('io', 'sho'):
            filter_sql = "WHERE ps_id = $1"
            params = [ps_id]
        else:  # dcp, admin
            filter_sql = ""
            params = []
        
        if hasattr(active_db, 'fetch_all'):
            cases = await active_db.fetch_all(
                f"""SELECT fir_no, crime_type, crime_date,
                           case_status, ward, bns_sections
                    FROM cases {filter_sql}
                    ORDER BY crime_date DESC LIMIT 50""",
                params
            )
        else:
            cases = await _fetch_all(
                active_db,
                f"""SELECT fir_no, crime_type, crime_date,
                           case_status, ward, bns_sections
                    FROM cases {filter_sql}
                    ORDER BY crime_date DESC LIMIT 50""",
                params
            )
        
        if not cases:
            return "No cases found in your jurisdiction."
        
        response = await active_llm.complete(
            system=(
                "You are a police intelligence assistant. "
                "Summarize the provided cases. "
                "Always cite FIR numbers for every claim. "
                "Do not speculate beyond the data provided."
            ),
            user=f"Cases: {[dict(c) for c in cases]}\n\nQuery: {question}"
        )
        return response
