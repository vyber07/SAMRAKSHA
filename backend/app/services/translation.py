import logging

logger = logging.getLogger(__name__)

# ponytail: Lazy load heavy ML models only when needed. 
# For demo/dev environments without 5GB RAM to spare, we fallback if transformers fail.
_tokenizer = None
_model = None

def _load_model():
    global _tokenizer, _model
    if _model is not None:
        return
    try:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        import torch
        logger.info("Loading IndicTrans2 model...")
        model_name = "ai4bharat/indictrans2-en-indic-dist-200M"
        _tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
        _model = AutoModelForSeq2SeqLM.from_pretrained(model_name, trust_remote_code=True)
        if torch.cuda.is_available():
            _model = _model.to("cuda")
        _model.eval()
        logger.info("IndicTrans2 model loaded successfully.")
    except Exception as e:
        logger.warning(f"Failed to load IndicTrans2 model: {e}")
        _model = "failed"

def translate_text(text: str, target_lang: str) -> str:
    if not text or target_lang == 'en':
        return text

    _load_model()
    
    # If model failed to load (e.g. out of memory, no internet), fallback
    if _model == "failed" or _model is None:
        return text

    try:
        import torch
        # IndicTrans2 target lang tokens are usually 'hin_Deva', 'guj_Gujr', etc.
        # Mapping generic 'hi' and 'gu' to IndicTrans2 tokens
        lang_map = {
            'hi': 'hin_Deva',
            'gu': 'guj_Gujr'
        }
        tgt_lang_token = lang_map.get(target_lang)
        if not tgt_lang_token:
            return text

        inputs = _tokenizer(text, return_tensors="pt", padding=True, truncation=True)
        if torch.cuda.is_available():
            inputs = {k: v.to("cuda") for k, v in inputs.items()}
            
        with torch.no_grad():
            outputs = _model.generate(
                **inputs, 
                forced_bos_token_id=_tokenizer.convert_tokens_to_ids(tgt_lang_token),
                max_length=256
            )
        
        translated_text = _tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
        return translated_text
    except Exception as e:
        logger.error(f"IndicTrans2 translation failed: {e}")
        return text
