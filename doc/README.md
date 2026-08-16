# SAMRAKSHA

![SAMRAKSHA dashboard placeholder](https://private-us-east-1.manuscdn.com/sessionFile/XNxf8BPmBAoCEstVtmsajj/sandbox/eL29fYuPOR7h1rzteJtv0J-images_1786874474781_na1fn_L2hvbWUvdWJ1bnR1L3dvcmsvc2FtcmFrc2hhX3JldXBsb2FkL2RvY3MvaW1hZ2VzL2Rhc2hib2FyZC1wbGFjZWhvbGRlcg.svg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWE54ZjhCUG1CQW9DRXN0VnRtc2Fqai9zYW5kYm94L2VMMjlmWXVQT1I3aDFyenRlSnR2MEotaW1hZ2VzXzE3ODY4NzQ0NzQ3ODFfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzZHZjbXN2YzJGdGNtRnJjMmhoWDNKbGRYQnNiMkZrTDJSdlkzTXZhVzFoWjJWekwyUmhjMmhpYjJGeVpDMXdiR0ZqWldodmJHUmxjZy5zdmciLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3ODgyMjA4MDB9fX1dfQ__&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEQCIC2RydqrIMQJlSJZvZnb~dc-d0~9WzTHKE65B-2MFbh-AiB-jQTA20nU7YkKbrZEx92YZ-MLtudDE6zh~KPoil0D0A__)

**SAMRAKSHA** is a full-stack case intelligence and policing operations platform. It provides authenticated case and FIR management, patrol-unit coordination, CCTV alert feeds, legal-section lookup, multilingual translation, and database-backed statutory document generation for authorized law-enforcement users.

> **Operational status:** The repository now contains the repaired production paths for secure session handling, dynamic DOCX template discovery, persisted document logs, re-downloads, and translation service integration. External services such as PostgreSQL/PostGIS, Redis, Whisper, IndicTrans2, OSRM, and an optional Llama.cpp translation fallback still require environment-specific deployment and validation.

## ✨ Project Overview

SAMRAKSHA consolidates operational records into a single authenticated interface. Officers sign in with a badge number and password; the server issues an HttpOnly session cookie, applies role and permission checks, and reads case, patrol, CCTV, diary, audit, document, and translation data through the FastAPI API. The React interface presents the data through dashboard, case, patrol, CCTV, analytics, assistant, document, profile, and administration views.

![Case-management placeholder](https://private-us-east-1.manuscdn.com/sessionFile/XNxf8BPmBAoCEstVtmsajj/sandbox/eL29fYuPOR7h1rzteJtv0J-images_1786874474781_na1fn_L2hvbWUvdWJ1bnR1L3dvcmsvc2FtcmFrc2hhX3JldXBsb2FkL2RvY3MvaW1hZ2VzL2Nhc2UtbWFuYWdlbWVudC1wbGFjZWhvbGRlcg.svg?Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvWE54ZjhCUG1CQW9DRXN0VnRtc2Fqai9zYW5kYm94L2VMMjlmWXVQT1I3aDFyenRlSnR2MEotaW1hZ2VzXzE3ODY4NzQ0NzQ3ODFfbmExZm5fTDJodmJXVXZkV0oxYm5SMUwzZHZjbXN2YzJGdGNtRnJjMmhoWDNKbGRYQnNiMkZrTDJSdlkzTXZhVzFoWjJWekwyTmhjMlV0YldGdVlXZGxiV1Z1ZEMxd2JHRmpaV2h2YkdSbGNnLnN2ZyIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc4ODIyMDgwMH19fV19&Key-Pair-Id=K2QY5QTL8JSY6C&Signature=MEQCIFM78y5jQPECHx3Em8D663dzJBcCiwywnggdKWn4flvDAiBAKPGdX3s57MzW6vFEhGb0pnDn-TaOc3Pk3fJ1FC1hhg__)

## 🧰 Technology Stack

| Layer | Technologies | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, Recharts, Leaflet | Authenticated operations interface, forms, charts, maps, document downloads |
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy async sessions | API routing, validation, authentication, authorization, document and translation orchestration |
| Database | PostgreSQL with PostGIS, parameterized SQLAlchemy queries | Officers, stations, cases, incidents, diary entries, audit records, patrol units, CCTV alerts, document logs |
| Session and cache | Redis | Token revocation and operational cache support |
| Documents | `docxtpl`, `python-docx`, DOCX templates | Dynamic template discovery, context rendering, SHA-256 integrity metadata |
| AI and external services | Whisper, IndicTrans2, optional Llama.cpp, OSRM, optional Indian Kanoon and CCTNS connectors | Voice transcription, translation, routing, legal intelligence, and external synchronization |
| Packaging | npm, Python virtual environment, Docker Compose | Local development and service orchestration |

## ✅ Prerequisites

Install Node.js 18 or newer, npm, Python 3.11 or newer, Docker Engine with Docker Compose, and Git. For a non-containerized deployment, install PostgreSQL with PostGIS and Redis separately. Translation and voice features additionally require the model runtimes and weights described in the environment section.

## 🚀 Local Installation

### 1. Obtain the source and create local configuration

```bash
git clone <your-github-repository-url> samraksha
cd samraksha
cp .env.example .env
```

Edit `.env` and replace every secret placeholder. Generate a long random `SECRET_KEY`; do not reuse values from this repository, commit `.env`, or place a server secret in `frontend/.env`.

### 2. Start infrastructure with Docker Compose

```bash
docker compose up -d postgres redis
```

The first PostgreSQL initialization mounts `backend/db/schema.sql`. If the database already exists, apply the extensibility migration explicitly:

```bash
docker compose exec -T postgres psql -U samraksha -d samraksha \
  < backend/db/migrations/20260816_document_templates.sql
```

### 3. Install and start the backend

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000`. Interactive OpenAPI documentation is available at `http://localhost:8000/api/docs` when `ENVIRONMENT` is not `production`.

### 4. Install and start the frontend

Open a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL displayed in the terminal. If the frontend and backend are served on different origins, set `VITE_API_URL`, `CORS_ORIGINS`, and `TRUSTED_HOSTS` consistently. The frontend requests use `credentials: "include"` so the HttpOnly session cookie is sent to the API.

### 5. Verify the installation

```bash
cd backend
python3 -m pytest -q
python3 -m compileall -q .

cd ../frontend
npm run typecheck
npm test -- --run
npm run build
```

A healthy deployment should report passing backend tests, a zero-error TypeScript check, passing frontend tests, and a successful Vite production build.

## 🔐 Environment Variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Async PostgreSQL connection string |
| `REDIS_URL` | Yes for revocation and health | Redis connection string |
| `SECRET_KEY` | Yes | JWT signing key; use at least 32 random characters in production |
| `ENVIRONMENT` | Yes | `development`, `testing`, or `production` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | Session lifetime |
| `COOKIE_SECURE` | Production | Set `true` when served over HTTPS |
| `CORS_ORIGINS` | Yes | Comma-separated allowed browser origins; never use `*` with credentials |
| `TRUSTED_HOSTS` | Yes | Comma-separated hostnames accepted by the API |
| `DOCUMENT_TEMPLATE_DIR` | Optional | Override for the DOCX template directory |
| `LLAMACPP_URL` | Optional | Translation fallback endpoint; non-English translation requires IndicTrans2 or this service |
| `INDIAN_KANOON_TOKEN` | Optional | Enables external case-law lookup; no placeholder token is accepted |
| `CCTNS_API_KEY` | Optional | Enables authenticated CCTNS synchronization and search |
| `GEMINI_API_KEY` | Optional | Server-side AI integration only; never expose it in frontend configuration |

## 🗂️ Repository Layout

```text
.
├── backend/
│   ├── app/api/                 # FastAPI route modules
│   ├── app/core/                # Shared infrastructure such as Redis
│   ├── app/db/                  # Async database connection and SQL schema
│   ├── app/services/            # Documents, translation, voice, AI, legal, and prediction services
│   ├── templates/documents/     # Discoverable DOCX templates
│   ├── db/migrations/           # Explicit SQL migrations
│   ├── tests/                   # Backend tests
│   └── main.py                  # Application bootstrap and middleware
├── frontend/
│   └── src/app/                 # React application shell and feature pages
├── docker-compose.yml           # Local service orchestration
├── .env.example                # Secret-free configuration template
├── USER_GUIDE.md                # End-user operating manual
└── DEPLOYMENT.sh                # Existing deployment helper, to be reviewed for the target environment
```

## 📡 API Reference

All protected endpoints accept the server session cookie. During the active browser session, an in-memory bearer token may also be supplied for compatibility, but tokens are never persisted in browser storage.

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Authenticate an officer and set the HttpOnly session cookie | Public, rate-limited |
| `POST` | `/api/v1/auth/logout` | Revoke the current session and clear the cookie | Authenticated |
| `GET` | `/api/v1/auth/me` | Return the authenticated officer profile | Authenticated |
| `GET` | `/api/v1/cases` | List authorized cases | Role-based |
| `POST` | `/api/v1/cases` | Create an FIR and persist its diary event | Permission-based |
| `GET` | `/api/v1/cases/{case_id}` | Read a case and its diary | Role-based |
| `POST` | `/api/v1/cases/{case_id}/diary` | Add a case-diary entry | Permission-based |
| `GET` | `/api/v1/docs/templates` | Discover available DOCX templates | Authenticated |
| `POST` | `/api/v1/docs/generate` | Render, log, and download a generated DOCX | `doc_generate` |
| `GET` | `/api/v1/docs?case_id={uuid}` | List persisted document logs for a case | Role-based |
| `GET` | `/api/v1/docs/{id}/download` | Re-render and download a persisted document | `doc_generate` |
| `POST` | `/api/v1/translate/` | Translate bounded text using configured engines | Authenticated |
| `GET` | `/api/v1/translate/languages` | List supported language codes | Authenticated |
| `POST` | `/api/v1/voice/transcribe` | Transcribe bounded audio uploads using Whisper | Authenticated by deployment policy |
| `GET` | `/health` | Check database and Redis reachability | Public health probe |

## 📄 Document Generation

DOCX files in `backend/templates/documents/` are discovered at runtime. The API normalizes the file stem into a template identifier and renders the case context with `docxtpl`. Adding a new template does not require a Python allow-list edit, but the database migration must be applied so `doc_log.doc_type` is not restricted by the legacy check constraint.

The response contains a safe `Content-Disposition` filename, `X-Document-ID`, and `X-Document-SHA256` headers. The frontend reads the response as a `Blob`, appends a temporary anchor, starts the download, and delays URL revocation so browsers finish consuming the file. The database records the case, template identifier, language, generator, timestamp, and digest. Re-downloads regenerate the document from current persisted case data and the logged template metadata.

## 🌍 Translation

The interface exposes backend language codes such as `en`, `hi`, `gu`, `mr`, `ta`, `te`, `kn`, `pa`, `bn`, `or`, `ml`, `as`, and `ur`. The service first attempts IndicTrans2 and then uses `LLAMACPP_URL` if configured. If no translation engine is available, the API returns a clear `503` response instead of pretending that an English glossary substitution is a completed translation.

## 🧪 Testing and Quality Gates

The minimum release gate is a successful Python compilation, passing backend tests, a zero-error TypeScript check, passing frontend tests, and a successful frontend build. Run dependency vulnerability scanning in CI with the organization’s approved scanner, review the generated lockfiles, and run a database-backed smoke test before production deployment.

## 📝 Changelog

### 2026-08-16 — Production repair pass

The authentication flow stopped persisting session tokens and officer profiles in `localStorage`; sessions now use a secure HttpOnly cookie with revocation support. Document generation now discovers templates dynamically, validates UUID case identifiers, logs generated artifacts, supports authorized re-downloads, and performs reliable browser Blob downloads. Translation now validates language and input size and reports unavailable engines honestly. Voice transcription now calls the existing Whisper service instead of returning a fixed mock response. Docker Compose no longer embeds production secrets, and the legacy document-type database constraint has an explicit migration.

### Previous baseline

The original repository contained the core FastAPI, React, PostgreSQL, Redis, document, translation, patrol, CCTV, assistant, and administration modules. The repair pass preserves those modules while prioritizing data integrity, authentication, and removal of active demo behavior.

## 📘 Further Documentation

Read the [User Guide](USER_GUIDE.md) for operational workflows. Review the Comprehensive Project Details Report delivered with this repository for the security posture, architecture analysis, known limitations, QA results, and release priorities.
