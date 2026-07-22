# SAMRAKSHA — Full Codebase Analysis
> Unified Predictive Policing & Advanced Case Intelligence Platform  
> Ahmedabad, Gujarat — Police Command Center

---

## 🏗️ Architecture Overview

```
samraksha/
├── backend/          FastAPI (Python) — 14 route files
│   ├── app/api/      REST endpoints
│   ├── app/services/ Business logic
│   ├── app/db/       Async SQLAlchemy + PostGIS
│   └── db/schema.sql PostgreSQL schema
└── frontend/         React + Vite — Glassmorphism UI
    ├── components/   Dashboard, Sidebar, Charts, Widgets
    ├── pages/        8 page routes
    └── lib/          Zustand store + Axios API client
```

**Infrastructure (docker-compose):**
| Service | Image | Port |
|---|---|---|
| postgres | postgis/postgis:16-3.4 | internal |
| redis | redis:7-alpine | internal |
| api (FastAPI) | custom Dockerfile | 8000 |
| frontend (React+Nginx) | custom Dockerfile | 80 |
| llamacpp | ggml-org/llama.cpp:server | internal |
| osrm | osrm/osrm-backend | 5000 |

---

## ✅ What Is Fully Working (Complete)

### Backend — 14 API Routes
1. **`/auth`** — JWT login/logout + Redis blacklist + bcrypt timing-attack safe + PBAC overrides
2. **`/cases`** — FIR create, list (paginated), search (pg `tsvector`), get by ID + case diary
3. **`/incident`** — Incident stub
4. **`/docs`** — 8 document types (chargesheet, medical_letter, remand_request, seizure_receipt, court_custody, panchanama, face_id, witness_statement) → `.docx` generation from templates
5. **`/patrol`** — Patrol routes (OR-Tools VRP), PCR webhook, unit update
6. **`/map`** — Heatmap (KDE), DBSCAN clustering, ward risk, incidents, alerts, cybercrime layer
7. **`/cctv`** — Alert ingestion, ANPR background match, anomaly list
8. **`/assistant`** — Text query + voice query (Whisper), LLM (llama.cpp), keyword fallback
9. **`/legal`** — Stub
10. **`/ws`** — WebSocket broadcast (NEW_FIR, PCR_INCIDENT, CCTV_ALERT, ANPR_MATCH)
11. **`/admin`** — Officers CRUD, audit logs, health
12. **`/analytics`** — summary, trends (hourly/weekly/monthly/by_type), simulate event, resource_status, hotspot_surge, pattern_matches
13. **`/translate`** — Translation stub
14. **`/health`** — Health check

### Services (Business Logic)
- `prediction.py` — KDE heatmap, DBSCAN clustering, XGBoost `RiskPredictor` with dummy-training fallback
- `routing.py` — Google OR-Tools VRP + OSRM distance matrix with Haversine fallback
- `legal_intel.py` — BNS/BNSS section suggestion via regex, BNS→IPC cross-reference, Indian Kanoon API
- `document_gen.py` — python-docx template fill, Gujarati/Hindi glossary, SHA-256 audit hash
- `translation.py` — IndicTrans2 (service stub wired in)
- `vision.py` — Vision service stub
- `voice.py` — Voice/Whisper transcription stub
- `audit.py` — Activity logger
- `assistant.py` — LLM context builder

### Frontend — 8 Pages
1. **`/` Dashboard** — 6 stat cards, ChartsPanel, SearchBar, QuickActions, CrimeTypesChart, Recent Incidents, Notifications + WebSocket live reload
2. **`/cases`** — Filter chips (All/Open/Investigating/Pending/Solved/Closed), case cards grid
3. **`/incidents`** — Incidents page
4. **`/map`** — MapComponent + severity filter sidebar + legend
5. **`/analytics`** — 4 KPI cards, ChartsPanel, CrimeTypesChart (role-gated: SHO/DCP/Admin)
6. **`/patrol`** — Patrol page
7. **`/cctv`** — Camera grid with online/offline status, LIVE FEED/NO SIGNAL placeholders
8. **`/admin`** — 3 tabs: Users table, Roles matrix, Audit logs

### Auth & Security
- JWT with `jti` claim for token revocation via Redis blacklist
- Timing-attack safe login (dummy bcrypt check even for invalid badge_no)
- Rate limiting: 5/minute on `/auth/login` via slowapi
- PBAC: role defaults + per-officer override table
- Audit: every login, logout, case view, FIR creation, document generation is logged

