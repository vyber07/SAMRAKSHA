SAMRAKSHA — Police Crime Monitoring & Case Management Platform
Security: Hardened Build: Passing API: 16/16 Endpoints Stack: FastAPI + React

Integrated AI-assisted law enforcement platform for Ahmedabad City Police.
Real-time CCTV analytics · Predictive patrolling · FIR/case management · Legal AI assistant · Multi-language support

Table of Contents
Overview
Features
Project Structure
Tech Stack
Quick Start
Environment Variables
Services
API Reference
Frontend Architecture
Backend Architecture
Database Schema
AI/ML Services
Security
Testing
Mobile App
Deployment
Overview
SAMRAKSHA is a production-grade full-stack police operations platform built for Ahmedabad City Police. It integrates real-time surveillance, AI-powered crime prediction, case management (FIR lifecycle), patrol coordination, legal intelligence, and multi-language document generation into a single unified dashboard.

All data is live — no mock data. Every UI element fetches from the live FastAPI backend backed by PostgreSQL/PostGIS and Redis.

Visuals / Screenshots
(Placeholders for future screenshots)

Dashboard Overview Live CCTV Analytics

Patrol Routing Map FIR Case Management

Features
🗂️ Case Management (FIR)
Create, update, and track FIRs through full lifecycle
Case diary entry system with evidence attachments
Accused/victim profile management with linking
CCTNS integration for national crime database sync
AI-powered case similarity and pattern matching
📹 CCTV Intelligence
Live feed grid with 46+ cameras across Ahmedabad zones
AI crowd density detection and loitering alerts
ANPR (automatic number plate recognition) matching against active FIRs
Alert escalation with zone-level severity scoring
🚔 Patrol Management
Real-time patrol unit tracking with GPS telemetry
AI-optimized route planning via OSRM engine
Unit status management (available / deployed / responding)
PCR (Police Control Room) incident dispatch integration
📊 Predictive Analytics
Zone-wise crime risk scoring (ML-powered, PostGIS backed)
Hourly / weekly / monthly trend charts from live incident data
Festival/event simulation for proactive deployment planning
Hotspot surge detection with 3-hour forward projection
🤖 Legal AI Assistant
Natural language query interface for Indian Penal Code / BNS 2024
Legal section search with context extraction
Multi-language support (Gujarati, Hindi, English via IndicTrans2)
Voice-to-text query input (OpenAI Whisper)
📄 Document Generation
One-click generation of legal documents from case data: Chargesheet (BNS 2024) · Medical Letter · Remand Request (BNSS) · Seizure Receipt · Court Custody · Panchanama · Face ID Report
.docx templates with live case data injection
👥 Admin & RBAC
Officer profile management with role-based access control
Audit trail for all critical actions
Permission system: analytics_view, case_create, patrol_manage, admin_*
🌐 Real-Time WebSocket
Live dashboard feed: new FIRs, CCTV alerts, ANPR matches, PCR incidents
JWT-authenticated WebSocket connections
Automatic reconnect with exponential backoff
Project Structure
samraksha/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── api/                    # Route handlers
│   │   │   ├── auth.py             # JWT auth, RBAC, login
│   │   │   ├── cases.py            # FIR CRUD + diary entries
│   │   │   ├── cctv.py             # CCTV feeds + alerts
│   │   │   ├── patrol.py           # Patrol units + route planning
│   │   │   ├── analytics.py        # Dashboard KPIs + trend charts
│   │   │   ├── assistant.py        # AI legal assistant query
│   │   │   ├── documents.py        # Document generation
│   │   │   ├── admin.py            # Officer management
│   │   │   ├── legal.py            # Legal section search
│   │   │   ├── incidents.py        # PCR incident webhook
│   │   │   ├── cctns.py            # CCTNS national DB integration
│   │   │   ├── hotspot.py          # Predictive hotspot API
│   │   │   ├── translate.py        # IndicTrans2 translation
│   │   │   └── websocket.py        # Real-time WebSocket hub
│   │   ├── core/
│   │   │   └── redis.py            # Redis connection pool
│   │   ├── db/
│   │   │   └── connection.py       # asyncpg + helpers
│   │   └── services/               # AI/ML service layer
│   │       ├── assistant.py        # Llama.cpp LLM integration
│   │       ├── prediction.py       # XGBoost crime prediction
│   │       ├── routing.py          # OR-Tools patrol routing
│   │       ├── document_gen.py     # python-docx generation
│   │       ├── legal_intel.py      # Legal DB + embedding search
│   │       ├── vision.py           # CCTV frame analysis (MediaPipe)
│   │       ├── voice.py            # Whisper STT
│   │       ├── translation.py      # IndicTrans2 multi-lang
│   │       └── audit.py            # Audit log service
│   ├── db/                         # Database management
│   │   ├── schema.sql              # Full PostgreSQL/PostGIS schema
│   │   ├── seed.py                 # Realistic Ahmedabad seed data
│   │   └── add_rbac_evidence.sql   # RBAC permissions migration
│   ├── alembic/                    # Schema migrations
│   │   └── env.py
│   ├── templates/
│   │   └── documents/              # .docx legal document templates
│   │       ├── chargesheet_bns2024.docx
│   │       ├── remand_request_bnss.docx
│   │       ├── medical_letter.docx
│   │       ├── seizure_receipt.docx
│   │       ├── court_custody_bnss.docx
│   │       ├── accused_panchanama.docx
│   │       ├── witness_statement.docx
│   │       └── face_identification.docx
│   ├── tests/                      # Pytest test suite (11 files)
│   ├── scripts/
│   │   └── generate_seed_data.py   # Extended seed generator
│   ├── main.py                     # FastAPI app + router mounting
│   ├── entrypoint.sh               # Docker entrypoint (schema + seed + run)
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                       # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── app/
│   │   │   └── App.tsx             # Monolithic app shell (all pages + components)
│   │   ├── lib/
│   │   │   └── api.ts              # Typed API client utilities
│   │   ├── tests/
│   │   │   └── store_and_component_state.test.js
│   │   ├── main.tsx                # React entry point
│   │   └── index.css               # Global styles + CSS variables
│   ├── nginx.conf                  # Nginx reverse proxy + WebSocket config
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json                # samraksha-frontend v1.0.0
│   └── Dockerfile                  # Multi-stage: node build → nginx serve
│
├── mobile/                         # React Native / Expo mobile app
│   ├── App.js
│   ├── app.json
│   └── assets/                     # App icons, splash screen
│
├── docs/                           # Project documentation
│   ├── PROJECT.md                  # Original project specification
│   └── VERIFICATION_REPORT.md      # Backend verification report
│
├── docker-compose.yml              # Production compose (all services)
├── docker-compose.debug.yml        # Debug overrides
├── .env.example                    # Environment variable template
├── .gitignore
└── README.md
Tech Stack
Backend
Layer	Technology
API Framework	FastAPI 0.111+ with async/await
ASGI Server	Uvicorn with uvloop
Database	PostgreSQL 16 + PostGIS 3.4
ORM / Driver	asyncpg (raw async SQL)
Migrations	Alembic
Cache / PubSub	Redis 7
Auth	JWT (python-jose) + bcrypt
Rate Limiting	SlowAPI
AI / LLM	Llama.cpp (local inference)
Crime Prediction	XGBoost + scikit-learn
Patrol Routing	Google OR-Tools
Computer Vision	MediaPipe + OpenCV
Speech-to-Text	OpenAI Whisper
Translation	IndicTrans2 (Gujarati/Hindi/English)
Route Engine	OSRM (Open Source Routing Machine)
Document Gen	python-docx
Logging	structlog
Frontend
Layer	Technology
Framework	React 18.3.1
Language	TypeScript 5.5
Build	Vite 6.4.3
Styling	Tailwind CSS 4.1.12
Charts	Recharts 2.15.2
Maps	Leaflet 1.9.4 + OpenStreetMap
Icons	Lucide React 0.487.0
HTTP	Axios 1.8+
Real-time	Native WebSocket API
Infrastructure
Component	Technology
Container Runtime	Docker + Docker Compose v2
Reverse Proxy	Nginx (Alpine)
OS	Linux (Ubuntu)
Quick Start
Prerequisites
Docker ≥ 24 and Docker Compose v2
8 GB RAM recommended (16 GB for full Llama.cpp inference)
Ports 80 (frontend), 5432, 6379 available
1. Clone & Configure Environment
git clone https://github.com/vyber07/SAMRAKSHA.git
cd SAMRAKSHA
cp .env.example .env
# Edit .env — set SECRET_KEY, POSTGRES_PASSWORD, API keys
2. Start All Services
docker compose up -d
First start will: pull images → run schema.sql → seed database → start all services.

