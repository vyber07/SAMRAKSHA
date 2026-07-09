from docx import Document
import hashlib
import io
import os
from datetime import datetime

TEMPLATES = {
    'chargesheet':      'templates/documents/chargesheet_bns2024.docx',
    'medical_letter':   'templates/documents/medical_letter.docx',
    'remand_request':   'templates/documents/remand_request_bnss.docx',
    'seizure_receipt':  'templates/documents/seizure_receipt.docx',
    'court_custody':    'templates/documents/court_custody_bnss.docx',
    'panchanama':       'templates/documents/accused_panchanama.docx',
    'face_id':          'templates/documents/face_identification.docx',
}

# Gujarati & Hindi glossaries
GLOSSARY = {
    'en': {
        'fir': 'First Information Report (FIR)',
        'chargesheet': 'Chargesheet',
        'accused': 'Accused',
        'seizure': 'Seizure Receipt',
        'remand': 'Remand Application',
        'panchanama': 'Panchanama',
        'witness': 'Witness Statement',
        'arrest': 'Arrest Memo',
    },
    'gu': {
        'fir': 'પ્રથમ માહિતી અહેવાલ (એફ.આઈ.આર.)',
        'chargesheet': 'આરોપનામું (ચાર્જશીટ)',
        'accused': 'આરોપી',
        'seizure': 'જપ્તી યાદી',
        'remand': 'રિમાન્ડ અરજી',
        'panchanama': 'પંચનામું',
        'witness': 'સાક્ષીનું નિવેદન',
        'arrest': 'ધરપકડ પત્રક',
    },
    'hi': {
        'fir': 'प्रथम सूचना रिपोर्ट (एफआईआर)',
        'chargesheet': 'आरोप पत्र (चार्जशीट)',
        'accused': 'अभियुक्त',
        'seizure': 'जब्ती सूची',
        'remand': 'रिमांड आवेदन',
        'panchanama': 'पंचनामा',
        'witness': 'गवाह का बयान',
        'arrest': 'गिरफ्तारी पत्र',
    }
}

def translate(text: str, lang: str) -> str:
    if not text:
        return ""
    # Simple dictionary fallback translation logic
    # In production this would call IndicTrans2
    # We will translate known glossary terms
    lowered = text.lower()
    if lang in GLOSSARY:
        for en_key, trans_val in GLOSSARY[lang].items():
            if en_key in lowered:
                return trans_val
    return text

def today_formatted() -> str:
    return datetime.now().strftime("%d-%m-%Y")

def format_date(dt_val) -> str:
    if not dt_val:
        return ""
    if isinstance(dt_val, str):
        try:
            dt_val = datetime.fromisoformat(dt_val.replace("Z", "+00:00"))
        except ValueError:
            return dt_val
    return dt_val.strftime("%d-%m-%Y %H:%M")

def format_evidence(items: list, lang: str) -> str:
    if not items:
        return "None"
    formatted = []
    for idx, item in enumerate(items, 1):
        name = translate(item.get('item', 'Item'), lang)
        desc = translate(item.get('description', ''), lang)
        val = item.get('value', '')
        val_str = f" (Value: Rs. {val})" if val else ""
        formatted.append(f"{idx}. {name}: {desc}{val_str}")
    return "\n".join(formatted)

def format_witnesses(witnesses: list, lang: str) -> str:
    if not witnesses:
        return "None"
    formatted = []
    for idx, w in enumerate(witnesses, 1):
        name = translate(w.get('name', ''), lang)
        statement = translate(w.get('statement', ''), lang)
        formatted.append(f"{idx}. Name: {name} - Statement: {statement}")
    return "\n".join(formatted)

def format_landmark_cases(cases: list) -> str:
    if not cases:
        return "None cited"
    return ", ".join(cases)

