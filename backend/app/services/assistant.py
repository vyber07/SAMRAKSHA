# app/services/assistant.py

class CaseAssistant:
    
    async def query_this_case(
        self,
        case_id: str,
        question: str,
        officer: Officer
    ) -> str:
        # Permission check at DB level — not prompt level
        case = await db.fetch_one(
            """SELECT victim_name, accused_name, crime_type,
                      crime_narrative, bns_sections, evidence_items,
                      witnesses, arrest_date, case_status
               FROM cases
               WHERE case_id = $1 AND ps_id = $2""",
            [case_id, officer.ps_id]
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
        response = await llm.complete(
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
        officer: Officer
    ) -> str:
        # RBAC filter at SQL level
        if officer.role == 'constable':
            return "You do not have permission to query case data."
        
        if officer.role in ('io', 'sho'):
            filter_sql = "WHERE ps_id = $1"
            params = [officer.ps_id]
        else:  # dcp, admin
            filter_sql = ""
            params = []
        
        cases = await db.fetch_all(
            f"""SELECT fir_no, crime_type, crime_date,
                       case_status, ward, bns_sections
                FROM cases {filter_sql}
                ORDER BY crime_date DESC LIMIT 50""",
            params
        )
        
        if not cases:
            return "No cases found in your jurisdiction."
        
        response = await llm.complete(
            system=(
                "You are a police intelligence assistant. "
                "Summarize the provided cases. "
                "Always cite FIR numbers for every claim. "
                "Do not speculate beyond the data provided."
            ),
            user=f"Cases: {[dict(c) for c in cases]}\n\nQuery: {question}"
        )
        return response
