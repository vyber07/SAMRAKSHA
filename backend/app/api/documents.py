from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
import os
import structlog

from app.db.connection import get_db, fetch_one, fetch_all, execute
from app.api.auth import get_current_officer
from app.services.document_gen import generate_document as run_gen

router = APIRouter()
logger = structlog.get_logger()

DOC_TYPES = [
    'chargesheet', 'medical_letter', 'remand_request',
    'seizure_receipt', 'court_custody', 'panchanama', 'face_id'
]

class GenerateRequest(BaseModel):
    case_id:  str
    doc_type: str
    language: str = 'en'

@router.post("/generate")
async def generate_document(
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
        raise HTTPException(400, "Medical letter requires victim_injury flag to be set")

    io_officer = await fetch_one(db,
        "SELECT name, badge_no FROM officers WHERE id = $1",
        [case['io_id']]
    )

    ps = await fetch_one(db,
        "SELECT name FROM police_stations WHERE id = $1",
        [case['ps_id']]
    )

    try:
        doc_bytes, sha256 = run_gen(
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
        raise HTTPException(500, f"Template for {body.doc_type} not found.")
    except Exception as e:
        logger.error("Document generation failed", doc_type=body.doc_type, case_id=body.case_id, error=str(e))
        raise HTTPException(500, "Document generation failed")

    # Save secure binary output to uploads folder
    upload_dir = "/app/uploads"
    if not os.path.exists(upload_dir):
        upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{sha256}.docx")
    try:
        with open(file_path, "wb") as f:
            f.write(doc_bytes)
    except Exception as io_err:
        logger.error("Failed to write document binary to disk", error=str(io_err))
        raise HTTPException(500, "Failed to save secure document hash binary")

    # Insert log
    result = await fetch_one(db, """
        INSERT INTO doc_log
        (case_id, doc_type, sha256, generated_by, language, generated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
    """, [body.case_id, body.doc_type, sha256, str(officer['id']), body.language])

    doc_labels = {
        'chargesheet':    'Purvani Chargesheet',
        'medical_letter': 'Medical Treatment Letter',
        'remand_request': 'Remand Request Letter',
        'seizure_receipt':'Seizure Receipt',
        'court_custody':  'Court Custody Letter',
        'panchanama':     'Accused Panchanama',
        'face_id':        'Face Identification Form',
    }

    # Add diary entry
    await execute(db, """
        INSERT INTO case_diary
        (case_id, entry_type, description, officer_id, auto_generated, ts)
        VALUES ($1, 'document', $2, $3, TRUE, NOW())
    """, [
        body.case_id,
        f"{doc_labels[body.doc_type]} generated (SHA-256: {sha256[:8]}...)",
        str(officer['id'])
    ])

    await db.commit()

    filename = f"{body.doc_type}_{case['fir_no'].replace('/', '_')}_{body.language}.docx"
    return Response(
        content=doc_bytes,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    db = Depends(get_db)
):
    # Retrieve metadata
    doc = await fetch_one(db, """
        SELECT dl.*, c.fir_no FROM doc_log dl
        JOIN cases c ON dl.case_id = c.case_id
        WHERE dl.id = $1
    """, [doc_id])

    if not doc:
        raise HTTPException(404, "Document log record not found")

    sha256 = doc['sha256']
    
    upload_dir = "/app/uploads"
    if not os.path.exists(upload_dir):
        upload_dir = "uploads"
        
    file_path = os.path.join(upload_dir, f"{sha256}.docx")
    if not os.path.exists(file_path):
        raise HTTPException(404, "Binary document file not found on disk")

    filename = f"{doc['doc_type']}_{doc['fir_no'].replace('/', '_')}_{doc['language']}.docx"
    
    try:
        with open(file_path, "rb") as f:
            content = f.read()
    except Exception as e:
        logger.error("Failed to read document file", file_path=file_path, error=str(e))
        raise HTTPException(500, "Error reading document from storage")

    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Document-SHA256":   sha256,
        }
    )