def create_default_template_file(doc_type: str, path: str):
    # Auto-generates a simple docx template file with appropriate placeholders
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc = Document()
    
    title_map = {
        'chargesheet': "PURVANI CHARGESHEET (UNDER BNSS 2024)",
        'medical_letter': "MEDICAL TREATMENT REQUISITION LETTER",
        'remand_request': "POLICE CUSTODY REMAND REQUEST (UNDER BNSS SEC 187)",
        'seizure_receipt': "SEIZURE RECEIPT (PANCHANAMA SEIZURE OF PROPERTY)",
        'court_custody': "COURT CUSTODY LETTER (UNDER BNSS)",
        'panchanama': "ACCUSED PANCHANAMA OF CRIME SCENE",
        'face_id': "FACE IDENTIFICATION FORM FOR SYSTEM RECORD",
    }
    
    doc.add_heading(title_map.get(doc_type, "POLICE DOCUMENT"), level=1)
    doc.add_paragraph("SAMRAKSHA SECURE DOCUMENT INTEGRITY SYSTEM")
    doc.add_paragraph("========================================")
    
    doc.add_paragraph("FIR Number: {{FIR_NO}}")
    doc.add_paragraph("Date of Document: {{DATE}}")
    doc.add_paragraph("Police Station: {{PS_NAME}}")
    doc.add_paragraph("Investigating Officer: {{IO_NAME}} (Badge: {{IO_BADGE}})")
    
    doc.add_heading("Case Details", level=2)
    doc.add_paragraph("Victim Name: {{VICTIM_NAME}}")
    doc.add_paragraph("Victim Address: {{VICTIM_ADDRESS}}")
    doc.add_paragraph("Victim Age: {{VICTIM_AGE}}  |  Victim Phone: {{VICTIM_PHONE}}")
    doc.add_paragraph("Accused Name: {{ACCUSED_NAME}}")
    doc.add_paragraph("Accused Address: {{ACCUSED_ADDRESS}}  |  Accused Age: {{ACCUSED_AGE}}")
    doc.add_paragraph("Arrest Date: {{ARREST_DATE}}  |  Arrest Location: {{ARREST_LOCATION}}")
    
    doc.add_heading("Incident Description", level=2)
    doc.add_paragraph("Crime Type: {{CRIME_TYPE}}")
    doc.add_paragraph("Date of Occurrence: {{CRIME_DATE}}")
    doc.add_paragraph("Location: {{CRIME_LOCATION}}")
    doc.add_paragraph("Narrative: {{CRIME_NARRATIVE}}")
    
    doc.add_heading("Legal Provisions Applied", level=2)
    doc.add_paragraph("Bharatiya Nyaya Sanhita (BNS) Sections: {{BNS_SECTIONS}}")
    doc.add_paragraph("Bharatiya Nagarik Suraksha Sanhita (BNSS) Sections: {{BNSS_SECTIONS}}")
    doc.add_paragraph("Bharatiya Sakshya Adhiniyam (BSA) Sections: {{BSA_SECTIONS}}")
    doc.add_paragraph("IPC/CrPC Historical Cross-References: {{IPC_CROSSREF}}")
    doc.add_paragraph("Landmark Precedents: {{LANDMARK_CASES}}")
    
    doc.add_heading("Material Evidence & Witnesses", level=2)
    doc.add_paragraph("Evidence List:\n{{EVIDENCE_LIST}}")
    doc.add_paragraph("Witnesses:\n{{WITNESS_LIST}}")
    
    doc.add_paragraph("\n\nSignature of Investigating Officer: ___________________")
    doc.add_paragraph("Generated Secure Hash: {{SHA256_HASH_STUB}}")
    
    doc.save(path)

def generate_document(
    doc_type: str, 
    case: dict, 
    officer: dict,
    lang: str = 'en'
) -> tuple[bytes, str]:
    
    template_path = TEMPLATES.get(doc_type)
    if not template_path:
        raise ValueError(f"Invalid document type: {doc_type}")
        
    # Auto create template if missing
    if not os.path.exists(template_path):
        create_default_template_file(doc_type, template_path)
        
    ctx = {
        'FIR_NO':           case.get('fir_no', ''),
        'DATE':             today_formatted(),
        'PS_NAME':          translate(case.get('ps_name', 'Unknown PS'), lang),
        'IO_NAME':          officer.get('name', ''),
        'IO_BADGE':         officer.get('badge_no', ''),
        'VICTIM_NAME':      translate(case.get('victim_name', ''), lang),
        'VICTIM_ADDRESS':   translate(case.get('victim_address', ''), lang),
        'VICTIM_AGE':       str(case.get('victim_age') or ''),
        'VICTIM_PHONE':     case.get('victim_phone', ''),
        'ACCUSED_NAME':     translate(case.get('accused_name', 'Not identified'), lang),
        'ACCUSED_ADDRESS':  translate(case.get('accused_address', ''), lang),
        'ACCUSED_AGE':      str(case.get('accused_age') or ''),
        'CRIME_TYPE':       translate(case.get('crime_type', ''), lang),
        'CRIME_DATE':       format_date(case.get('crime_date')),
        'CRIME_LOCATION':   translate(case.get('crime_location', ''), lang),
        'CRIME_NARRATIVE':  translate(case.get('crime_narrative', ''), lang),
        'BNS_SECTIONS':     ', '.join(case.get('bns_sections') or []),
        'BNSS_SECTIONS':    ', '.join(case.get('bnss_sections') or []),
        'BSA_SECTIONS':     ', '.join(case.get('bsa_sections') or []),
        'IPC_CROSSREF':     ', '.join(case.get('ipc_crossref') or []),
        'LANDMARK_CASES':   format_landmark_cases(case.get('landmark_cases')),
        'EVIDENCE_LIST':    format_evidence(case.get('evidence_items'), lang),
        'WITNESS_LIST':     format_witnesses(case.get('witnesses'), lang),
        'ARREST_DATE':      format_date(case.get('arrest_date')),
        'ARREST_LOCATION':  case.get('arrest_location', ''),
    }
    
    doc = Document(template_path)
    
    # Replace in paragraphs
    for para in doc.paragraphs:
        for key, val in ctx.items():
            tag = '{{' + key + '}}'
            if tag in para.text:
                for run in para.runs:
                    if tag in run.text:
                        run.text = run.text.replace(tag, str(val or ''))
                        
    # Replace in tables
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                for para in cell.paragraphs:
                    for key, val in ctx.items():
                        tag = '{{' + key + '}}'
                        if tag in para.text:
                            for run in para.runs:
                                if tag in run.text:
                                    run.text = run.text.replace(tag, str(val or ''))
                                    
    buf = io.BytesIO()
    doc.save(buf)
    raw = buf.getvalue()
    sha256 = hashlib.sha256(raw).hexdigest()
    
    # We can inject the real hash by doing a simple pass if needed, or by leaving it as is.
    return raw, sha256
