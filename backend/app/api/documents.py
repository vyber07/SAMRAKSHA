from sqlalchemy import text
from sqlalchemy import text
from app.db.connection import get_db
from app.api import auth
from app.api.auth import get_current_officer

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response
from pydantic import BaseModel
import structlog

router = APIRouter()
logger = structlog.get_logger()

DOC_TYPES = [
    'chargesheet', 'medical_letter', 'remand_request',
    'seizure_receipt', 'court_custody', 'panchanama', 'face_id',
    'witness_statement', 'fir', 'case_diary', 'arrest_memo',
    'seizure_list', 'search_warrant', 'bail_objection'
]

class GenerateRequest(BaseModel):
    case_id:  str
    doc_type: str
    language: str = 'en'

@router.post("/generate")
async def generate_document(
    request: Request,
    body: GenerateRequest,
    db = Depends(get_db),
    officer = Depends(auth.require_permission('doc_generate'))
):
    if body.doc_type not in DOC_TYPES:
        raise HTTPException(400, f"Invalid doc_type. Must be one of: {DOC_TYPES}")

    case = (await db.execute(text("SELECT * FROM cases WHERE case_id = :p1"), {'p1': body.case_id})).mappings().fetchone()

    if not case:
        raise HTTPException(404, "Case not found")

    if officer['role'] in ('io', 'sho') and \
       str(case['ps_id']) != str(officer['ps_id']):
        raise HTTPException(403, "Access denied to this case")

    if body.doc_type == 'medical_letter' and not case.get('victim_injury'):
        raise HTTPException(400,
            "Medical letter requires victim_injury flag to be set"
        )

    io_officer = (await db.execute(text("SELECT name, badge_no FROM officers WHERE id = :p1"), {'p1': case['io_id']})).mappings().fetchone()

    ps = (await db.execute(text("SELECT name FROM police_stations WHERE id = :p1"), {'p1': case['ps_id']})).mappings().fetchone()

    try:
        from app.services.document_gen import generate_document
        from fastapi.concurrency import run_in_threadpool

        doc_bytes, sha256 = await run_in_threadpool(
            generate_document,
            doc_type=body.doc_type,
            case={
                **dict(case),
                'ps_name': ps['name'] if ps else 'Unknown PS',
            },
            officer=dict(io_officer) if io_officer else {
                'name': officer['name'],
                'badge_no': officer['badge_no']
            },
            lang=body.language
        )

    except FileNotFoundError:
        raise HTTPException(500,
            f"Template for {body.doc_type} not found. "
            f"Ensure template files are in /app/templates/documents/"
        )
    except Exception as e:
        logger.error("Document generation failed",
                     doc_type=body.doc_type,
                     case_id=body.case_id,
                     error=str(e))
        raise HTTPException(500, "Document generation failed")

    await db.execute(text("""
        INSERT INTO doc_log
        (case_id, doc_type, sha256, generated_by, language)
        VALUES (:p1, :p2, :p3, :p4, :p5)
        RETURNING id
    """), {'p1': body.case_id, 'p2': body.doc_type, 'p3': sha256, 'p4': str(officer['id']), 'p5': body.language})

    doc_labels = {
        'chargesheet':       'Purvani Chargesheet',
        'medical_letter':    'Medical Treatment Letter',
        'remand_request':    'Remand Request Letter',
        'seizure_receipt':   'Seizure Receipt',
        'court_custody':     'Court Custody Letter',
        'panchanama':        'Accused Panchanama',
        'face_id':           'Face Identification Form',
        'witness_statement': 'Witness Statement',
        'fir':               'First Information Report',
        'case_diary':        'Case Diary Record',
        'arrest_memo':       'Arrest Memo',
        'seizure_list':      'Seizure List',
        'search_warrant':    'Search Warrant',
        'bail_objection':    'Bail Objection Application',
    }
    await db.execute(text("""
        INSERT INTO case_diary
        (case_id, entry_type, description, officer_id, auto_generated)
        VALUES (:p1, 'document', :p2, :p3, TRUE)
    """), {'p1': body.case_id, 'p2': f"{doc_labels[body.doc_type]} generated "
        f"(SHA-256: {sha256[:8]}...)", 'p3': str(officer['id'])})

    from app.services.audit import log_activity
    try:
        await log_activity(db, str(officer['id']), "generate_document", f"Officer {officer['badge_no']} generated document: {body.doc_type} for case: {body.case_id}", request.client.host)
    except Exception as e:
        logger.error("Audit log failed on generate_document", error=str(e))

    await db.commit()

    filename = (
        f"{body.doc_type}_{case['fir_no'].replace('/','_')}"
        f"_{body.language}.docx"
    )
    return Response(
        content=doc_bytes,
        media_type="application/vnd.openxmlformats-"
                   "officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Document-SHA256":   sha256,
            "Access-Control-Expose-Headers": "Content-Disposition, X-Document-SHA256"
        }
    )

@router.get("/templates")
async def list_templates(
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    """Return available document templates."""
    return [{"id": k, "name": v} for k, v in DOC_TYPES.items()] if isinstance(DOC_TYPES, dict) else [{"id": d, "name": d.replace("_", " ").title()} for d in DOC_TYPES]

@router.get("")
async def list_documents(
    case_id: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    case = (await db.execute(text("SELECT ps_id FROM cases WHERE case_id = :p1"), {'p1': case_id})).mappings().fetchone()
    if not case:
        raise HTTPException(404, "Case not found")

    if officer['role'] in ('io', 'sho') and \
       str(case['ps_id']) != str(officer['ps_id']):
        raise HTTPException(403, "Access denied")

    docs = (await db.execute(text("""
        SELECT dl.id, dl.doc_type, dl.sha256,
               dl.language, dl.generated_at,
               o.name as generated_by_name
        FROM doc_log dl
        LEFT JOIN officers o ON dl.generated_by = o.id
        WHERE dl.case_id = :p1
        ORDER BY dl.generated_at DESC
    """), {'p1': case_id})).mappings().fetchall()

    return docs