---

## 🔴 What Is MISSING / Broken / Half-Done

### Critical Gaps
| # | Issue | Location | Impact |
|---|---|---|---|
| 1 | **`/cctv` GET route missing** | `api.js` calls `GET /cctv` but no such route exists — only `/cctv/alert` (POST) and `/cctv/anomalies` (GET) | CCTVPage always falls back to mock data |
| 2 | **`assistant.query` payload mismatch** | `api.js` sends `{ query, scope }` but backend expects `{ mode, question, case_id }` | AI assistant never works |
| 3 | **WebSocket reconnect is a no-op** | `Dashboard.jsx` has `setTimeout(() => {}, 5000)` — does nothing, no actual reconnect | WebSocket drops after server restart |
| 4 | **`FESTIVAL_CALENDAR` referenced but never defined** | `analytics.py` calls `from app.services.prediction import FESTIVAL_CALENDAR` but `prediction.py` has no such dict | `/analytics/simulate` crashes with ImportError |
| 5 | **`db.commit()` called on SQLAlchemy session incorrectly** | DB layer uses `AsyncSession`, but `connection.py` has no `commit()` method; all explicit `await db.commit()` calls will fail | FIR creation, patrol PCR, CCTV alert — all silently fail to persist |
| 6 | **Admin logs tab uses hardcoded mock data** | `AdminPage.jsx` Logs tab shows `MOCK_LOGS` — never calls `/admin/audit` | Audit trail invisible in UI |
| 7 | **`CasesPage.jsx` — no FIR creation form** | Cases page only lists cases; no button/modal to create a new FIR despite backend fully supporting it | Core workflow broken for IO officers |
| 8 | **`PatrolPage.jsx` is empty/stub** | No content in PatrolPage — officers can't see routes or dispatch | Patrol workflow non-functional in UI |
| 9 | **`IncidentsPage.jsx` is stub** | Similar to PatrolPage — no real data or interactions | Incidents page dead |
| 10 | **CCTV page has no anomaly feed** | Only shows cameras, never calls `/cctv/anomalies` endpoint which exists | Dashboard card planned but not wired |
| 11 | **Document templates may not exist** | `document_gen.py` references 8 `.docx` files in `templates/documents/` — not confirmed to exist | Doc generation → FileNotFoundError |
| 12 | **`translation.py` / `voice.py` are stubs** | Called in production code but likely not implemented | Document translation + voice query fail silently |
| 13 | **`llama.cpp` model not loaded** | Docker volume `llama_data:/models` exists but no model `.gguf` is seeded | AI assistant always falls back to keyword mode |
| 14 | **`osrm_data:/data` has no Ahmedabad map** | Docker expects `ahmedabad.osrm` but no download step — OSRM fails | Patrol routing falls back to Haversine only |
| 15 | **`SearchBar.jsx` assistant call uses wrong API shape** | Calls `assistant.query(query, scope)` but backend expects `{ mode: 'this_case'/'all_cases', question }` | AI search never returns answers |
| 16 | **CORS wildcard `allow_origins=["*"]` + `allow_credentials=False`** | JWT via Authorization header works but cookies won't. Also: `TrustedHostMiddleware` is commented out | Security concern for production |
| 17 | **`/auth` route duplicates declarations** | `auth.py` declares `pwd_ctx`, `oauth2`, `SECRET_KEY`, `ALGORITHM`, `ACCESS_EXP` TWICE | Harmless but sloppy — last value wins |
| 18 | **No `cctns.py` route registered in `main.py`** | `cctns.py` file exists but not mounted | CCTNS integration dead |
| 19 | **`RiskPredictor` trains on dummy data** | When `incidents` table < 10 rows (fresh deploy), model uses random noise data | Risk scores meaningless on fresh deploy |
| 20 | **No mobile app** | Master notebook requires React Native app — 0% done | Field officers have no mobile access |

---

## 🟡 What Is Partially Done / Needs Polish

| Item | State |
|---|---|
| SearchBar | Smart — has debounce, recent history, AI assistant integration, LLM mode toggle — but API payload is wrong |
| AdminPage | Users table works. Role matrix is hardcoded (should come from backend). Logs tab uses mock data |
| Dashboard WebSocket | Receives events and triggers reload — but reconnect is broken |
| AnalyticsPage | Loads real data from `/analytics/trends` and `/analytics/summary`, but new API endpoints (`resource_status`, `hotspot_surge`, `pattern_matches`) are NOT wired to the dashboard yet |
| MapComponent | Exists but unclear if Leaflet/Google Maps is initialized with real data |
| Legal section suggestion | Works for EN narrative; Gujarati/Hindi regex needs testing |
| PBAC | Backend complete; Admin UI has no way to grant/revoke per-officer overrides |

