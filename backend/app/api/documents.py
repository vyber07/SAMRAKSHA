from app.db.connection import get_db, fetch_one, fetch_all, execute
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
    'witness_statement'
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
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Constables cannot generate documents")

    if body.doc_type not in DOC_TYPES:
        raise HTTPException(400, f"Invalid doc_type. Must be one of: {DOC_TYPES}")

    case = await fetch_one(db,
        "SELECT * FROM cases WHERE case_id = $1",
        [body.case_id]
    )

    if not case:
        raise HTTPException(404, "Case not found")

    if officer['role'] in ('io', 'sho') and \
       str(case['ps_id']) != str(officer['ps_id']):
        raise HTTPException(403, "Access denied to this case")

    if body.doc_type == 'medical_letter' and not case.get('victim_injury'):
        raise HTTPException(400,
            "Medical letter requires victim_injury flag to be set"
        )

    io_officer = await fetch_one(db,
        "SELECT name, badge_no FROM officers WHERE id = $1",
        [case['io_id']]
    )

    ps = await fetch_one(db,
        "SELECT name FROM police_stations WHERE id = $1",
        [case['ps_id']]
    )

    try:
        from app.services.document_gen import generate_document

        doc_bytes, sha256 = generate_document(
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

    await execute(db, """
        INSERT INTO doc_log
        (case_id, doc_type, sha256, generated_by, language)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
    """, [body.case_id, body.doc_type, sha256,
          str(officer['id']), body.language])

    doc_labels = {
        'chargesheet':    'Purvani Chargesheet',
        'medical_letter': 'Medical Treatment Letter',
        'remand_request': 'Remand Request Letter',
        'seizure_receipt':'Seizure Receipt',
        'court_custody':  'Court Custody Letter',
        'panchanama':     'Accused Panchanama',
        'face_id':        'Face Identification Form',
        'witness_statement': 'Witness Statement',
    }
    await execute(db, """
        INSERT INTO case_diary
        (case_id, entry_type, description, officer_id, auto_generated)
        VALUES ($1, 'document', $2, $3, TRUE)
    """, [
        body.case_id,
        f"{doc_labels[body.doc_type]} generated "
        f"(SHA-256: {sha256[:8]}...)",
        str(officer['id'])
    ])

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
        }
    )

@router.get("")
async def list_documents(
    case_id: str,
    db = Depends(get_db),
    officer = Depends(get_current_officer)
):
    if officer['role'] == 'constable':
        raise HTTPException(403, "Access denied")

    case = await fetch_one(db,
        "SELECT ps_id FROM cases WHERE case_id = $1",
        [case_id]
    )
    if not case:
        raise HTTPException(404, "Case not found")

    if officer['role'] in ('io', 'sho') and \
       str(case['ps_id']) != str(officer['ps_id']):
        raise HTTPException(403, "Access denied")

    docs = await fetch_all(db, """
        SELECT dl.id, dl.doc_type, dl.sha256,
               dl.language, dl.generated_at,
               o.name as generated_by_name
        FROM doc_log dl
        LEFT JOIN officers o ON dl.generated_by = o.id
        WHERE dl.case_id = $1
        ORDER BY dl.generated_at DESC
    """, [case_id])

    return docs