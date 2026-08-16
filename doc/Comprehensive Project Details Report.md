# Comprehensive Project Details Report

**Project:** SAMRAKSHA

**Prepared by:** Manus AI

**Assessment date:** 16 August 2026

## 1. EXECUTIVE SUMMARY

SAMRAKSHA is a full-stack case-intelligence and policing-operations application for authenticated law-enforcement users. It combines a React and TypeScript interface with a Python FastAPI backend, PostgreSQL/PostGIS persistence, Redis-backed session revocation, DOCX document generation, translation, voice transcription, patrol coordination, CCTV alert handling, analytics, legal intelligence, and administrative audit functions.

The repository’s baseline contained several material production-readiness defects: access tokens and officer profiles were persisted in browser `localStorage`; the document modal submitted an FIR display number where the API required a case UUID; generated documents were logged but the frontend treated document records as local-only state; translation had a synchronous/asynchronous mismatch and could silently substitute a glossary result; document template support was represented by a fixed Python list; voice transcription returned a fixed mock response; Docker Compose embedded default credentials; and multiple UI actions fabricated fallback records or used alert-only behavior. The repair pass addresses the identified paths and leaves a clear boundary around integrations that require deployment-specific services or model weights.

The repaired repository passes Python compilation, the existing backend test suite, frontend TypeScript checking, the frontend test suite, the Vite production build, and a focused DOCX template discovery/rendering check. The build still reports non-blocking warnings about CSS import ordering, Vite configuration compatibility, and bundle size. External database, Redis, translation-model, Whisper, routing, and connector smoke tests remain required before a production launch.

## 2. TECHNOLOGY STACK & ARCHITECTURE

### Frontend

The frontend is a Vite-served React application written in TypeScript. The primary application shell resides in `frontend/src/app/App.tsx`, which provides the application context, browser navigation, session hydration, dashboard shell, pages, document modal, and shared UI primitives. Feature pages cover cases, FIR entry, patrols, CCTV, analytics, profile, administration, assistant, and documents. Styling combines Tailwind utility classes with a substantial global CSS file. Recharts is used for charts and Leaflet for map rendering.

The session flow now relies on an HttpOnly cookie set by the backend. The frontend sends `credentials: "include"` on repaired authenticated calls, does not restore a token or officer profile from `localStorage`, and checks `/api/v1/auth/me` on startup. Theme preference remains a non-sensitive local preference.

### Backend

The backend is a FastAPI application bootstrapped by `backend/main.py`. Routers are mounted below `/api/v1` and are separated by operational domain: authentication, cases, incidents, patrol, map/hotspot, CCTV, assistant, legal, WebSocket, administration, analytics, translation, CCTNS, documents, and voice. Shared services are under `backend/app/services`, while the async SQLAlchemy connection and SQL schema are under `backend/app/db`.

Middleware includes CORS with environment-defined origins, trusted-host validation, rate limiting through SlowAPI, and an environment-sensitive OpenAPI surface. Production rejects wildcard CORS or trusted-host configuration. The dashboard WebSocket validates the HttpOnly session cookie and retains a backward-compatible token-message handshake for older clients without placing tokens in the URL.

### Database

The persistence layer is PostgreSQL with PostGIS. The schema contains officers, police stations, cases, incidents, case audit, case diary, document logs, CCTV alerts, zone risk scores, patrol units, FIR sequences, and RBAC-related tables. SQL calls reviewed in the repaired paths use named SQLAlchemy parameters rather than string interpolation. Case access is filtered by role and police-station relationship in the document API, and the document log stores the case, template identifier, language, generator, timestamp, and SHA-256 digest.

Document types are now extensible at the application layer. Runtime discovery reads DOCX files from `DOCUMENT_TEMPLATE_DIR`; the migration `backend/db/migrations/20260816_document_templates.sql` removes the legacy `doc_log.doc_type` check constraint and expands the column to `VARCHAR(80)`. New templates still require operational review and template-context compatibility testing.

### Infrastructure and tools

The repository includes Docker Compose definitions for PostgreSQL/PostGIS, Redis, the FastAPI API, the React frontend, an optional Llama.cpp service, and OSRM. Python dependencies include FastAPI, SQLAlchemy, asyncpg, Redis, PyJWT, Passlib, docxtpl, Whisper, Transformers, Torch, and scientific-computing packages. Node dependencies include React, Vite, TypeScript, Tailwind, Recharts, Leaflet, and Vitest.