3. Verify System Health
curl http://localhost/api/health
# → {"status": "ok", "version": "1.0.0"}
4. Access the Dashboard
URL: http://localhost
Default Badge: ADMIN001
Default Password: password123
⚠️ Change default credentials immediately before any production use.

Environment Variables
Copy .env.example and fill in all values:

cp .env.example .env
Variable	Required	Description
SECRET_KEY	✅	JWT signing key — must be 32+ random chars
POSTGRES_DB	✅	Database name (default: samraksha)
POSTGRES_USER	✅	Database user
POSTGRES_PASSWORD	✅	Database password
REDIS_URL	✅	Redis connection URL
ICCC_API_KEY	Webhook	ICCC CCTV integration key
PCR_WEBHOOK_TOKEN	Webhook	PCR incident webhook token
INCIDENT_WEBHOOK_KEY	Webhook	Alternative incident webhook key
CCTNS_API_KEY	Integration	CCTNS national DB API key
CCTV_API_KEY	Integration	CCTV system API key
JWT_ALGORITHM	Optional	JWT algorithm (default: HS256)
All webhook/API keys are 100% from environment variables — no hardcoded defaults in code.

Services
Container	Internal Port	Description
samraksha-frontend	80 → external	Nginx: React SPA + reverse proxy to API
samraksha-api	8000 (internal)	FastAPI backend
samraksha-postgres	5432 (internal)	PostgreSQL 16 + PostGIS 3.4
samraksha-redis	6379 (internal)	Redis cache + WebSocket pub/sub
samraksha-llamacpp	8080 (internal)	Llama.cpp inference server
samraksha-osrm	5000 (internal)	OSRM patrol route optimizer
API Reference
Interactive Swagger docs: http://localhost/api/docs
ReDoc: http://localhost/api/redoc

