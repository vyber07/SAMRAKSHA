"""
IndicTrans2 translation service.
Model: ai4bharat/indictrans2-en-indic-1B  (English → 22 Indian languages)
       ai4bharat/indictrans2-indic-en-1B  (22 Indian languages → English)

Requires: pip install git+https://github.com/VarunGumma/IndicTransTokenizer
Package installs as: indictranstoolkit
Python module name:  IndicTransToolkit  (IndicProcessor inside it)

Lazy-loaded at first use — startup is not blocked.
"""

import structlog
import torch

logger = structlog.get_logger()

# Supported language codes (Flores-200 format used by IndicTrans2)
LANG_CODES = {
    "hi": "hin_Deva",  # Hindi
    "mr": "mar_Deva",  # Marathi
    "ta": "tam_Taml",  # Tamil
    "te": "tel_Telu",  # Telugu
    "kn": "kan_Knda",  # Kannada
    "gu": "guj_Gujr",  # Gujarati
    "pa": "pan_Guru",  # Punjabi
    "bn": "ben_Beng",  # Bengali
    "or": "ory_Orya",  # Odia
    "ml": "mal_Mlym",  # Malayalam
    "as": "asm_Beng",  # Assamese
    "ur": "urd_Arab",  # Urdu
    "en": "eng_Latn",  # English
}

_models: dict = {}  # keyed by "en-indic" or "indic-en"
_processors: dict = {}


def _get_model_and_processor(direction: str):
    """Lazy-load the IndicTrans2 model for the given direction."""
    global _models, _processors

    if direction in _models:
        return _models[direction], _processors[direction]

    model_map = {
        "en-indic": "ai4bharat/indictrans2-en-indic-1B",
        "indic-en": "ai4bharat/indictrans2-indic-en-1B",
    }
    model_name = model_map.get(direction)
    if not model_name:
        logger.error("Unknown translation direction", direction=direction)
        return None, None

    try:
        logger.info("Loading IndicTrans2 model", model=model_name)
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        from IndicTransToolkit import IndicProcessor

        processor = IndicProcessor(inference=True)
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            trust_remote_code=True,
        )
        model = AutoModelForSeq2SeqLM.from_pretrained(
            model_name,
            trust_remote_code=True,
        )
        device = "cuda" if torch.cuda.is_available() else "cpu"
        model = model.to(device)
        model.eval()

        _models[direction] = (model, tokenizer, device)
        _processors[direction] = processor
        logger.info("IndicTrans2 ready", direction=direction, device=device)
        return _models[direction], _processors[direction]

    except Exception as e:
        logger.error("IndicTrans2 load failed", error=str(e), direction=direction)
        _models[direction] = None  # Don't retry on import failure
        _processors[direction] = None
        return None, None


class Translator:
    """Translate text using IndicTrans2 or local Ollama (Llama3). Falls back to glossary on failure."""

    GLOSSARY = {
        "FIR": "Prathamik Suchna Report",
        "Police Station": "Police Thana",
        "Theft": "Chori",
        "Assault": "Hamla",
        "Accident": "Durghatna",
    }

    def translate(self, text: str, target_lang: str, source_lang: str = "en") -> str:
        if not text or target_lang == source_lang:
            return text

        # Determine direction
        if source_lang == "en" and target_lang != "en":
            direction = "en-indic"
            src_flores = LANG_CODES["en"]
            tgt_flores = LANG_CODES.get(target_lang)
        elif source_lang != "en" and target_lang == "en":
            direction = "indic-en"
            src_flores = LANG_CODES.get(source_lang)
            tgt_flores = LANG_CODES["en"]
        else:
            logger.warning("Indic→Indic not supported via this service")
            return text

        if not tgt_flores:
            logger.warning("Unknown target language", lang=target_lang)
            return text

        model_tuple, processor = _get_model_and_processor(direction)
        if model_tuple is None:
            logger.warning("IndicTrans2 unavailable, falling back to local Llama.cpp API")
            return self._apply_llamacpp_translation(text, source_lang, target_lang)

        model, tokenizer, device = model_tuple

        try:
            # Pre-process with IndicProcessor
            batch = processor.preprocess_batch(
                [text], src_lang=src_flores, tgt_lang=tgt_flores
            )
            inputs = tokenizer(
                batch,
                truncation=True,
                padding="longest",
                return_tensors="pt",
            ).to(device)

            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    num_beams=5,
                    num_return_sequences=1,
                    max_length=256,
                )

            decoded = tokenizer.batch_decode(outputs, skip_special_tokens=True)
            result = processor.postprocess_batch(decoded, lang=tgt_flores)
            return result[0] if result else text

        except Exception as e:
            logger.error("IndicTrans2 inference failed", error=str(e))
            return self._apply_llamacpp_translation(text, source_lang, target_lang)
            
    def _apply_llamacpp_translation(self, text: str, source_lang: str, target_lang: str) -> str:
        """Fallback translation using the local Llama.cpp model."""
        import requests
        try:
            prompt = f"Translate the following text from {source_lang} to {target_lang}. Reply ONLY with the translated text without any explanation, markdown, or quotes:\\n\\n{text}"
            resp = requests.post(
                "http://llamacpp:3389/v1/chat/completions",
                json={
                    "messages": [{"role": "user", "content": prompt}],
                    "stream": False
                },
                timeout=10.0
            )
            if resp.status_code == 200:
                translated = resp.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                if translated:
                    return translated
        except Exception as e:
            logger.error("Llama.cpp translation fallback failed", error=str(e))
            
        return self._apply_glossary(text)

    def _apply_glossary(self, text: str) -> str:
        for key, val in self.GLOSSARY.items():
            text = text.replace(key, val)
        return text


translator_service = Translator()