## 3. COMPLETE FEATURE BREAKDOWN

| Module | Current responsibility | Persistence or integration path |
|---|---|---|
| Authentication | Badge/password login, cookie session, logout, `/me`, rate limiting, revocation checks | `officers`, Redis blacklist, audit service |
| Case management | Case listing, FIR creation, case detail, case diary updates, station-scoped access | `cases`, `case_diary`, `case_audit`, `fir_sequences` |
| Document Studio | Runtime template discovery, case-aware DOCX rendering, language selection, download, re-download | DOCX templates, `doc_log`, generated case-diary event |
| Translation | Language listing, bounded text translation, IndicTrans2 with optional Llama.cpp fallback | Model runtime and `LLAMACPP_URL` configuration |
| Voice | Browser audio capture and upload, size/type validation, Whisper transcription | `backend/app/services/voice.py` and model runtime |
| Patrol | Unit listing, creation, status changes, deletion, rerouting UI | `patrol_units`, incident and routing services |
| CCTV | Alert feed, cameras, anomaly and ANPR-related views | `cctv_alerts`, vision service, WebSocket events |
| Map and hotspots | Ward risk and incident layers, map display | Incidents, zone risk scores, PostGIS queries |
| Analytics | Summary and trends | Database aggregation endpoints |
| Legal intelligence | Narrative lookup and optional external legal search | Rule service plus optional Indian Kanoon token |
| Assistant and chatbot | Case-oriented assistant and conversational UI | Backend assistant/chatbot services and optional model endpoints |
| Administration | Officer CRUD, role changes, audit display, permission UI | Admin endpoints, officers, audit and RBAC tables |
| CCTNS | Authenticated synchronization and local search with optional external lookup | Cases and diary; optional CCTNS API |

The frontend communicates with the backend through authenticated HTTP requests and a dashboard WebSocket. The repaired document flow is: select a case UUID, request the template list, submit a generation request, receive a DOCX Blob and document headers, persist the log server-side, and refresh the document list from the database. The repaired translation flow is: select a language code, call the authenticated translation API or document generation endpoint, and handle an explicit service-unavailable response when no engine is configured.

## 4. SECURITY & VULNERABILITY POSTURE

The audit reviewed authentication, token handling, SQL construction, browser storage, WebSocket authentication, CORS, trusted hosts, webhook keys, upload handling, document filenames, API error disclosure, mock data, and authorization checks. No unsafe HTML sink such as `dangerouslySetInnerHTML` was found in the reviewed frontend paths. The repaired document and webhook SQL paths use bound parameters.

| Finding | Severity before repair | Status |
|---|---:|---|
| JWT and officer profile stored in `localStorage` | High | Patched; session is now an HttpOnly cookie and startup uses `/auth/me` |
| Cookie was not secure in production | High | Patched; `COOKIE_SECURE` is environment-controlled and production configuration is documented |
| Case display FIR number submitted where UUID was required | High functional/security risk | Patched; modal and callers submit `case_id` |
| Document records existed only in frontend local state | High integrity risk | Patched; documents list and re-download are database-backed |
| Fixed template allow-list blocked future additions | Medium | Patched; runtime discovery plus schema migration |
| Translation could silently return a glossary substitution | Medium integrity risk | Patched; strict language/input validation and explicit `503` on unavailable engines |
| Voice endpoint returned fixed mock transcription | Medium integrity risk | Patched; endpoint calls the existing Whisper service with upload limits |
| Docker Compose contained default passwords and JWT secret | High deployment risk | Patched; values are required environment inputs |
| CORS and trusted hosts were hardcoded and included a wildcard | High | Patched; environment-driven and wildcard-rejected in production |
| CCTNS and incident webhook credentials lacked explicit missing-config handling | Medium | Patched; missing integrations return configuration errors and comparisons use constant-time checks |
| Incident/CCTNS paths used fabricated fallback coordinates | Medium data-integrity risk | Patched; coordinates or a known station/ward are required |

The remaining risks are deployment and integration dependent. The application should be deployed only over HTTPS, database and Redis services should be isolated from public access, connector keys should be stored in a secret manager, external service responses should be logged with redaction, and database-backed authorization should be covered with role-specific integration tests. The application’s advisory AI output must not be treated as a legal or investigative decision without human review.

## 5. CODE QUALITY & QA METRICS

