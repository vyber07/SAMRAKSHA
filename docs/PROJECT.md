# Project: SAMRAKSHA Police Platform Production Readiness

## Architecture
- **Backend**: FastAPI (Python 3.11) on port 8000 with Uvicorn.
- **Frontend**: React 19 / TypeScript / Vite on port 80 (Nginx).
- **Database**: PostgreSQL 16 + PostGIS 3.4 for spatial & relational queries.
- **Cache & Session**: Redis 7 for query caching, session management, and JWT revocation blacklist.
- **AI/ML Services**: Llama.cpp server on port 3389 for CrimeGPT/Assistant queries; CCTV computer vision analytics.
- **Routing Engine**: OSRM (Open Source Routing Machine) on port 5000 for patrol dispatch & route optimization.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Database & AI Service Wiring | Wire FastAPI endpoints to live PostgreSQL/PostGIS, Redis, Llama.cpp, OSRM | M1 | Backend Survey |
| 2 | Live REST/WS Backend Endpoints | Complete missing endpoints for FIR, patrol rerouting, CCTV alerts, AI query, docs, legal search, and admin CRUD | M1 | Backend Survey |
| 3 | Frontend Mock Removal & REST Binding | Replace all MOCK_* arrays, HOURLY/WEEKLY/MONTHLY static arrays, and setTimeout fallbacks in App.tsx with live REST/WS API calls | M2 | Frontend Survey |
| 4 | Dead File Cleanup | Audit and remove 31 unused legacy python script files from frontend/ | M2 | Frontend Survey |
| 5 | CORS & JWT Security Hardening | Restrict CORS wildcard origins, enforce strict 32-byte JWT secret keys, fail-closed Redis token blacklist check, and websocket token validation | M3 | Security Survey |
| 6 | API Key & Webhook Hardening | Remove hardcoded static keys ("iccc_api_key_2026", "pcr_webhook_token_2026", "cctns_secret_key_2026") from cctv.py, incidents.py, and cctns.py | M3 | Security Survey |
| 7 | Rate Limiting & Input Sanitization | Add slowapi rate limiting to expensive routes (/assistant/query, /docs/generate, /cases/search) and sanitize dynamic SQL column names | M3 | Security Survey |
| 8 | Infrastructure & OSRM Health Fix | Fix OSRM container healthcheck in docker-compose.yml and verify healthy status across all 6 core containers | M4 | Infra Survey |
| 9 | Frontend & Backend Test Suite | Add Vitest to frontend/package.json (npm test), build comprehensive E2E API test suite ensuring 100% 200 OK statuses across all routes | M4 | Infra Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1_Backend_AI_DB_Integration | Live DB/AI service connections & backend API route completion | None | DONE |
| 2 | M2_Frontend_Mock_Removal | Replace MOCK_* arrays & timer fallbacks with live API clients; dead file cleanup | M1 | IN_PROGRESS |
| 3 | M3_Security_Hardening | CORS restriction, JWT secret enforcement, webhook key hardening, rate limiting | M1 | PLANNED |
| 4 | M4_Testing_Production_Verification | Vitest setup, OSRM fix, full automated API test suite, clean docker build | M1, M2, M3 | PLANNED |

## Interface Contracts
### Frontend ↔ Backend REST API
- Base URL: `/api/v1`
- Auth Header: `Authorization: Bearer <token>`
- Content Type: `application/json`
- Response Format: `{ "status": "success", "data": ... }` or direct Pydantic schemas.

### Frontend ↔ Backend WebSockets
- Endpoint: `/ws/dashboard?token=<token>`
- Direction: Bidirectional real-time telemetry and incident alert broadcast.
- Event Types: `NEW_FIR`, `PCR_INCIDENT`, `CCTV_ALERT`, `ANPR_MATCH`.

## Code Layout
- Backend: `/home/ubuntu/sa/backend/app/` (`api/`, `core/`, `db/`, `models/`, `services/`)
- Frontend: `/home/ubuntu/sa/frontend/src/` (`app/App.tsx`, `lib/api.ts`, `lib/store.ts`, `components/`)
- Tests: `/home/ubuntu/sa/backend/tests/`, `/home/ubuntu/sa/frontend/src/__tests__/`
- Metadata: `/home/ubuntu/sa/.agents/`