Authentication
POST /api/v1/auth/login
Content-Type: application/json

{"badge_no": "ADMIN001", "password": "password123"}
→ {"access_token": "...", "token_type": "bearer", "officer": {...}}
All subsequent requests require:

Authorization: Bearer <access_token>
Endpoint Groups
Analytics
Method	Path	Description
GET	/api/v1/analytics/summary	Dashboard KPIs (FIRs today, active alerts, patrol count)
GET	/api/v1/analytics/trends	Hourly/weekly/monthly/crime-type chart data
GET	/api/v1/analytics/resource_status	Patrol unit engagement breakdown
GET	/api/v1/analytics/hotspot_surge	Next 3h risk surge zones
GET	/api/v1/analytics/pattern_matches	AI pattern match alerts
POST	/api/v1/analytics/simulate	Festival/event deployment simulation
Cases / FIR
Method	Path	Description
GET	/api/v1/cases	List cases with filters
POST	/api/v1/cases/create	Create new FIR
GET	/api/v1/cases/{id}	Case detail
PATCH	/api/v1/cases/{id}	Update case
POST	/api/v1/cases/{id}/diary	Add diary entry
GET	/api/v1/cases/{id}/timeline	Case event timeline
CCTV
Method	Path	Description
GET	/api/v1/cctv	Recent CCTV alerts
GET	/api/v1/cctv/cameras	All camera feeds with status
POST	/api/v1/cctv/webhook	Ingest ICCC alert (webhook)
Patrol
Method	Path	Description
GET	/api/v1/patrol/units	All patrol units with GPS + status
GET	/api/v1/patrol/routes	Optimized patrol routes
PATCH	/api/v1/patrol/units/{id}/status	Update unit status
POST	/api/v1/patrol/reroute	AI route rerouting
Map / Zones
Method	Path	Description
GET	/api/v1/map/wards	Ward risk scores
GET	/api/v1/map/hotspots	Crime hotspot polygons
AI Assistant
Method	Path	Description
POST	/api/v1/assistant/query	Natural language legal query
POST	/api/v1/assistant/voice	Voice query (Whisper STT)
Legal
Method	Path	Description
GET	/api/v1/legal/search	Search IPC/BNS sections
GET	/api/v1/legal/sections/{id}	Section detail + case law
Documents
Method	Path	Description
POST	/api/v1/docs/generate	Generate legal document (.docx)
GET	/api/v1/docs/templates	List available templates
Admin
Method	Path	Description
GET	/api/v1/admin/officers	List all officers
POST	/api/v1/admin/officers	Create officer
PATCH	/api/v1/admin/officers/{id}	Update officer
DELETE	/api/v1/admin/officers/{id}	Deactivate officer
GET	/api/v1/admin/audit	Audit log
Health
Method	Path	Description
GET	/api/health	System health check
GET	/api/v1/health	Versioned health check
WebSocket
ws://localhost/api/v1/ws?token=<jwt>
ws://localhost/api/v1/ws/dashboard?token=<jwt>
Message types: NEW_FIR · CCTV_ALERT · ANPR_MATCH · PCR_INCIDENT · PATROL_UPDATE