The repository has a functioning separation between route modules, services, database connection code, templates, and frontend pages, but the frontend application shell remains oversized. `frontend/src/app/App.tsx` still contains shared primitives, the root provider, multiple feature components, and legacy compatibility exports. This is the main maintainability debt and should be split into `components`, `contexts`, `features`, and `lib` modules in a follow-up refactor.

The repair pass removed duplicate SQLAlchemy import lines across backend modules, removed the bundled `.env`, replaced insecure Compose defaults, removed active mock voice output, removed local-only document editing and deletion actions, and replaced random patrol coordinates and synthetic officer defaults in the active patrol-create path. Test fixtures and mocks remain in test files where they are appropriate for isolated unit tests.

| Verification | Result |
|---|---|
| Python `compileall` | Passed after backend repairs |
| Backend `pytest` | Passed: 2 tests |
| Frontend `tsc --noEmit` | Passed |
| Frontend Vitest | Passed: 3 tests in 2 files |
| Frontend Vite build | Passed; non-blocking warnings remain |
| Dynamic document runtime check | Passed: 8 templates discovered, DOCX rendered, SHA-256 produced |

Observed non-blocking warnings include a CSS `@import` ordering warning, a Vite `__dirname` compatibility warning, and a large frontend bundle warning. Recommended optimizations are code-splitting the oversized frontend shell, moving the Google Fonts import before other CSS rules, and updating the Vite configuration to the supported directory API.

## 6. DEPLOYMENT & SETUP REQUIREMENTS

A new developer should copy `.env.example` to `.env`, replace the database password and `SECRET_KEY`, define `CORS_ORIGINS` and `TRUSTED_HOSTS`, and select `COOKIE_SECURE=true` when serving over HTTPS. The initial Compose database mounts `backend/db/schema.sql`; an existing database must also receive the document-template migration. The backend requires PostgreSQL/PostGIS and Redis. The frontend requires Node.js and npm. Non-English translation requires IndicTrans2 model dependencies and weights or a reachable Llama.cpp service. Voice transcription requires the Whisper package and model weights. OSRM, external legal intelligence, and CCTNS are optional integrations and must be configured explicitly.

A production deployment should build immutable backend and frontend images, inject secrets at runtime, use a reverse proxy for TLS and same-origin routing, restrict database and Redis network access, configure health checks, and retain structured logs without case-sensitive data leakage. Before launch, run database-backed smoke tests for login, role authorization, FIR creation, case diary entry, document generation, re-download, translation, and logout revocation.

## 7. CONCLUSION & ROADMAP

The repaired codebase is materially healthier and suitable for a controlled integration environment. The highest-risk browser token-storage, document identifier, document persistence, dynamic template, translation fallback, mock voice, and Compose secret defects have been addressed. It should not yet be described as fully production-certified because external model availability, live database migrations, connector authorization, privacy controls, and end-to-end role tests require validation in the target environment.

The three immediate priorities before a production launch are: first, execute the database migration and full authenticated integration suite against a production-like PostgreSQL/PostGIS and Redis environment; second, finalize model and connector provisioning for IndicTrans2, Whisper, OSRM, CCTNS, and any legal intelligence service, with monitoring and failure runbooks; and third, split the oversized frontend shell and add security-focused browser tests for session expiry, cross-role access, document download integrity, and translation failure handling.

## Repository Evidence

The assessment is based on the repository files below, the supplied instruction file, and the verification commands recorded during the repair pass:

- [Authentication implementation][auth]
- [Document API][documents]
- [Document generator][document-generator]
- [Translation service][translation]
- [Frontend application shell][frontend-app]
- [Database schema][schema]
- [Docker Compose configuration][compose]
- [Backend tests][backend-tests]
- [Frontend tests][frontend-tests]

[auth]: ../../backend/app/api/auth.py "Authentication implementation"
[documents]: ../../backend/app/api/documents.py "Document API"
[document-generator]: ../../backend/app/services/document_gen.py "Dynamic document generator"
[translation]: ../../backend/app/services/translation.py "Translation service"
[frontend-app]: ../../frontend/src/app/App.tsx "Frontend application shell"
[schema]: ../../backend/db/schema.sql "Database schema"
[compose]: ../../docker-compose.yml "Docker Compose configuration"
[backend-tests]: ../../backend/tests/test_api.py "Backend tests"
[frontend-tests]: ../../frontend/src/app/App.test.tsx "Frontend tests"
