# backend/app/api/translate.py
"""
Translation endpoint using IndicTrans2.
Supports English → 12 Indian languages and reverse.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Literal

from app.api.auth import get_current_officer
from app.services.translation import translator_service, LANG_CODES

router = APIRouter()

SUPPORTED_LANGS = list(LANG_CODES.keys())

class TranslateRequest(BaseModel):
    text: str
    target_lang: str          # e.g. "hi", "ta", "mr"
    source_lang: str = "en"   # default English input

class TranslateResponse(BaseModel):
    original:    str
    translated:  str
    source_lang: str
    target_lang: str
    model:       str = "IndicTrans2"

@router.post("/", response_model=TranslateResponse)
async def translate_text(
    body: TranslateRequest,
    officer = Depends(get_current_officer)
):
    if body.target_lang not in SUPPORTED_LANGS:
        raise HTTPException(
            400,
            f"Unsupported target language '{body.target_lang}'. "
            f"Supported: {', '.join(SUPPORTED_LANGS)}"
        )
    if body.source_lang not in SUPPORTED_LANGS:
        raise HTTPException(400, f"Unsupported source language '{body.source_lang}'")
    if not body.text.strip():
        raise HTTPException(400, "text cannot be empty")

    translated = translator_service.translate(
        body.text,
        target_lang=body.target_lang,
        source_lang=body.source_lang,
    )

    return TranslateResponse(
        original=body.text,
        translated=translated,
        source_lang=body.source_lang,
        target_lang=body.target_lang,
    )

@router.get("/languages")
async def list_languages(officer = Depends(get_current_officer)):
    """List all supported language codes."""
    return {
        "languages": [
            {"code": code, "flores_code": flores}
            for code, flores in LANG_CODES.items()
        ]
    }
