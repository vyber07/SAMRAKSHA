# SAMRAKSHA Project Memory

This file is a durable working memory for future tasks in this repository. It describes the implementation observed on 2026-07-31; source code remains authoritative if this document becomes stale.

## Product

SAMRAKSHA is an Ahmedabad City Police operations platform: FIR/case management, CCTV/ANPR alerts, patrol dispatch and routing, predictive hotspot analytics, legal/CrimeGPT assistance, multilingual translation, legal document generation, administration/RBAC, audit logs, and a dashboard WebSocket.

## Repository layout

- `backend/`: FastAPI application, raw async SQLAlchemy/asyncpg-style helpers, PostgreSQL/PostGIS schema and seed scripts, service layer, Docker entrypoint, pytest suite, and DOCX legal templates.
- `frontend/`: React 18 + TypeScript + Vite SPA. `src/app/App.tsx` is the shell; `src/components/views/` contains dashboard views; `src/components/ui/` contains reusable glassmorphism controls; `src/components/map/LeafletMap.tsx` owns Leaflet layers and canvas heatmap rendering; `src/lib/api.ts` is the typed HTTP client; `src/lib/types.ts` contains domain types; `src/context/` contains auth/theme state.
- `mobile/`: Minimal Expo 57 starter app; currently only renders the starter screen and is not integrated with the backend.
- `docs/`: original production-readiness specification and verification report.
- Root Docker Compose files orchestrate frontend, API, PostgreSQL/PostGIS, Redis, OSRM, and Llama/AI-related services as configured by the compose files.

## Backend startup and routing

- Entry point: `backend/main.py`.
- FastAPI lifespan initializes/disposes the database engine. Production rejects known weak JWT secrets.
- Routers are mounted twice, at both `/` and `/api/v1`: `auth`, `cases`, `incident`, `docs`, `patrol`, `map`, `cctv`, `assistant`, `legal`, `ws`, `admin`, `analytics`, `translate`, and `cctns`.
- Health endpoints: `/health` and `/api/health`.
- CORS currently allows all origins, methods, and headers with credentials disabled; this is a known security/configuration gap despite the documentation’s hardening claims.
- Rate limiting is configured with SlowAPI, but route-level coverage must be checked before assuming all expensive endpoints are limited.

## API surface

- Auth: `POST /auth/login`, `POST /auth/logout`; JWT HS256 tokens include officer id, role, station id, expiry, issue time, and JTI. Redis is consulted for token blacklist status. Permission overrides are loaded from the database.
- Cases: `POST /cases/create`, `GET /cases`, `GET /cases/search`, `GET /cases/{case_id}`, `POST /cases/{case_id}/diary`. FIR numbering uses the database `next_fir_number()` function.
- Incidents: PCR webhook/report ingestion and `/incident/sla_breaches`.
- Patrol: routes, PCR handling, patrol-unit list/create/update/delete; routing service uses OSRM when available and geodesic fallback otherwise.
- CCTV: camera listing, alert ingestion, async ANPR matching against active cases, anomaly listing.
- Analytics: dashboard summary, trends, event simulation, resource status, hotspot surge, pattern matches.
- Map/hotspot: heatmap, ward risk, incidents, active alerts, cybercrime layer.
- Assistant: legal/CrimeGPT query and voice query; LLM/service failures have fallback behavior and out-of-scope filtering.
- Documents: document generation and generated-document listing; `document_gen.py` injects case context into DOCX templates, hashes output, and records document logs.
- Legal: section suggestions and case-law search.
- Translation: text translation and language listing; service supports Gujarati/Hindi/English paths with external/local model fallbacks.
- CCTNS: API-key-protected sync and database-backed search, with optional configured external API fallback.
- WebSocket: `/ws/dashboard?token=<JWT>`; manager broadcasts `NEW_FIR`, `PCR_INCIDENT`, `CCTV_ALERT`, and `ANPR_MATCH` events.
- Admin: officer CRUD, system health, audit search, permission catalog, and officer permission overrides; admin role dependency protects these routes.

## Database

`backend/db/schema.sql` creates PostGIS, UUID, and trigram extensions and defines `officers`, `police_stations`, `cases`, `incidents`, `case_audit`, `case_diary`, `doc_log`, `cctv_alerts`, `zone_risk_scores`, `patrol_units`, `fir_sequences`, permissions/overrides, and `evidence`.

