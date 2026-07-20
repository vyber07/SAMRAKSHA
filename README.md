# SAMRAKSHA
## Police Crime Monitoring & Case Management API

**Kanad S.H.I.E.L.D. Cybersecurity Hackathon 2026**  
Ahmedabad City Police | Cyber Crime Branch | i-Hub Gujarat

---

## 🎯 Overview

SAMRAKSHA is a backend platform for police crime monitoring and case management. It provides a REST API for incident tracking, case management, patrol coordination, and geospatial crime analysis, backed by PostgreSQL with PostGIS and Redis.

> **Note:** This repository contains both **backend services** (API, database, cache) and a **React/Vite frontend** featuring a Samsung OneUI 8.5 styled UI/UX.

---

## ✨ Key Features

- **Case Management** — Full case lifecycle: create, read, update, delete
- **Incident Tracking** — Real-time incident tracking and updates
- **Geospatial Analysis** — Crime hotspot mapping with PostGIS
- **Patrol Coordination** — Track patrol units and assignments
- **CCTV Management** — Camera monitoring and status
- **Analytics** — Statistics and reporting endpoints
- **Role-based Access Control** — Admin, SHO, DCP, IO, Constable roles
- **JWT Authentication** — Secure token-based auth with bcrypt password hashing

---

## 🏗️ Technology Stack

### Backend
- **FastAPI** — Modern async Python web framework
- **PostgreSQL 16 + PostGIS** — Spatial database
- **Redis 7** — Caching layer
- **SQLAlchemy** — ORM
- **Pydantic** — Data validation

### Frontend
- **React 18** — UI Library
- **Vite** — Build tool
- **OneUI 8.5 Design System** — Fully transparent glass surfaces with 20px blur

### Deployment
- **Docker** — Containerization
- **Docker Compose** — Multi-container orchestration

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Installation & Running

```bash
# Clone the repository
git clone https://github.com/vyber07/SAMRAKSHA.git
cd SAMRAKSHA

# Start all backend services
docker compose up -d

# API available at http://localhost:8000
# Interactive docs at http://localhost:8000/docs
```

### Demo Credentials

| Role | Badge Number | Password |
|------|--------------|----------|
| Admin | admin | password123 |
| SHO | sho001 | password123 |
| Investigation Officer | io001 | password123 |
| DCP | dcp001 | password123 |

---

## 📁 Project Structure

```
SAMRAKSHA/
├── backend/                    # FastAPI Application
│   ├── app/
│   │   ├── api/                # API endpoints
│   │   ├── models/             # Database models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── database.py         # DB connection
│   │   ├── security.py         # Auth & JWT
│   │   └── main.py             # FastAPI app
│   ├── db/
│   │   └── schema.sql          # Database initialization
│   ├── Dockerfile
│   ├── requirements.txt
│   └── README.md               # Backend documentation
│
├── frontend/                   # React + Vite Application
│   ├── src/                    # Source code
│   ├── package.json            # Dependencies
│   └── vite.config.js          # Vite config
│
├── docker-compose.yml          # Service orchestration
├── .env.example                # Environment template
└── README.md                   # This file
```

---

## 🔌 API Endpoints

```
Authentication:
  POST /auth/login

Cases:
  GET /cases, POST /cases
  GET /cases/{id}, PATCH /cases/{id}, DELETE /cases/{id}

Incidents:
  GET /incident, POST /incident
  GET /incident/{id}, PATCH /incident/{id}

Mapping:
  GET /map/hotspots, GET /map/analytics

Analytics:
  GET /analytics/dashboard
  GET /analytics/incidents
  GET /analytics/cases

Patrol:
  GET /patrol, GET /patrol/location, POST /patrol/location

CCTV:
  GET /cctv, GET /cctv/{id}, GET /cctv/{id}/feed

Admin:
  GET /admin/users, POST /admin/users
  GET /admin/settings, POST /admin/logs

Health:
  GET /health
```

Full API documentation is available at `http://localhost:8000/docs` (Swagger UI) when running.

---

## 🔐 Role-Based Access Control

| Endpoint | Admin | SHO | DCP | IO | Constable |
|----------|:-----:|:---:|:---:|:--:|:---------:|
| Cases | ✅ | ✅ | ✅ | ✅ | ❌ |
| Incidents | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | ✅ | ❌ | ❌ |
| Patrol | ✅ | ✅ | ✅ | ✅ | ✅ |
| CCTV | ✅ | ✅ | ✅ | ❌ | ❌ |
| Admin | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 🔧 Configuration

### Environment Variables (.env)
```bash
DATABASE_URL=postgresql+asyncpg://samraksha:samraksha_secret@postgres:5432/samraksha
REDIS_URL=redis://redis:6379/0
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DEMO_MODE=true
```

See `.env.example` for the full template.

### Docker Services

**API** (FastAPI)
- Port: 8000
- Health check: `/health`

**Database** (PostgreSQL + PostGIS)
- Port: 5432 (internal)
- Geospatial query support

**Cache** (Redis)
- Port: 6379 (internal)
- Session and data caching

---

## 🧪 Testing

```bash
# Start services
docker compose up -d

# Verify all services
docker compose ps

# Check API health
curl http://localhost:8000/health

# View logs
docker compose logs -f api
```

---

## 🐛 Troubleshooting

### API Connection Issues
```bash
curl http://localhost:8000/health
docker compose logs -f api
```

### Database Connection Error
```bash
docker compose logs -f postgres
docker compose exec postgres psql -U samraksha -c "\l"
```

### Cache Issues
```bash
docker compose logs -f redis
docker compose exec redis redis-cli ping
```

---

## 📚 Documentation

- [Backend README](./backend/README.md) — Detailed API documentation

---

## 📄 License

This project is developed for the Kanad S.H.I.E.L.D. Cybersecurity Hackathon 2026. All rights reserved.

---

**SAMRAKSHA** | Police Crime Monitoring & Case Management API  
Built with FastAPI, PostgreSQL + PostGIS, and Redis
