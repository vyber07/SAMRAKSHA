# Graph Report - /home/ubuntu/sa/backend  (2026-07-12)

## Corpus Check
- Corpus is ~8,973 words - fits in a single context window. You may not need a graph.

## Summary
- 186 nodes · 263 edges · 21 communities (19 shown, 2 thin omitted)
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 28 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- CCTV & Incidents
- Legal & Case Core
- Hotspot Predictions
- Voice Assistant
- Patrol Routing
- Database Core
- Admin API
- Data Models
- Auth Services
- CCTNS Sync
- Websockets
- Assistant Service
- Document Formatting
- Vision Pipeline
- Analytics
- Case Schemas
- Translation Service

## God Nodes (most connected - your core abstractions)
1. `fetch_one()` - 16 edges
2. `fetch_all()` - 13 edges
3. `execute()` - 11 edges
4. `generate_document()` - 8 edges
5. `query_assistant()` - 6 edges
6. `login()` - 6 edges
7. `FIRCreateRequest` - 6 edges
8. `RiskPredictor` - 6 edges
9. `CCTVPipeline` - 6 edges
10. `ingest_alert()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `get_dashboard_summary()` --calls--> `fetch_one()`  [INFERRED]
  app/api/analytics.py → app/db/connection.py
- `get_trends()` --calls--> `fetch_all()`  [INFERRED]
  app/api/analytics.py → app/db/connection.py
- `get_current_officer()` --calls--> `fetch_one()`  [INFERRED]
  app/api/auth.py → app/db/connection.py
- `search_cases()` --calls--> `fetch_all()`  [INFERRED]
  app/api/cases.py → app/db/connection.py
- `simulate_event()` --calls--> `fetch_one()`  [INFERRED]
  app/api/analytics.py → app/db/connection.py

## Import Cycles
- None detected.

## Communities (21 total, 2 thin omitted)

### Community 0 - "CCTV & Incidents"
Cohesion: 0.16
Nodes (17): get_case(), CCTVAlertRequest, check_anpr_match(), ingest_alert(), BaseModel, generate_document(), GenerateRequest, list_documents() (+9 more)

### Community 1 - "Legal & Case Core"
Cohesion: 0.16
Nodes (11): create_fir(), FIRCreateRequest, BaseModel, search_cases(), BaseModel, search_case_law_endpoint(), suggest_sections(), SuggestRequest (+3 more)

### Community 2 - "Hotspot Predictions"
Cohesion: 0.23
Nodes (11): get_active_alerts(), get_cybercrime_layer(), get_heatmap(), get_incidents(), get_ward_risk(), risk_level(), fetch_all(), compute_kde_heatmap() (+3 more)

### Community 3 - "Voice Assistant"
Cohesion: 0.22
Nodes (9): AssistantQuery, BaseModel, query_assistant(), Simple fallback when LLM is not available, simple_keyword_answer(), voice_query_assistant(), load_whisper_model(), VoiceService (+1 more)

### Community 4 - "Patrol Routing"
Cohesion: 0.24
Nodes (10): get_patrol_routes(), PCRWebhook, BaseModel, Receives incidents from Police Control Room (100 call center).     PCR operator, receive_pcr_incident(), UnitUpdate, update_patrol_unit(), haversine_distance() (+2 more)

### Community 5 - "Database Core"
Cohesion: 0.36
Nodes (6): close_db(), init_db(), lifespan(), FastAPI, lifespan(), FastAPI

### Community 6 - "Admin API"
Cohesion: 0.27
Nodes (5): create_officer(), OfficerCreate, OfficerUpdate, BaseModel, update_officer()

### Community 7 - "Data Models"
Cohesion: 0.28
Nodes (6): Case, CaseDiary, Evidence, Base, Base, User

### Community 8 - "Auth Services"
Cohesion: 0.32
Nodes (6): create_access_token(), get_current_officer(), login(), LoginRequest, BaseModel, Request

### Community 9 - "CCTNS Sync"
Cohesion: 0.29
Nodes (6): CCTNSSyncRequest, BaseModel, Mock endpoint to simulate syncing an FIR to the national CCTNS/BharatPol databas, Mock endpoint to simulate searching the national CCTNS/BharatPol database., search_cctns(), sync_to_cctns()

### Community 10 - "Websockets"
Cohesion: 0.32
Nodes (4): DashboardManager, # TODO: imports for get_recent_incidents, etc, websocket_endpoint(), WebSocket

### Community 11 - "Assistant Service"
Cohesion: 0.32
Nodes (4): Case, Officer, Base, CaseAssistant

### Community 12 - "Document Formatting"
Cohesion: 0.54
Nodes (7): format_date(), format_evidence(), format_landmark_cases(), format_witnesses(), generate_document(), today_formatted(), translate()

### Community 15 - "Analytics"
Cohesion: 0.40
Nodes (5): get_dashboard_summary(), get_trends(), BaseModel, simulate_event(), SimulateRequest

### Community 16 - "Case Schemas"
Cohesion: 0.47
Nodes (5): CaseCreate, CaseResponse, Config, EvidenceSchema, BaseModel

## Knowledge Gaps
- **1 isolated node(s):** `Config`
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fetch_all()` connect `Hotspot Predictions` to `CCTV & Incidents`, `Legal & Case Core`, `Voice Assistant`, `Patrol Routing`, `Database Core`, `Analytics`?**
  _High betweenness centrality (0.130) - this node is a cross-community bridge._
- **Why does `fetch_one()` connect `CCTV & Incidents` to `Voice Assistant`, `Patrol Routing`, `Database Core`, `Auth Services`, `Analytics`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `execute()` connect `CCTV & Incidents` to `Legal & Case Core`, `Hotspot Predictions`, `Patrol Routing`, `Database Core`, `Auth Services`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 11 inferred relationships involving `fetch_one()` (e.g. with `get_dashboard_summary()` and `simulate_event()`) actually correct?**
  _`fetch_one()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **Are the 10 inferred relationships involving `fetch_all()` (e.g. with `get_trends()` and `query_assistant()`) actually correct?**
  _`fetch_all()` has 10 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `execute()` (e.g. with `login()` and `create_fir()`) actually correct?**
  _`execute()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `query_assistant()` (e.g. with `fetch_all()` and `fetch_one()`) actually correct?**
  _`query_assistant()` has 2 INFERRED edges - model-reasoned connections that need verification._