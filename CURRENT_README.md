# SAMRAKSHA

SAMRAKSHA is an intelligent legal assistant platform designed for streamlining legal case management and document analysis.

## Current State & Architecture
This project has recently undergone an architectural and security remediation to prepare for production deployment.

### Key Improvements:
* **WebSockets Integration:** We have migrated from polling to real WebSocket endpoints (e.g., `/ws/chat/{client_id}`) for live messaging and status updates.
* **CORS Security:** CORS policies have been hardened, replacing `allow_origins=["*"]` with specific, strict origins and enabling appropriate credentials and methods.
* **API Standardization:** Fixed malformed endpoints and standardized routing.
* **Archive Cleanup:** Removed unnecessary scaffolding (like the `mobile/` default Expo starter), unused `.zip` artifacts, and stale `.agents` directories.

## Running the Application
The platform consists of a FastAPI backend and a React/Vite frontend.

1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