---

## 📊 Database Schema (Inferred)

From SQL queries across all files:

| Table | Key Columns |
|---|---|
| `officers` | id (UUID), badge_no, name, role, ps_id, password_hash, is_active, last_login |
| `officer_permission_overrides` | officer_id, permission_key, granted, expires_at |
| `police_stations` | id (UUID), name |
| `cases` | case_id, fir_no, ps_id, io_id, victim_*, accused_*, crime_*, geoloc (GEOGRAPHY), bns_sections[], search_vector |
| `incidents` | id, case_id, source, crime_type, lat, lon, geoloc, timestamp, severity, ward, status |
| `case_diary` | case_id, entry_type, description, officer_id, ts, auto_generated |
| `case_audit` | case_id, officer_id, action, field_name, new_value, changed_at |
| `cctv_alerts` | id, camera_id, source, alert_type, confidence, person_count, lat, lon, plate_no, matched_case, ts |
| `patrol_units` | id, unit_name, current_lat, current_lon, status, ps_id, last_update |
| `zone_risk_scores` | ward, hour_slot, day_of_week, risk_score, festival_flag |
| `doc_log` | id, case_id, doc_type, sha256, generated_by, language, generated_at |
| `permissions` | (referenced but not queried directly — PBAC handled in code) |

---

## 🎯 Priority Fix List (Ranked by Impact)

### 🔴 P0 — App Will Crash Without These
1. Fix `FESTIVAL_CALENDAR` missing in `prediction.py` → crashes `/analytics/simulate`
2. Fix `db.commit()` — SQLAlchemy AsyncSession needs `await session.commit()` not `await db.commit()` (check if connection.py wraps this)
3. Fix assistant API payload mismatch (`query/scope` → `mode/question/case_id`)

### 🔴 P1 — Core Workflows Broken
4. Add FIR creation form/modal to `CasesPage.jsx`
5. Build `PatrolPage.jsx` — show routes, units, dispatch
6. Build `IncidentsPage.jsx` — real incident list
7. Fix CCTV page — call `/cctv/anomalies` and show anomaly feed
8. Wire new analytics endpoints (`resource_status`, `hotspot_surge`, `pattern_matches`) to Dashboard cards

### 🟡 P2 — Data & Config
9. Add `FESTIVAL_CALENDAR` dict to `prediction.py`
10. Wire Admin Logs tab to `/admin/audit` API
11. Wire Admin Roles tab to backend overrides (not hardcoded matrix)
12. Fix WebSocket reconnect logic in Dashboard
13. Register `cctns.py` router in `main.py`

### 🟢 P3 — Production Readiness
14. Seed `llama_data` with a `.gguf` model (Llama 3.2 3B recommended)
15. Download and pre-process Ahmedabad OSRM map data
16. Confirm all 8 `.docx` templates exist in `templates/documents/`
17. Remove duplicate variable declarations in `auth.py`
18. Tighten CORS from `"*"` to actual frontend domain in production
19. Uncomment `TrustedHostMiddleware`
20. Start Mobile App (React Native)

---

## 🧠 Strengths Worth Calling Out

- **Legal precision** — BNS/BNSS 2024 only in documents, IPC as cross-reference only. Legally correct.
- **Security fundamentals** — bcrypt timing-attack protection, JWT blacklist, rate limiting, PBAC overrides — rare to see this level in a hackathon project.
- **Genuine ML** — Real KDE + DBSCAN + XGBoost (not just mock). OR-Tools VRP for patrol routing is production-grade.
- **Real-time pipeline** — WebSocket + PCR webhook + ANPR background match + case_diary auto-entry is a complete event pipeline.
- **PostGIS** — Spatial queries, `ST_MakePoint`, `GEOGRAPHY` type, `geoloc` column on every location table — proper GIS, not just lat/lon floats.
- **Audit trail** — Every sensitive action is logged to `case_audit` + `log_activity()` — defensible in court.
- **Graceful degradation** — Every API call in the frontend has a mock fallback so the UI always renders.
