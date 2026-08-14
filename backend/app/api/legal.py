from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends
from pydantic import BaseModel
import structlog

router = APIRouter()
logger = structlog.get_logger()

class SuggestRequest(BaseModel):
    narrative: str
    language:  str = 'en'

@router.post("/suggest")
async def suggest_sections(
    body: SuggestRequest,
    officer = Depends(get_current_officer)
):
    from app.services.legal_intel import (
        suggest_sections,
        search_case_law,
        get_ipc_crossref
    )

    sections = suggest_sections(body.narrative)
    case_law = await search_case_law(body.narrative)
    crossref = get_ipc_crossref(sections)

    return {
        "bns_sections":   sections.get('bns', []),
        "bnss_sections":  sections.get('bnss', []),
        "bsa_sections":   sections.get('bsa', []),
        "other_sections": sections.get('other', []),
        "ipc_crossref":   crossref,
        "case_law":       case_law,
        "disclaimer": (
            "Sections are suggested for officer review only. "
            "Verify against BNS/BNSS/BSA bare act before applying."
        )
    }

@router.get("/sections")
async def list_legal_sections(q: str = "", officer = Depends(get_current_officer)):
    from app.services.legal_intel import SECTION_MAP, BNS_IPC_MAPPING
    rows = []
    for pattern, values in SECTION_MAP.items():
        for code in values.get("bns", []):
            if q and q.lower() not in (code + " " + pattern).lower():
                continue
            rows.append({"id": code, "bns_section": code, "bns_title": pattern.replace("\\", "").replace("|", " / "), "ipc_section": BNS_IPC_MAPPING.get(code, "N/A"), "category": "Legal reference", "description": "Section mapping for officer review; verify against the current bare act.", "punishment": "Refer to current bare act", "bailable": False})
    return rows

@router.get("/search")
async def search_legal_endpoint(
    q: str,
    officer = Depends(get_current_officer)
):
    from app.services.legal_intel import SECTION_MAP, BNS_IPC_MAPPING, search_case_law
    db_results = await search_case_law(q)
    # Also do keyword search on SECTION_MAP
    keyword_results = []
    q_lower = q.lower()
    for pattern, values in SECTION_MAP.items():
        if q_lower and q_lower not in pattern.lower():
            continue
        for code in values.get("bns", [])[:2]:
            keyword_results.append({
                "section": code,
                "title": pattern.replace("\\", "").replace("|", " / ")[:80],
                "ipc": BNS_IPC_MAPPING.get(code, "N/A"),
            })
    # Return flat array: DB results first, then keyword matches
    results = list(db_results) + keyword_results
    return results[:10]