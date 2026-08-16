# 🛡️ SAMRAKSHA: Advanced Police Intelligence & Case Management

![Samraksha Dashboard](/placeholder/dashboard.png)

SAMRAKSHA is an integrated, full-stack intelligence and case management platform built exclusively for law enforcement. It consolidates daily policing operations into a single, high-performance interface, featuring real-time CCTV anomaly detection, optimized patrol routing, automated legal mapping, and multilingual AI assistance.

## 🚀 Key Features

- **📂 Case & Incident Management**: End-to-end digital tracking of FIRs, evidence, and case diaries, fully integrated with CCTNS standards.
- **🗺️ Dynamic Patrol Routing**: Real-time geospatial allocation of patrol units to high-risk hotspots utilizing OSRM and Google OR-Tools.
- **📹 Vision AI (CCTV)**: Live CCTV stream processing using MediaPipe for loitering detection and LLaVA for complex threat analysis.
- **⚖️ Legal Intelligence**: Automatic mapping of natural language crime narratives to precise BNS, BNSS, and BSA sections via the Indian Kanoon API.
- **🤖 Multilingual AI Assistant**: An integrated conversational AI designed to assist officers in their native languages (powered by IndicTrans2 and LLaMA).
- **📄 Automated Document Generation**: Instantly generate legally compliant documents (chargesheets, seizure receipts, remand requests) directly from case context.

## 🛠️ Technology Stack

**Frontend**
- ⚛️ React 18 & Vite (TypeScript)
- 🎨 TailwindCSS
- 📊 Recharts & 🗺️ Leaflet

**Backend & Infrastructure**
- 🐍 FastAPI (Python) & Uvicorn
- 🐘 PostgreSQL & PostGIS (asyncpg & SQLAlchemy)
- 🔴 Redis (asyncio)
- 🐳 Docker (OSRM Routing Machine)
- 🧠 MediaPipe & LLaMA.cpp (Vision/NLP)

## 📋 Prerequisites

Before installing SAMRAKSHA, ensure you have the following installed on your system:
- **Node.js** (v18+) and **npm**
- **Python** (3.10+)
- **PostgreSQL** (with PostGIS extension)
- **Redis Server**
- **FFmpeg** (for CCTV stream processing)

## ⚙️ Local Installation Guide

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/samraksha.git
cd samraksha
```

### 2. Use Python 3.10+ and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Database Seeding (New in Phase 7)**:
   To populate the system with realistic Ahmedabad City Police data (Officers, Cases, Hotspots, CCTV Alerts), run the dedicated seeding script before starting the server:
   ```bash
   # From the backend directory:
   python -m app.db.seed
   ```

4. Run the FastAPI server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

Set up your `.env` file in the `backend/` directory:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost/samraksha
REDIS_URL=redis://localhost:6379/0
OSRM_URL=http://localhost:5000
LLAMACPP_URL=http://localhost:8080
INDIAN_KANOON_TOKEN=your_api_token_here
JWT_SECRET=your_secure_jwt_secret
```

Run database migrations and start the server:
```bash
alembic upgrade head
uvicorn app.main:app --reload
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:5173`.

## 🔄 Recent Migration & Changelog (v2.0)

The SAMRAKSHA architecture recently underwent a massive structural overhaul to ensure production-grade scalability and performance:
- **Database Layer Modernization**: Completely eradicated legacy `$1` custom Postgres interpolation wrappers (`convert_query`). The entire backend now natively utilizes secure, parameterized SQLAlchemy bindings (`:param`), eliminating arbitrary abstractions and hardening against SQL injection.
- **Template Engine Upgrade**: Replaced 100+ lines of fragile, hand-rolled document substitution logic with `docxtpl` for robust Jinja2-based `.docx` generation.
- **Vision Pipeline Optimization**: Stripped out expensive `ffmpeg` sub-processing calls in favor of native, low-latency `cv2.VideoCapture` streams.
- **Dependency Cleansing**: Removed unmaintained legacy proxy files, duplicate API fetch wrappers, and unused LLM convenience functions, drastically reducing repository dead weight.

## 📚 API Reference
A fully interactive OpenAPI (Swagger) documentation suite is available locally when the backend is running.
Navigate to: `http://localhost:8000/docs`
