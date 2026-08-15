# SAMRAKSHA — Police Crime Monitoring & Case Management Platform

**Security**: Hardened Build | **API**: 16/16 Endpoints Passing | **Stack**: FastAPI + React

Integrated AI-assisted law enforcement platform for Ahmedabad City Police.
Real-time CCTV analytics · Predictive patrolling · FIR/case management · Legal AI assistant · Multi-language support

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Services](#services)
- [API Reference](#api-reference)
- [Frontend Architecture](#frontend-architecture)
- [Backend Architecture](#backend-architecture)
- [Database Schema](#database-schema)
- [AI/ML Services](#aiml-services)
- [Security](#security)
- [Testing](#testing)
- [Deployment](#deployment)

## Overview
SAMRAKSHA is a production-grade full-stack police operations platform built for Ahmedabad City Police. It integrates real-time surveillance, AI-powered crime prediction, case management (FIR lifecycle), patrol coordination, legal intelligence, and multi-language document generation into a single unified dashboard.

All data is live — no mock data. Every UI element fetches from the live FastAPI backend backed by PostgreSQL/PostGIS and Redis.

## Features

### 🗂️ Case Management (FIR)
- Create, update, and track FIRs through full lifecycle
- Case diary entry system with evidence attachments
- Accused/victim profile management with linking
- CCTNS integration for national crime database sync
- AI-powered case similarity and pattern matching

### 📹 CCTV Intelligence
- Live feed grid with 46+ cameras across Ahmedabad zones
- AI crowd density detection and loitering alerts
- ANPR (automatic number plate recognition) matching against active FIRs
- Alert escalation with zone-level severity scoring

### 🚔 Patrol Management
- Real-time patrol unit tracking with GPS telemetry
- AI-optimized route planning via OSRM engine
- Unit status management (available / deployed / responding)
- PCR (Police Control Room) incident dispatch integration

### 📊 Predictive Analytics
- Zone-wise crime risk scoring (ML-powered, PostGIS backed)
- Hourly / weekly / monthly trend charts from live incident data
- Festival/event simulation for proactive deployment planning
- Hotspot surge detection with 3-hour forward projection

### 🤖 Legal AI Assistant
- Natural language query interface for Indian Penal Code / BNS 2024
- Legal section search with context extraction
- Multi-language support (Gujarati, Hindi, English via IndicTrans2)
- Voice-to-text query input (OpenAI Whisper)

### 📄 Document Generation
- One-click generation of legal documents from case data: Chargesheet (BNS 2024) · Medical Letter · Remand Request (BNSS) · Seizure Receipt · Court Custody · Panchanama · Face ID Report
- .docx templates with live case data injection

### 👥 Admin & RBAC
- Officer profile management with role-based access control
- Audit trail for all critical actions
- Permission system: `analytics_view`, `case_create`, `patrol_manage`, `admin_*`

### 🌐 Real-Time WebSocket
- Live dashboard feed: new FIRs, CCTV alerts, ANPR matches, PCR incidents
- Real native WebSocket connection (no polling) passing JWT securely in the first frame (not in URL query parameters)
- Automatic reconnect with exponential backoff

## Project Structure
```text
samraksha/
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── api/                    # Route handlers
│   │   ├── core/                   # Redis connection pool
│   │   ├── db/                     # asyncpg + helpers
│   │   └── services/               # AI/ML service layer
│   ├── db/                         # Database management & seed data
│   ├── alembic/                    # Schema migrations
│   ├── templates/                  # .docx legal document templates
│   ├── tests/                      # Pytest test suite
│   ├── scripts/                    # Seed generator
│   ├── main.py                     # FastAPI app + router mounting
│   ├── entrypoint.sh               # Docker entrypoint
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/                       # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── app/
│   │   ├── lib/
│   │   ├── tests/
│   │   ├── main.tsx
│   │   └── index.css
│   ├── nginx.conf                  # Nginx reverse proxy + WebSocket config
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── Dockerfile                  # Multi-stage: node build → nginx serve
│
├── docs/                           # Project documentation
├── docker-compose.yml              # Production compose
├── docker-compose.debug.yml        # Debug overrides
├── .env.example                    # Environment variable template
├── .gitignore
└── README.md
```

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| **API Framework** | FastAPI 0.111+ with async/await |
| **ASGI Server** | Uvicorn with uvloop |
| **Database** | PostgreSQL 16 + PostGIS 3.4 |
| **ORM / Driver** | asyncpg (raw async SQL) |
| **Migrations** | Alembic |
| **Cache / PubSub** | Redis 7 |
| **Auth** | JWT (python-jose) + bcrypt |
| **Rate Limiting** | SlowAPI |
| **AI / LLM** | Llama.cpp (local inference) |
| **Crime Prediction** | XGBoost + scikit-learn |
| **Patrol Routing** | Google OR-Tools |
| **Computer Vision** | MediaPipe + OpenCV |
| **Speech-to-Text** | OpenAI Whisper |
| **Translation** | IndicTrans2 (Gujarati/Hindi/English) |
| **Route Engine** | OSRM (Open Source Routing Machine) |
| **Document Gen** | python-docx |
| **Logging** | structlog |

### Frontend
| Layer | Technology |
|---|---|
| **Framework** | React 18.3.1 |
| **Language** | TypeScript 5.5 |
| **Build** | Vite 6.4.3 |
| **Styling** | Tailwind CSS 4.1.12 |
| **Charts** | Recharts 2.15.2 |
| **Maps** | Leaflet 1.9.4 + OpenStreetMap |
| **Icons** | Lucide React 0.487.0 |
| **HTTP** | Axios 1.8+ |
| **Real-time** | Native WebSocket API |

### Infrastructure
| Component | Technology |
|---|---|
| **Container Runtime** | Docker + Docker Compose v2 |
| **Reverse Proxy** | Nginx (Alpine) |
| **OS** | Linux (Ubuntu) |

## Quick Start

### Prerequisites
- Docker ≥ 24 and Docker Compose v2
- 8 GB RAM recommended (16 GB for full Llama.cpp inference)
- Ports 80 (frontend), 5432, 6379 available

### 1. Clone & Configure Environment
```bash
git clone https://github.com/vyber07/SAMRAKSHA.git
cd SAMRAKSHA
cp .env.example .env
# Edit .env — set SECRET_KEY, POSTGRES_PASSWORD, API keys
```

### 2. Start All Services
```bash
docker compose up -d
```
First start will: pull images → run schema.sql → seed database → start all services.

### 3. Verify System Health
```bash
curl http://localhost/api/health
# → {"status": "ok", "version": "1.0.0"}
```

### 4. Access the Dashboard
- **URL**: `http://localhost`
- **Default Badge**: `ADMIN001`
- **Default Password**: `password123`
> ⚠️ **Change default credentials immediately before any production use.**

## Environment Variables
Copy `.env.example` and fill in all values:
```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | JWT signing key — must be 32+ random chars |
| `POSTGRES_DB` | ✅ | Database name (default: samraksha) |
| `POSTGRES_USER` | ✅ | Database user |
| `POSTGRES_PASSWORD` | ✅ | Database password |
| `REDIS_URL` | ✅ | Redis connection URL |
| `ICCC_API_KEY` | Webhook | ICCC CCTV integration key |
| `PCR_WEBHOOK_TOKEN` | Webhook | PCR incident webhook token |
| `INCIDENT_WEBHOOK_KEY` | Webhook | Alternative incident webhook key |
| `CCTNS_API_KEY` | Integration | CCTNS national DB API key |
| `CCTV_API_KEY` | Integration | CCTV system API key |
| `JWT_ALGORITHM` | Optional | JWT algorithm (default: HS256) |

*All webhook/API keys are 100% from environment variables — no hardcoded defaults in code.*

## Services
| Container | Internal Port | Description |
|---|---|---|
| `samraksha-frontend` | 80 → external | Nginx: React SPA + reverse proxy to API |
| `samraksha-api` | 8000 (internal) | FastAPI backend |
| `samraksha-postgres` | 5432 (internal) | PostgreSQL 16 + PostGIS 3.4 |
| `samraksha-redis` | 6379 (internal) | Redis cache + WebSocket pub/sub |
| `samraksha-llamacpp` | 8080 (internal) | Llama.cpp inference server |
| `samraksha-osrm` | 5000 (internal) | OSRM patrol route optimizer |

## API Reference
- Interactive Swagger docs: `http://localhost/api/docs`
- ReDoc: `http://localhost/api/redoc`

### Authentication
```http
POST /api/v1/auth/login
Content-Type: application/json

{"badge_no": "ADMIN001", "password": "password123"}
```
All subsequent requests require:
```http
Authorization: Bearer <access_token>
```

### Endpoint Groups

**Analytics**
- `GET /api/v1/analytics/summary` - Dashboard KPIs
- `GET /api/v1/analytics/trends` - Hourly/weekly/monthly charts
- `GET /api/v1/analytics/resource_status` - Patrol unit status
- `GET /api/v1/analytics/hotspot_surge` - Next 3h risk surge
- `GET /api/v1/analytics/pattern_matches` - AI pattern matches
- `POST /api/v1/analytics/simulate` - Deployment simulation

**Cases / FIR**
- `GET /api/v1/cases` - List cases
- `POST /api/v1/cases/create` - Create FIR
- `GET /api/v1/cases/{id}` - Case detail
- `PATCH /api/v1/cases/{id}` - Update case
- `POST /api/v1/cases/{id}/diary` - Add diary entry
- `GET /api/v1/cases/{id}/timeline` - Case timeline

**CCTV**
- `GET /api/v1/cctv` - Recent alerts
- `GET /api/v1/cctv/cameras` - Camera feeds
- `POST /api/v1/cctv/webhook` - Ingest ICCC alert

**Patrol**
- `GET /api/v1/patrol/units` - Units + GPS
- `GET /api/v1/patrol/routes` - Optimized routes
- `PATCH /api/v1/patrol/units/{id}/status` - Update status
- `POST /api/v1/patrol/reroute` - AI rerouting

**Map / Zones**
- `GET /api/v1/map/wards` - Ward risk scores
- `GET /api/v1/map/hotspots` - Crime hotspot polygons

**AI Assistant**
- `POST /api/v1/assistant/query` - NLP legal query
- `POST /api/v1/assistant/voice` - Voice query

**Legal**
- `GET /api/v1/legal/search` - Search IPC/BNS
- `GET /api/v1/legal/sections/{id}` - Section detail

**Documents**
- `POST /api/v1/docs/generate` - Generate .docx
- `GET /api/v1/docs/templates` - List templates

**Admin**
- `GET /api/v1/admin/officers` - List officers
- `POST /api/v1/admin/officers` - Create officer
- `PATCH /api/v1/admin/officers/{id}` - Update officer
- `DELETE /api/v1/admin/officers/{id}` - Deactivate officer
- `GET /api/v1/admin/audit` - Audit log

**Health**
- `GET /api/health` - System health
- `GET /api/v1/health` - Versioned health

**WebSocket**
```
ws://localhost/api/v1/ws
ws://localhost/api/v1/ws/dashboard
```
Message types: `NEW_FIR` · `CCTV_ALERT` · `ANPR_MATCH` · `PCR_INCIDENT` · `PATROL_UPDATE`

## Frontend Architecture
The frontend is a single-file monolithic React app (`src/app/App.tsx`) with internal components organized by concern:
- **AppContext** — global state
- **Data fetching** — polling every 10s
- **Pages**: Dashboard, Cases, CCTV, Patrol, Analytics, AI Assistant, Documents, Legal, Admin
- **Real-time** — Native WebSocket
- **Maps** — Leaflet + OpenStreetMap

## Backend Architecture
```text
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
```

## Database Schema
Key tables (PostgreSQL/PostGIS):
| Table | Description |
|---|---|
| `officers` | Police officer accounts with RBAC roles |
| `cases` | FIR records with full lifecycle state |
| `case_diary` | Timestamped diary entries per case |
| `cctv_alerts` | AI-detected CCTV events with coordinates |
| `cctv_cameras` | Camera inventory with status and zone |
| `patrol_units` | Unit locations, status, assignment |
| `incidents` | PCR incident records |
| `zone_risk_scores` | Hourly ML-computed risk per ward |
| `legal_sections` | IPC/BNS section embeddings for search |
| `audit_logs` | All critical actions audit trail |

## AI/ML Services
- **Crime Prediction**: XGBoost trained on 3-year data
- **Patrol Routing**: Google OR-Tools VRP solver
- **Legal AI Assistant**: Llama.cpp local inference
- **CCTV Vision**: MediaPipe + OpenCV
- **Voice Input**: OpenAI Whisper

## Security

### Implemented Hardening
| Control | Implementation |
|---|---|
| **Authentication** | JWT HS256, python-jose, bcrypt passwords |
| **Authorization** | Per-endpoint `require_permission()` RBAC |
| **Rate Limiting** | SlowAPI on AI/document/search endpoints |
| **WebSocket Auth** | JWT validation via first frame (no token in URL), 1008 close on failure |
| **API Keys** | 100% from env vars — no hardcoded defaults |
| **SQL Injection** | Parameterized asyncpg queries throughout |
| **CORS & Hosts** | Configurable via `ALLOWED_ORIGINS` env var, explicit `TrustedHostMiddleware` enforcing allowed hosts |

### Resolved CVEs
- **gunicorn**: Pinned >=22.0.0 (fixes HTTP smuggling CVEs)
- **vite**: Upgraded to 6.4.3 (patches all known Vite CVEs)
- **react-router**: Removed (directory `frontend_new/` deleted)

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Build Test
```bash
cd frontend
npm run build
```

## Deployment

### Production Checklist
- [ ] Set `SECRET_KEY` to a 64-char random string
- [ ] Change all default passwords
- [ ] Set all webhook/integration API keys in `.env`
- [ ] Configure `ALLOWED_ORIGINS` to your domain
- [ ] Enable HTTPS (add SSL certs to nginx)
- [ ] Set up automated database backups

### Build & Deploy
```bash
# Full rebuild
docker compose build

# Start all services
docker compose up -d
```
