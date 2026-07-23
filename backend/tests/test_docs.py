import pytest
import io
import docx
from datetime import datetime

DOC_TYPES = [
    'chargesheet',
    'medical_letter',
    'remand_request',
    'seizure_receipt',
    'court_custody',
    'panchanama',
    'face_id',
    'witness_statement'
]

@pytest.mark.asyncio
async def test_document_generation_all_types(async_client, sho_headers, io_headers):
    """Test generating docx documents for all 8 document types and verifying .docx format."""
    # 1. Create a test case with victim_injury=True to allow medical_letter generation
    payload = {
        "victim_name": "Kavita Desai",
        "victim_address": "404 Bodakdev Road, Ahmedabad",
        "victim_phone": "9723456789",
        "victim_age": 29,
        "victim_gender": "female",
        "victim_injury": True,
        "crime_type": "robbery",
        "crime_code": 309,
        "crime_narrative": "Victim injured during robbery attempt near Bodakdev.",
        "crime_date": datetime.utcnow().isoformat(),
        "crime_location": "Bodakdev S.G. Highway, Ahmedabad",
        "crime_lat": 23.0470,
        "crime_lon": 72.5060,
        "ward": "Bodakdev",
        "severity": 4,
        "accused_name": "Masked Robber",
        "accused_address": "Unknown",
        "accused_age": 30,
        "language": "en"
    }

    create_res = await async_client.post("/cases/create", json=payload, headers=io_headers)
    assert create_res.status_code == 200, f"Case creation failed: {create_res.text}"
    case_id = create_res.json()["case_id"]

    # 2. Test generation for all 8 document types
    for doc_type in DOC_TYPES:
        gen_payload = {
            "case_id": case_id,
            "doc_type": doc_type,
            "language": "en"
        }

        response = await async_client.post("/docs/generate", json=gen_payload, headers=sho_headers)
        assert response.status_code == 200, f"Doc generation failed for {doc_type}: {response.text}"
        
        # Verify Content-Type header
        assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in response.headers.get("content-type", "")

        # Verify ZIP/Docx magic bytes
        assert response.content.startswith(b"PK\x03\x04"), f"Doc {doc_type} is not a valid zip/docx binary file"

        # Verify python-docx can parse the document
        doc = docx.Document(io.BytesIO(response.content))
        assert doc is not None

@pytest.mark.asyncio
async def test_list_case_documents(async_client, sho_headers, io_headers):
    """Test listing generated documents for a case."""
    payload = {
        "victim_name": "Meena Joshi",
        "victim_address": "Jamalpur, Ahmedabad",
        "victim_injury": True,
        "crime_type": "assault",
        "crime_narrative": "Assault incident",
        "crime_date": datetime.utcnow().isoformat(),
        "crime_location": "Jamalpur Gate",
        "crime_lat": 23.0370,
        "crime_lon": 72.6050,
        "severity": 3
    }
    create_res = await async_client.post("/cases/create", json=payload, headers=io_headers)
    assert create_res.status_code == 200
    case_id = create_res.json()["case_id"]

    # Generate one document
    await async_client.post("/docs/generate", json={"case_id": case_id, "doc_type": "chargesheet", "language": "en"}, headers=sho_headers)

    # List documents
    list_res = await async_client.get(f"/docs?case_id={case_id}", headers=sho_headers)
    assert list_res.status_code == 200
    docs_data = list_res.json()
    assert isinstance(docs_data, list)
    assert len(docs_data) >= 1
    assert docs_data[0]["doc_type"] == "chargesheet"
