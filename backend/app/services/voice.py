import structlog
import os
import tempfile

logger = structlog.get_logger()

_whisper_model = None

def load_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            logger.info("Loading Whisper-small model...")
            import whisper
            # Load small model for speed/accuracy tradeoff
            _whisper_model = whisper.load_model("small")
            logger.info("Whisper model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load whisper model: {e}")
            _whisper_model = "failed"
    return _whisper_model

class VoiceService:
    def __init__(self):
        pass
        
    def transcribe(self, audio_bytes: bytes) -> str:
        model = load_whisper_model()
        if model is None or model == "failed":
            logger.warning("Whisper model not available, cannot transcribe")
            return "Transcription failed due to missing model."
            
        logger.info("Transcribing audio bytes...")
        
        # Whisper requires a file path or numpy array. The easiest is to save to temp file.
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
                
            result = model.transcribe(tmp_path)
            
            # Clean up temp file
            os.unlink(tmp_path)
            
            return result["text"].strip()
        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return "Transcription failed."

voice_service = VoiceService()
