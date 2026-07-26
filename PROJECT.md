# Project: SAMRAKSHA Police Crime Monitoring & Case Management

## Architecture & System Overview
- **Backend**: FastAPI (Python 3.11/3.12 async), Async SQLAlchemy, Asyncpg, PostGIS, Redis, Google OR-Tools, XGBoost, Scikit-Learn, python-docx, Llama.cpp / Whisper stub.
- **Frontend**: React 19 / Vite / Tailwind CSS / Shadcn UI / Leaflet / Zustand / Axios.
- **Infrastructure**: Docker Compose (PostgreSQL+PostGIS 16-3.4, Redis 7, FastAPI backend, React/Nginx frontend, OSRM backend, Llama.cpp server, Seed init).

## Code Layout
- Backend: `/home/ubuntu/sa/backend/`
  - Routes: `/home/ubuntu/sa/backend/app/api/` (auth, cases, incident, docs, patrol, map, cctv, assistant, legal, ws, admin, analytics, translate, health, cctns)
  - Services: `/home/ubuntu/sa/backend/app/services/` (prediction, routing, legal_intel, document_gen, translation, vision, voice, audit, assistant)
  - DB Schema & Models: `/home/ubuntu/sa/backend/app/db/`, `/home/ubuntu/sa/backend/db/schema.sql`
  - Tests: `/home/ubuntu/sa/backend/tests/`
- Frontend Live: `/home/ubuntu/sa/frontend/`
  - Components: `/home/ubuntu/sa/frontend/src/components/` (including `ui/` for 48 Shadcn components)
  - Pages: `/home/ubuntu/sa/frontend/src/pages/` (10 core pages migrated & integrated)
  - Stores & API: `/home/ubuntu/sa/frontend/src/lib/store.js` (Zustand) and `/home/ubuntu/sa/frontend/src/lib/api.js` (Axios)
- Frontend Source Source/New: `/home/ubuntu/sa/frontend_new/`

## Milestones for Frontend Migration & Integration
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Baseline Exploration & Architecture Mapping | Audit `frontend/` vs `frontend_new/`, state stores, API clients, and UI component dependencies | None | DONE |
| 2 | Package Dependencies & UI Components Setup | Update `package.json`, install Tailwind/Shadcn deps, copy `ui` components to `frontend/src/components/ui` | M1 | DONE |
| 3 | Page Features Migration & API/Store Integration | Rebuild/update pages in `frontend/src/pages/` using UI components and real Zustand stores/Axios APIs | M2 | DONE |
| 4 | Build Verification & Docker Deployment | Verify `npm run build` exit code 0, build and launch `docker compose build frontend && docker compose up -d frontend` | M3 | DONE |
| 5 | Verification Gate & Forensic Audit | Run Reviewer, Challenger, and Forensic Auditor verification checks | M4 | DONE |

## Interface Contracts & Standards
- API Base: `http://localhost:8000` (or `/api`)
- JWT Auth: Bearer token header (`samraksha_token` or `Authorization: Bearer <token>`)
- State Management: Zustand (`authStore`, `wsStore`, `mapStore`, `dashboardStore`)
- HTTP Client: Axios
- UI System: Tailwind CSS v4 + Shadcn UI primitives + Leaflet maps
