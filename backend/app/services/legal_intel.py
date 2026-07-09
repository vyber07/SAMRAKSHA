import re
import httpx
import os

SECTION_MAP = {
    r'snatch|snatching|chain pull':  {'bns':['BNS 309'],'bnss':['BNSS 170']},
    r'robbery|loot':                 {'bns':['BNS 309','BNS 310'],'bnss':['BNSS 170']},
    r'theft|chori|stolen|steal':     {'bns':['BNS 303','BNS 304'],'bnss':['BNSS 170']},
    r'murder|kill|death|homicide':   {'bns':['BNS 101','BNS 103'],'bnss':['BNSS 173']},
    r'assault|beat|hurt|attack':     {'bns':['BNS 115','BNS 117'],'bnss':['BNSS 170']},
    r'rape|sexual assault':          {'bns':['BNS 63','BNS 70'],'bnss':['BNSS 173']},
    r'kidnap|abduct':                {'bns':['BNS 137','BNS 140'],'bnss':['BNSS 170']},
    r'upi|fraud|phishing|otp':       {'bns':['BNS 318','BNS 316'],'other':['IT Act 66D']},
    r'organised|gang|conspiracy':    {'bns':['BNS 111','BNS 61'],'bnss':['BNSS 173']},
    r'drug|narcotic|ganja':          {'other':['NDPS 20','NDPS 22']},
    r'stalking|harassment':          {'bns':['BNS 78','BNS 79']},
    r'extortion|blackmail':          {'bns':['BNS 308'],'bnss':['BNSS 170']},
    r'riot|unlawful assembly':       {'bns':['BNS 190','BNS 191']},
}

BNS_IPC_MAP = {
    'BNS 309': ['IPC 379', 'IPC 380'],
    'BNS 303': ['IPC 378'],
    'BNS 304': ['IPC 379'],
    'BNS 101': ['IPC 299'],
    'BNS 103': ['IPC 302'],
    'BNS 115': ['IPC 323'],
    'BNS 117': ['IPC 325'],
    'BNS 63': ['IPC 375', 'IPC 376'],
    'BNS 70': ['IPC 376D'],
    'BNS 137': ['IPC 359', 'IPC 360'],
    'BNS 140': ['IPC 363'],
    'BNS 318': ['IPC 415', 'IPC 420'],
    'BNS 316': ['IPC 405', 'IPC 406'],
    'BNS 111': ['IPC 120A', 'IPC 120B'],
    'BNS 61': ['IPC 120B'],
    'BNS 78': ['IPC 354D'],
    'BNS 79': ['IPC 509'],
    'BNS 308': ['IPC 383', 'IPC 384'],
    'BNS 190': ['IPC 141', 'IPC 143'],
    'BNS 191': ['IPC 146', 'IPC 147'],
}

def suggest_sections(narrative: str) -> dict:
    found = {'bns':[],'bnss':[],'bsa':[],'other':[]}
    nl = narrative.lower()
    for pattern, sections in SECTION_MAP.items():
        if re.search(pattern, nl):
            for law_type, codes in sections.items():
                found[law_type].extend(codes)
    return {k: list(set(v)) for k, v in found.items()}

def get_ipc_crossref(sections: dict) -> list:
    crossrefs = []
    bns_codes = sections.get('bns', [])
    for code in bns_codes:
        if code in BNS_IPC_MAP:
            crossrefs.extend(BNS_IPC_MAP[code])
    return list(set(crossrefs))

async def search_case_law(narrative: str) -> list:
    token = os.getenv("INDIAN_KANOON_TOKEN")
    if not token:
        return []
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                'https://api.indiankanoon.org/search/',
                params={'formInput': narrative, 'pagenum': 0},
                headers={'Authorization': f'Token {token}'}
            )
        results = resp.json()
        return [
            {
                'title': r['title'],
                'court': r['docsource'],
                'year':  r.get('publishdate','')[:4],
                'url':   r['url']
            }
            for r in results.get('docs', [])[:3]
        ]
    except Exception:
        return []