Frontend Architecture
The frontend is a single-file monolithic React app (src/app/App.tsx) with internal components organized by concern:

AppContext — global state (auth, cases, CCTV alerts, patrol units, wards, WebSocket)
Data fetching — useEffect polling every 10s across 6 parallel API calls
Pages: Dashboard · Cases · CCTV · Patrol · Analytics · AI Assistant · Documents · Legal · Admin
Real-time — Native WebSocket connected to /api/v1/ws
Maps — Leaflet + OpenStreetMap (Ahmedabad-centered, no API key required)
All data is live from the backend — zero mock data in production paths.

Backend Architecture
HTTP Request
    ↓
Nginx (port 80)
    ↓
FastAPI (Uvicorn, port 8000)
    ↓
Route Handler (app/api/*.py)
    ↓ (auth via JWT middleware)
Service Layer (app/services/*.py)
    ↓
asyncpg → PostgreSQL/PostGIS
    ↓
Redis (cache + WebSocket broadcast)
Entry point: backend/main.py — mounts all routers under "" and "/api/v1"
Auth: JWT bearer tokens, require_permission() decorator per endpoint
Rate limiting: SlowAPI decorators on AI and document endpoints
Migrations: Alembic (backend/alembic/) + raw SQL in backend/db/schema.sql
Database Schema
Key tables (PostgreSQL/PostGIS):

Table	Description
officers	Police officer accounts with RBAC roles
cases	FIR records with full lifecycle state
case_diary	Timestamped diary entries per case
cctv_alerts	AI-detected CCTV events with coordinates
cctv_cameras	Camera inventory with status and zone
patrol_units	Unit locations, status, assignment
incidents	PCR incident records
zone_risk_scores	Hourly ML-computed risk per ward
legal_sections	IPC/BNS section embeddings for search
audit_logs	All critical actions audit trail
PostGIS extensions enable geospatial queries: hotspot polygons, nearest-unit routing, ward boundary containment.

AI/ML Services
Crime Prediction (services/prediction.py)
Model: XGBoost trained on 3-year Ahmedabad incident data
Features: Hour of day, day of week, ward, crime type, festival calendar
Output: Risk score 0–100 per ward/hour slot → zone_risk_scores table
Patrol Routing (services/routing.py)
Engine: Google OR-Tools VRP solver
Input: Active patrol units, open incidents, hotspots
Output: Optimized routes per unit via OSRM road network
Legal AI Assistant (services/assistant.py)
LLM: Llama.cpp local inference (no external API calls)
Index: BNS 2024 + IPC sections with embedding search
Languages: English / Hindi / Gujarati (IndicTrans2)
CCTV Vision (services/vision.py)
Framework: MediaPipe + OpenCV
Detections: Crowd density, loitering duration, face landmarks
ANPR: Number plate extraction + FIR database matching
Voice Input (services/voice.py)
Engine: OpenAI Whisper (local, base model)
Languages: English, Hindi, Gujarati
Output: Transcribed text → assistant query pipeline
Security
Implemented Hardening
Control	Implementation
Authentication	JWT HS256, python-jose, bcrypt passwords
Authorization	Per-endpoint require_permission() RBAC
Rate Limiting	SlowAPI on AI/document/search endpoints
WebSocket Auth	JWT validation on connect, 1008 close on failure
API Keys	100% from env vars — no hardcoded defaults
SQL Injection	Parameterized asyncpg queries throughout
CORS	Configurable via ALLOWED_ORIGINS env var
Gunicorn	Pinned >=22.0.0 (fixes HTTP smuggling CVEs)
Vite	Upgraded to 6.4.3 (patches all known Vite CVEs)
Resolved CVEs
CVE / Advisory	Package	Fix
GHSA-jgfp-53c3-624m	gunicorn	Pinned >=22.0.0 in requirements.txt
GHSA-w3h3-4rj7-4ph4	gunicorn	Pinned >=22.0.0 in requirements.txt
Vite arbitrary file read via WebSocket	vite	Upgraded to 6.4.3
Vite server.fs.deny bypass (Windows)	vite	Upgraded to 6.4.3
Vite path traversal in .map handling	vite	Upgraded to 6.4.3
Vite public dir name collision	vite	Upgraded to 6.4.3
React Router RCE / XSS / DoS / CSRF	react-router	Not used — removed with frontend_new/
Note: All React Router vulnerabilities were detected in frontend_new/package.json. That directory was deleted as part of the project reorganization. The active frontend (frontend/) does not use React Router.

Testing
Backend Tests
cd backend
pytest tests/ -v
Test File	Coverage Area
test_auth.py	Login, JWT, RBAC permissions
test_cases.py	FIR create, update, diary, timeline
test_cctv_map.py	CCTV alerts, cameras, map endpoints
test_incidents_patrol.py	Patrol units, routes, PCR incidents
test_analytics_assistant.py	Analytics + AI assistant queries
test_docs.py	Document generation (.docx)
test_admin.py	Officer CRUD, audit log
test_translation.py	Multi-language translation
test_cctns_and_prediction.py	CCTNS integration + ML prediction
test_stress.py	Load and stress tests
test_empirical.py	Empirical API verification
test_integration.py	Full end-to-end integration tests
test_router_boundary_edgecases.py	Edge cases + boundary conditions
Frontend Build Test
cd frontend
npm run build
Live API Smoke Test
python3 -c "
import urllib.request, json
r = urllib.request.Request('http://localhost/api/v1/auth/login',
    data=json.dumps({'badge_no':'ADMIN001','password':'password123'}).encode(),
    headers={'Content-Type':'application/json'})
print('Auth:', json.loads(urllib.request.urlopen(r).read())['officer']['name'])
"
Mobile App
Located in mobile/ — React Native / Expo application for field officers.

cd mobile
npm install
npx expo start
Connects to the same backend API. Requires the backend running and accessible on the network.

Deployment
Production Checklist
 Set SECRET_KEY to a 64-char random string
 Change all default passwords (ADMIN001 / password123)
 Set all webhook/integration API keys in .env
 Configure ALLOWED_ORIGINS to your domain
 Enable HTTPS (add SSL certs to nginx)
 Set up automated database backups
 Configure log rotation for Docker containers
 Review and set resource limits in docker-compose.yml
Build & Deploy
# Full rebuild
docker compose build

# Start all services
docker compose up -d

# View logs
docker compose logs -f api

# Database backup
docker exec samraksha-postgres pg_dump -U samraksha samraksha > backup.sql
Debug Mode
docker compose -f docker-compose.yml -f docker-compose.debug.yml up