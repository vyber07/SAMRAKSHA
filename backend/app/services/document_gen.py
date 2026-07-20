# app/services/document_gen.py

from docx import Document
import hashlib, io

TEMPLATES = {
    'chargesheet':      'templates/documents/chargesheet_bns2024.docx',
    'medical_letter':   'templates/documents/medical_letter.docx',
    'remand_request':   'templates/documents/remand_request_bnss.docx',
    'seizure_receipt':  'templates/documents/seizure_receipt.docx',
    'court_custody':    'templates/documents/court_custody_bnss.docx',
    'panchanama':       'templates/documents/accused_panchanama.docx',
    'face_id':          'templates/documents/face_identification.docx',
    'witness_statement': 'templates/documents/witness_statement.docx',
}

# GUJARATI DOMAIN GLOSSARY — override before IndicTrans2
GLOSSARY = {
    'FIR':          {'gu': 'ફ.ઇ.ર',       'hi': 'प्रथम सूचना रिपोर्ट'},
    'chargesheet':  {'gu': 'ચાજ્જશીટ',     'hi': 'आरोप पत्र'},
    'accused':      {'gu': 'આરોપી',        'hi': 'अभियुक्त'},
    'seizure':      {'gu': 'જપ્તી',         'hi': 'जब्ती'},
    'remand':       {'gu': 'રિમાન્ડ',       'hi': 'रिमांड'},
    'panchanama':   {'gu': 'પંચનામું',      'hi': 'पंचनामा'},
    'witness':      {'gu': 'એાક્ષી',        'hi': 'गवाह'},
    'arrest':       {'gu': 'ધરપકડ',        'hi': 'गिरफ्तारी'},
    'police station':{'gu': 'પોલીએ સ્ટેશન','hi': 'थाना'},
}

def generate_document(
    doc_type: str, 
    case: dict, 
    officer: dict,
    lang: str = 'en'
) -> tuple[bytes, str]:
    
    sections = case.get('bns_sections', [])
    
    # Context dictionary — all placeholders
    ctx = {
        'FIR_NO':           case['fir_no'],
        'DATE':             today_formatted(),
        'PS_NAME':          translate(case['ps_name'], lang),
        'IO_NAME':          officer['name'],
        'IO_BADGE':         officer['badge_no'],
        'VICTIM_NAME':      translate(case['victim_name'], lang),
        'VICTIM_ADDRESS':   translate(case['victim_address'], lang),
        'VICTIM_AGE':       str(case.get('victim_age', '')),
        'VICTIM_PHONE':     case.get('victim_phone', ''),
        'ACCUSED_NAME':     translate(case['accused_name'], lang),
        'ACCUSED_ADDRESS':  translate(case['accused_address'], lang),
        'ACCUSED_AGE':      str(case.get('accused_age', '')),
        'CRIME_TYPE':       translate(case['crime_type'], lang),
        'CRIME_DATE':       format_date(case['crime_date']),
        'CRIME_LOCATION':   translate(case['crime_location'], lang),
        'CRIME_NARRATIVE':  translate(case['crime_narrative'], lang),
        'BNS_SECTIONS':     ', '.join(case.get('bns_sections', [])),
        'BNSS_SECTIONS':    ', '.join(case.get('bnss_sections', [])),
        'BSA_SECTIONS':     ', '.join(case.get('bsa_sections', [])),
        'IPC_CROSSREF':     ', '.join(case.get('ipc_crossref', [])),
        'LANDMARK_CASES':   format_landmark_cases(case.get('landmark_cases',[])),
        'EVIDENCE_LIST':    format_evidence(case.get('evidence_items', []), lang),
        'WITNESS_LIST':     format_witnesses(case.get('witnesses', []), lang),
        'ARREST_DATE':      format_date(case.get('arrest_date')),
        'ARREST_LOCATION':  case.get('arrest_location', ''),
    }
    
    doc = Document(TEMPLATES[doc_type])
    
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
                                    run.text = run.text.replace(
                                        tag, str(val or ''))
    
    buf = io.BytesIO()
    doc.save(buf)
    raw = buf.getvalue()
    sha256 = hashlib.sha256(raw).hexdigest()
    
    return raw, sha256

# CRITICAL: All templates use BNS/BNSS/BSA 2024 ONLY
# IPC/CrPC appear only in cross-reference column
# Ctrl+F "Section " in every template before demo
# Any "IPC" or "CrPC" as primary section = court rejection risk

from datetime import datetime

def today_formatted():
    return datetime.utcnow().strftime('%Y-%m-%d')

def format_date(d):
    return d.strftime('%Y-%m-%d') if d else ''

def translate(text, lang):
    from app.services.translation import translator_service
    if not text: return ''
    if lang == 'en': return text
    return translator_service.translate(text, lang)

def format_landmark_cases(cases):
    if not cases: return ''
    return ', '.join([c if isinstance(c, str) else str(c) for c in cases])

def format_evidence(evidence, lang):
    if not evidence: return ''
    text = ', '.join([e if isinstance(e, str) else str(e) for e in evidence])
    return translate(text, lang)

def format_witnesses(witnesses, lang):
    if not witnesses: return ''
    text = ', '.join([w if isinstance(w, str) else str(w) for w in witnesses])
    return translate(text, lang)