- `cases.geoloc`, `incidents.geoloc`, and CCTV geolocation are PostGIS geography points with GiST indexes.
- Case search uses a trigger-maintained weighted English `tsvector` and GIN index.
- Case audit is insert-only through no-op update/delete rules.
- FIR numbers are generated atomically per station/year with row-conflict update semantics.
- RBAC defaults and evidence table are supplemented by `db/add_rbac_evidence.sql`.
- `backend/app/db/connection.py` uses an async SQLAlchemy engine with `NullPool`; `convert_query()` translates PostgreSQL `$1` placeholders to SQLAlchemy named parameters while preserving `::casts`; `fetch_one`, `fetch_all`, and `execute` are the common database helpers.
- Redis access is lazy and event-loop keyed in `backend/app/core/redis.py`.

## Backend services

- `prediction.py`: KDE heatmap, DBSCAN clustering, and `RiskPredictor`; historical incident data is preferred and sparse-data mode uses deterministic weighted heuristics.
- `routing.py`: OSRM distance matrix/route optimization with Haversine fallback and empty-input handling.
- `assistant.py`: DB context retrieval, LLM HTTP integration, and case assistant orchestration.
- `legal_intel.py`: deterministic section suggestions, case-law search, and IPC cross-reference helpers.
- `translation.py`: lazy model loading and translation fallback paths.
- `vision.py`: CCTV pipeline abstraction.
- `voice.py`: lazy Whisper loading and voice service.
- `document_gen.py`: DOCX placeholder replacement, date/evidence/witness formatting, language helper, and template generation.
- `audit.py`: audit-log insertion.
- `scripts/generate_seed_data.py` and `db/seed.py`: Ahmedabad-oriented officers, stations, cases/incidents, CCTV, patrol, and supporting seed data.

## Frontend

- `main.tsx` mounts React and wraps the app with theme/auth providers.
- `App.tsx` controls navigation/page selection and shared shell; views include Executive Dashboard, Case Management, Predictive Analytics, CCTV Surveillance, Patrol Management, CrimeGPT Assistant, Legal Reference, and Admin Console.
- API client uses Axios against `/api/v1`, persists auth token/user state, and exposes typed calls for auth, cases, analytics, map, CCTV, patrol, assistant, legal, documents, translation, and admin functions.
- Views use Tailwind utility classes, Recharts, Lucide icons, and reusable `Button`, `Input`, `Textarea`, `Select`, `Toggle`, `Badge`, `AlertCard`, `GlassCard`, `GlassPanel`, and `GlassModal` components.
- Leaflet map supports light/dark tile layers, ward/CCTV/patrol/routes/heatmap layers, a generated color LUT, canvas heatmap rendering, controls, and resize handling.
- `mockData.ts` still contains substantial static seed/UI data. Several views initialize from mock data or use simulated display behavior, so documentation claims that all UI data is live should be verified per view before changing it.

## Mobile

Expo app package versions are Expo `~57.0.8`, React `19.2.3`, and React Native `0.86.0`. `App.js` is the untouched starter screen. `AGENTS.md` requires versioned Expo 57 docs before mobile code changes.

## Tests

- Backend pytest files cover auth, cases, analytics/assistant, integration, incidents/patrol, CCTNS/prediction, documents, translation, admin, empirical/error recovery, router boundaries, stress/fallbacks, and CCTV/map.
- `backend/tests/conftest.py` supplies async client/database/officer fixtures and role headers.
- Frontend tests are lightweight custom TypeScript test scripts for API behavior, M3 security, M4 challenger cases, layer visibility, LUT, mutation observers, and aggregate runners; they are not currently exposed as an `npm test` script in `frontend/package.json`.
- Frontend build script is `tsc && vite build`; lint script exists but no lint configuration was identified during inventory.

## Deployment/configuration

- Frontend Dockerfile builds with Node 20 Alpine and serves via nginx stable Alpine.
- nginx serves SPA fallback and proxies `/api/` to `api:8000`, including WebSocket upgrade headers.
- Backend Dockerfile/entrypoint and compose files expect PostgreSQL, Redis, OSRM, and configured AI services.
- `.env.example` is the template; `.env` is ignored and must not be committed.

## Important inconsistencies and cautions

- `docs/PROJECT.md` and `README.md` describe intended/claimed architecture and milestones, not always current behavior. They mention React 19 in places, while the actual frontend manifest is React 18.3.1.
- The verification report claims complete mock removal and full verification, but current frontend source still contains mock data and the package has no `npm test` script.
- The working tree already had user changes before this memory file was added: frontend files are modified/deleted/untracked and `backup error.zip` is untracked. Preserve these changes unless explicitly instructed otherwise.
- Generated artifacts (`__pycache__`, `.pytest_cache`, `frontend/dist`) and binary assets/templates were inventoried but are not treated as source logic. The eight DOCX files are runtime templates, not line-oriented source.

## Working rule for future tasks

Use current source and tests as truth, consult this file for navigation, check `git status` before edits, preserve unrelated user changes, and verify API contracts across backend route, frontend client, view, schema, and tests before modifying behavior.
