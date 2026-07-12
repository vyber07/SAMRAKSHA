from pydantic import BaseModel
import structlog
import torch

logger = structlog.get_logger()

# Global variables for model
_indic_model = None
_indic_tokenizer = None

def load_indic_model():
    global _indic_model, _indic_tokenizer
    if _indic_model is None:
        try:
            logger.info("Loading IndicTrans2 model...")
            from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
            model_name = "ai4bharat/indictrans2-en-indic-1B"
            _indic_tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            _indic_model = AutoModelForSeq2SeqLM.from_pretrained(model_name, trust_remote_code=True)
            if torch.cuda.is_available():
                _indic_model = _indic_model.cuda()
            logger.info("IndicTrans2 model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load IndicTrans2 model: {e}")
            _indic_model = "failed" # Mark as failed to avoid retrying
    return _indic_model, _indic_tokenizer

class Translator:
    def __init__(self):
        self.glossary = {
            "FIR": "Prathamik Suchna Report (प्राथमिक सूचना रिपोर्ट)",
            "Police Station": "Police Thana (पुलिस थाना)",
            "Theft": "Chori (चोरी)",
            "Assault": "Hassla (हमला)",
            "Accident": "Durghatna (दुर्घटना)"
        }

    def translate(self, text: str, target_lang: str) -> str:
        if target_lang == 'en' or not text:
            return text
            
        # Check glossary first
        for key, val in self.glossary.items():
            text = text.replace(key, val)
            
        model, tokenizer = load_indic_model()
        if model is None or model == "failed":
            logger.warning("IndicTrans2 not available, returning original text")
            return text
            
        # Use IndicTrans2
        try:
            # Format depends on IndicTrans2 specific tokenization
            # Simple approximation here for standard huggingface translation models
            inputs = tokenizer(text, return_tensors="pt")
            if torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
                
            with torch.no_grad():
                outputs = model.generate(**inputs, max_length=256)
                
            translated = tokenizer.decode(outputs[0], skip_special_tokens=True)
            return translated
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return text

translator_service = Translator()
