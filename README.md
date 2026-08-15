# SAMRAKSHA — Ahmedabad City Police Command & Control System

> Operational intelligence platform for Ahmedabad City Police. Real-time case management, patrol coordination, CCTV monitoring, AI-assisted legal analysis, and multi-language incident reporting.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![Python](https://img.shields.io/badge/Python-3.11-green) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-teal) ![Docker](https://img.shields.io/badge/Docker-Compose-blue)

---

## Architecture

```
Browser → Nginx (port 80)
               ↓
          React SPA (Vite + TypeScript)
               ↓
          FastAPI (port 8000)
          ├── PostgreSQL 16  (persistent data)
          ├── Redis 7        (session cache, rate limiting)
          ├── LLaMA.cpp      (local AI — legal section analysis)
          └── OSRM           (patrol route optimization)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript 5, Vite, Leaflet.js |
| Backend | FastAPI (Python 3.11), asyncpg, PyJWT |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| AI | LLaMA.cpp (local, offline inference) |
| Maps | OSRM, OpenStreetMap |
| Deployment | Docker Compose |

---

## Prerequisites

- **Docker Engine** ≥ 24.0
- **Docker Compose** ≥ 2.20
- **8 GB RAM** minimum (LLaMA model requires 4–6 GB)

---

## Quick Start

```bash
git clone https://github.com/YOUR_ORG/samraksha.git
cd samraksha
cp .env.example .env        # Edit with your values
docker compose up -d --build
```

Application: **http://localhost** (port 80)  
API Docs: **http://localhost:8000/docs**

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://samraksha:pass@postgres:5432/samraksha` |
| `REDIS_URL` | Redis connection string | `redis://redis:6379` |
| `SECRET_KEY` | JWT signing secret (≥ 32 chars) | `change-me-in-production-abc123` |
| `ENVIRONMENT` | Runtime environment | `production` |
| `CORS_ORIGINS` | Allowed frontend origins | `http://localhost` |
| `VITE_API_URL` | Frontend API base URL | `http://localhost:8000` |

---

## Default Credentials

| Field | Value |
|-------|-------|
| Badge No | `ADMIN001` |
| Password | `admin` |

> ⚠️ **Change the default password and `SECRET_KEY` before any production deployment.**

---

## Module Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time incident feed, active patrol map, CCTV alerts, live WebSocket updates |
| **Cases / FIR** | Register FIRs, AI-suggested BNS/BNSS sections, case diary, document generation |
| **Patrol** | Live unit tracking, OSRM route optimization |
| **CCTV** | Alert monitoring with automatic case cross-referencing |
| **Analytics** | Hourly, weekly, monthly incident trend charts from live data |
| **Legal AI** | BNS/BNSS/POCSO section search powered by local LLaMA inference |
| **Documents** | Generate chargesheets, FIR copies, status reports in EN/HI/GU |
| **Admin** | Officer CRUD, role-based access control, audit logs |
| **Profile** | Officer self-service profile update |

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | Login — sets HttpOnly `samraksha_session` cookie |
| `GET` | `/api/v1/auth/me` | Return current session officer |
| `POST` | `/api/v1/auth/logout` | Logout — clears session cookie |

### Cases
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/cases` | List all cases |
| `POST` | `/api/v1/cases` | Register new FIR |
| `GET` | `/api/v1/cases/{id}` | Get case detail |
| `PATCH` | `/api/v1/cases/{id}/status` | Update case status |
| `POST` | `/api/v1/cases/{id}/diary` | Append diary entry |

### Patrol
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/patrol/units` | List patrol units |
| `GET` | `/api/v1/patrol/routes` | Get active routes |

### CCTV
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/cctv/alerts` | List CCTV alerts |

### Officers / Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/admin/officers` | List all officers |
| `POST` | `/api/v1/admin/officers` | Create officer |
| `DELETE` | `/api/v1/admin/officers/{id}` | Delete officer |
| `PATCH` | `/api/v1/officers/me` | Update own profile |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/analytics/summary` | Dashboard KPI summary |
| `GET` | `/api/v1/analytics/trends` | Incident trend data |

### AI & Services
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/legal/search` | BNS/BNSS section search |
| `POST` | `/api/v1/vision/analyze` | CCTV image analysis |
| `POST` | `/api/v1/translation/translate` | Multi-language translation |
| `POST` | `/api/v1/documents/generate` | Generate legal documents |

### Infrastructure
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health (Postgres + Redis ping) |
| `WS` | `/ws` | Live incident WebSocket stream |

---

## Project Structure

```
samraksha/
├── backend/
│   ├── app/
│   │   ├── api/              # Route handlers (auth, cases, patrol, cctv, admin...)
│   │   ├── db/               # asyncpg connection pool & schema.sql
│   │   └── services/         # Business logic (vision, translation, documents)
│   ├── Dockerfile
│   ├── main.py               # FastAPI app, middleware, health endpoint
│   ├── pytest.ini
│   └── requirements.txt
├── frontend/
│   ├── public/               # Static assets (logo, icons)
│   └── src/
│       ├── api/
│       │   └── client.ts     # Typed fetch wrapper (HttpOnly cookie)
│       └── app/
│           ├── App.tsx       # Root context provider & client-side router
│           └── pages/        # 10 modular page components
│               ├── AdminPage.tsx
│               ├── AnalyticsPage.tsx
│               ├── CaseDetailPage.tsx
│               ├── CasesPage.tsx
│               ├── CCTVPage.tsx
│               ├── DashboardPage.tsx
│               ├── FIREntryPage.tsx
│               ├── LoginPage.tsx
│               ├── PatrolPage.tsx
│               └── ProfilePage.tsx
├── .env.example
├── .gitignore
├── .dockerignore
├── docker-compose.yml
├── DEPLOYMENT.sh
└── README.md
```

---

## Security Controls

| Control | Implementation |
|---------|---------------|
| Session tokens | HttpOnly `samraksha_session` cookie — JS-inaccessible |
| Token storage | In-memory React state only — never `localStorage` |
| Session restore | `GET /api/v1/auth/me` on page load via cookie |
| CORS | Explicit origin allowlist + `TrustedHostMiddleware` |
| Rate limiting | `slowapi` on auth endpoints |
| JWT blacklist | Redis-backed token revocation on logout |
| Password hashing | `bcrypt` via `passlib` |

> 🔐 Rotate `SECRET_KEY`, change default credentials, and enable HTTPS before production.

---

## Changelog — v2 (Production-Ready Refactor, August 2026)

### Security
- Removed `localStorage` token storage → HttpOnly cookies only
- Added `GET /api/v1/auth/me` for session restore on page reload
- Cookie-first token extraction in all backend auth dependencies

### Architecture
- Modularized frontend: `App.tsx` split into 10 dedicated page files
- Added `frontend/src/api/client.ts` typed fetch wrapper
- `App.tsx` reduced 4,748 → 4,093 lines (−655 dead code lines)

### Bug Fixes
- Fixed CCTV case lookup (`[].find()` → `cases.find()` from context)
- Fixed CSV export with formula injection protection
- Fixed case diary to POST to real backend API
- Fixed WebSocket message normalization
- Fixed silent `catch {}` → `console.error()` across all modules
- Fixed missing `Response` import in `auth.py` (startup crash)
- Fixed `AnalyticsPage` to use local state (removed global mutable arrays)

### Infrastructure
- Added `backend/pytest.ini` and `requirements-test.txt`
- Removed stray root scripts (`fix.py`, `extract.py`, `extract_pages.py`)

---

## Git Workflow

```bash
# Create refactor branch
git checkout -b refactor/production-ready-v2
git add -A
git commit -m "refactor: production-ready overhaul v2"
git push -u origin refactor/production-ready-v2

# Merge via PR on GitHub, or locally:
git checkout main
git merge --no-ff refactor/production-ready-v2
git push origin main
```

---

*Proprietary — Ahmedabad City Police. All rights reserved.*
