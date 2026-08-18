from docxtpl import DocxTemplate
import hashlib, io, os

# Default legacy mappings
TEMPLATES = {
    'chargesheet':       'templates/documents/chargesheet_bns2024.docx',
    'medical_letter':    'templates/documents/medical_letter.docx',
    'remand_request':    'templates/documents/remand_request_bnss.docx',
    'seizure_receipt':   'templates/documents/seizure_receipt.docx',
    'court_custody':     'templates/documents/court_custody_bnss.docx',
    'panchanama':        'templates/documents/accused_panchanama.docx',
    'face_id':           'templates/documents/face_identification.docx',
    'witness_statement': 'templates/documents/witness_statement.docx',
}

def get_template_path(doc_type: str) -> str:
    doc_type = os.path.basename(doc_type)
    # First check exact match in templates
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    dynamic_path = os.path.join(base_dir, 'templates', 'documents', f'{doc_type}.docx')
    if os.path.exists(dynamic_path):
        return f'templates/documents/{doc_type}.docx'
        
    # Fallback to legacy mapped files or defaults
    if doc_type in TEMPLATES:
        return TEMPLATES[doc_type]
    
    # Generic fallback mapping for related documents
    generic_fallbacks = {
        'fir': 'chargesheet_bns2024.docx',
        'case_diary': 'accused_panchanama.docx',
        'arrest_memo': 'accused_panchanama.docx',
        'seizure_list': 'seizure_receipt.docx',
        'search_warrant': 'court_custody_bnss.docx',
        'bail_objection': 'remand_request_bnss.docx'
    }
    if doc_type in generic_fallbacks:
        return f'templates/documents/{generic_fallbacks[doc_type]}'
        
    # Final default assumption
    return f'templates/documents/{doc_type}.docx'

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
        'FIR_NO':           case.get('fir_no', ''),
        'DATE':             today_formatted(),
        'PS_NAME':          translate(case.get('ps_name', ''), lang),
        'IO_NAME':          officer.get('name', ''),
        'IO_BADGE':         officer.get('badge_no', ''),
        'VICTIM_NAME':      translate(case.get('victim_name', ''), lang),
        'VICTIM_ADDRESS':   translate(case.get('victim_address', ''), lang),
        'VICTIM_AGE':       str(case.get('victim_age', '')),
        'VICTIM_PHONE':     case.get('victim_phone', ''),
        'ACCUSED_NAME':     translate(case.get('accused_name', ''), lang),
        'ACCUSED_ADDRESS':  translate(case.get('accused_address', ''), lang),
        'ACCUSED_AGE':      str(case.get('accused_age', '')),
        'CRIME_TYPE':       translate(case.get('crime_type', ''), lang),
        'CRIME_DATE':       format_date(case.get('crime_date')),
        'CRIME_LOCATION':   translate(case.get('crime_location', ''), lang),
        'CRIME_NARRATIVE':  translate(case.get('crime_narrative', ''), lang),
        'BNS_SECTIONS':     ', '.join(case.get('bns_sections') or []),
        'BNSS_SECTIONS':    ', '.join(case.get('bnss_sections') or []),
        'BSA_SECTIONS':     ', '.join(case.get('bsa_sections') or []),
        'IPC_CROSSREF':     ', '.join(case.get('ipc_crossref') or []),
        'LANDMARK_CASES':   format_landmark_cases(case.get('landmark_cases') or []),
        'EVIDENCE_LIST':    format_evidence(case.get('evidence_items') or [], lang),
        'WITNESS_LIST':     format_witnesses(case.get('witnesses') or [], lang),
        'ARREST_DATE':      format_date(case.get('arrest_date')),
        'ARREST_LOCATION':  case.get('arrest_location', ''),
    }
    
    template_path = get_template_path(doc_type)
    if not os.path.exists(template_path):
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        alt_path = os.path.join(base_dir, template_path)
        if os.path.exists(alt_path):
            template_path = alt_path

    doc = DocxTemplate(template_path)
    doc.render(ctx)
    
    buf = io.BytesIO()
    doc.save(buf)
    raw = buf.getvalue()
    sha256 = hashlib.sha256(raw).hexdigest()
    
    return raw, sha256

# CRITICAL: All templates use BNS/BNSS/BSA 2024 ONLY
# IPC/CrPC appear only in cross-reference column
# Any "IPC" or "CrPC" as primary section = court rejection risk
from datetime import datetime, timezone

def today_formatted():
    return datetime.now(timezone.utc).strftime('%Y-%m-%d')

def format_date(d):
    return d.strftime('%Y-%m-%d') if d else ''

def translate(text, lang):
    from app.services.translation import translator_service
    if not text: return ''
    if lang == 'en': return text
    
    # 1. Try IndicTrans2 first (expects pure English source)
    res = None
    if hasattr(translator_service, 'translate_sync'):
        res = translator_service.translate_sync(text, lang)
    else:
        res = translator_service.translate(text, lang)
        
    # If IndicTrans2 succeeded and actually changed the text, return it
    if res and res != text and res != getattr(translator_service, '_apply_glossary', lambda x: x)(text):
        return res

    # 2. Fallback: Apply local domain GLOSSARY if IndicTrans2 failed or returned English
    fallback_text = text
    if isinstance(text, str):
        for eng_key, translations in GLOSSARY.items():
            replacement = translations.get(lang)
            if replacement:
                # Basic string replacement fallback
                fallback_text = fallback_text.replace(eng_key, replacement)
                fallback_text = fallback_text.replace(eng_key.title(), replacement)
                fallback_text = fallback_text.replace(eng_key.upper(), replacement)
                fallback_text = fallback_text.replace(eng_key.lower(), replacement)
                
    return fallback_text

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
