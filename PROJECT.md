# Project: SAMRAKSHA Police Crime Monitoring & Case Management

## Architecture & System Overview
- **Backend**: FastAPI (Python 3.11/3.12 async), Async SQLAlchemy, Asyncpg, PostGIS, Redis, Google OR-Tools, XGBoost, Scikit-Learn, python-docx, Llama.cpp / Whisper stub.
- **Frontend**: React 19, Vite, Leaflet, Zustand, Axios, Glassmorphism UI.
- **Infrastructure**: Docker Compose (PostgreSQL+PostGIS 16-3.4, Redis 7, FastAPI backend, React/Nginx frontend, OSRM backend, Llama.cpp server, Seed init).

## Code Layout
- Backend: `/home/ubuntu/sa/backend/`
  - Routes: `/home/ubuntu/sa/backend/app/api/` (auth, cases, incident, docs, patrol, map, cctv, assistant, legal, ws, admin, analytics, translate, health, cctns)
  - Services: `/home/ubuntu/sa/backend/app/services/` (prediction, routing, legal_intel, document_gen, translation, vision, voice, audit, assistant)
  - DB Schema & Models: `/home/ubuntu/sa/backend/app/db/`, `/home/ubuntu/sa/backend/db/schema.sql`
  - Tests: `/home/ubuntu/sa/backend/tests/`
- Frontend: `/home/ubuntu/sa/frontend/`
  - Components & Widgets: `/home/ubuntu/sa/frontend/src/components/`
  - Pages: `/home/ubuntu/sa/frontend/src/pages/`
  - API Client & Store: `/home/ubuntu/sa/frontend/src/lib/`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Baseline Exploration & Audit | Comprehensive inspection of codebase, test suite, and requirement gaps | None | DONE |
| 2 | Phase 1 Rapid Response & Policing | Map hotspots, patrol VRP, CCTV ANPR, incident dispatch, SLA, WebSocket, Analytics | M1 | DONE |
| 3 | Phase 2 Case Management & Docs | Cases, FIR search, case diary, 8 BNS/BNSS document generation, PBAC, AI assistant | M1, M2 | DONE |
| 4 | E2E Verification & Report | Full functional suite test, generator test cases, generate `verification_report.md` | M2, M3 | IN_PROGRESS |
| 5 | Docker Compose Deployment | Clean deployment, docker compose build & startup validation without crashing | M4 | PLANNED |

## Interface Contracts & Standards
- API Base: `http://localhost:8000/api/v1` (or `/api`)
- JWT Auth: Bearer token header (`samraksha_token`), Redis blacklist check
- Document Templates: `.docx` format in `/backend/templates/documents`
- Verification Report: `/home/ubuntu/sa/verification_report.md`
