# Graph Report - sam  (2026-07-09)

## Corpus Check
- 66 files · ~38,905 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 496 nodes · 761 edges · 29 communities (21 shown, 8 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 64 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `aa4f06b2`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- _search_csv
- _search_csv
- design_system.py
- DesignSystemGenerator
- design_system.py
- DesignSystemGenerator
- format_output
- format_output
- ui-ux-pro-max
- ui-ux-pro-max
- dependencies
- compilerOptions
- RiskPredictor
- seed
- patrol.py
- CCTVPipeline
- DashboardManager
- document_gen.py
- FIRForm.tsx
- Unified Predictive Policing & AI Case Intelligence Platform
- AuthMiddleware
- get_llm_response
- OPEN_SOURCE_LICENSES.md
- graphify.md
- graphify.md
- setup.sh
- 1. Compliance Matrix Mapping

## God Nodes (most connected - your core abstractions)
1. `fetch_one()` - 21 edges
2. `fetch_all()` - 17 edges
3. `compilerOptions` - 17 edges
4. `api` - 14 edges
5. `useAuth` - 14 edges
6. `execute()` - 12 edges
7. `DesignSystemGenerator` - 11 edges
8. `DesignSystemGenerator` - 11 edges
9. `PRIMARY_BTN` - 11 edges
10. `RiskPredictor` - 10 edges

## Surprising Connections (you probably didn't know these)
- `_generate_intelligent_overrides()` --calls--> `search()`  [INFERRED]
  .agent/skills/ui-ux-pro-max/scripts/design_system.py → .agent/skills/ui-ux-pro-max/scripts/core.py
- `_generate_intelligent_overrides()` --calls--> `search()`  [INFERRED]
  .agents/skills/uiux-pro-max/scripts/design_system.py → .agents/skills/uiux-pro-max/scripts/core.py
- `get_dashboard_summary()` --calls--> `fetch_one()`  [INFERRED]
  backend/app/api/analytics.py → backend/app/db/connection.py
- `get_trends()` --calls--> `fetch_all()`  [INFERRED]
  backend/app/api/analytics.py → backend/app/db/connection.py
- `query_assistant()` --calls--> `get_llm_response()`  [INFERRED]
  backend/app/api/assistant.py → backend/app/services/assistant.py

## Import Cycles
- None detected.

## Communities (29 total, 8 thin omitted)

### Community 0 - "_search_csv"
Cohesion: 0.15
Nodes (15): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+7 more)

### Community 1 - "_search_csv"
Cohesion: 0.15
Nodes (15): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+7 more)

### Community 2 - "design_system.py"
Cohesion: 0.09
Nodes (25): DesignSystemGenerator, _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+17 more)

### Community 3 - "DesignSystemGenerator"
Cohesion: 0.05
Nodes (61): api, App(), PrivateRoute(), PublicRoute(), CaseAssistant(), Message, CaseDiary(), DiaryEntry (+53 more)

### Community 4 - "design_system.py"
Cohesion: 0.09
Nodes (25): DesignSystemGenerator, _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), generate_design_system(), _generate_intelligent_overrides() (+17 more)

### Community 5 - "DesignSystemGenerator"
Cohesion: 0.05
Nodes (56): AsyncSession, get_dashboard_summary(), get_trends(), BaseModel, simulate_event(), SimulateRequest, AssistantQuery, BaseModel (+48 more)

### Community 8 - "ui-ux-pro-max"
Cohesion: 0.07
Nodes (29): Accessibility, Available Domains, Available Stacks, Common Rules for Professional UI, Example Workflow, How to Use This Skill, Icons & Visual Elements, Interaction (+21 more)

### Community 9 - "ui-ux-pro-max"
Cohesion: 0.07
Nodes (29): Accessibility, Available Domains, Available Stacks, Common Rules for Professional UI, Example Workflow, How to Use This Skill, Icons & Visual Elements, Interaction (+21 more)

### Community 10 - "dependencies"
Cohesion: 0.07
Nodes (27): dependencies, axios, leaflet, leaflet.heat, lucide-react, react, react-dom, react-leaflet (+19 more)

### Community 11 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 12 - "RiskPredictor"
Cohesion: 0.23
Nodes (7): get_heatmap(), build_features(), compute_kde_heatmap(), get_festival_flag(), RiskPredictor, run_dbscan_clustering(), DataFrame

### Community 13 - "seed"
Cohesion: 0.22
Nodes (12): get_legal_suggestions(), BaseModel, search_case_law_endpoint(), SuggestRequest, get_ipc_crossref(), search_case_law(), suggest_sections(), json_dumps() (+4 more)

### Community 14 - "patrol.py"
Cohesion: 0.29
Nodes (8): get_patrol_routes(), BaseModel, register_patrol_unit(), UnitRegister, UnitUpdate, update_patrol_unit(), get_travel_time_matrix(), optimize_patrol_routes()

### Community 16 - "DashboardManager"
Cohesion: 0.33
Nodes (4): DashboardManager, websocket_endpoint(), get_db(), WebSocket

### Community 17 - "document_gen.py"
Cohesion: 0.47
Nodes (8): create_default_template_file(), format_date(), format_evidence(), format_landmark_cases(), format_witnesses(), generate_document(), today_formatted(), translate()

### Community 18 - "FIRForm.tsx"
Cohesion: 0.33
Nodes (4): lookup_cctns_suspect(), lookup_cctns_vehicle(), Mock CCTNS national crime registry lookup, Mock national vehicle database lookup

### Community 19 - "Unified Predictive Policing & AI Case Intelligence Platform"
Cohesion: 0.22
Nodes (8): Core Concept, Disclaimer, Features, Legal Notice, Problem Statements Addressed, Quick Start, SAMRAKSHA, Unified Predictive Policing & AI Case Intelligence Platform

### Community 20 - "AuthMiddleware"
Cohesion: 0.33
Nodes (4): AuthMiddleware, Request, BaseHTTPMiddleware, Response

### Community 28 - "1. Compliance Matrix Mapping"
Cohesion: 0.33
Nodes (5): 1. Compliance Matrix Mapping, 2. Identified Notebook Discrepancies & Stubs, PS6 — KANADSHIELD26_P2_06 (CrimeGPT Case Automation), PS7 — KANADSHIELD26_P2_07 (Predictive Hotspot Mapping), SAMRAKSHA — Verification Audit Report

## Knowledge Gaps
- **125 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+120 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `fetch_all()` connect `DesignSystemGenerator` to `DashboardManager`, `RiskPredictor`, `patrol.py`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `fetch_one()` connect `DesignSystemGenerator` to `patrol.py`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `execute()` connect `DesignSystemGenerator` to `patrol.py`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Are the 18 inferred relationships involving `fetch_one()` (e.g. with `get_dashboard_summary()` and `simulate_event()`) actually correct?**
  _`fetch_one()` has 18 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `fetch_all()` (e.g. with `get_trends()` and `query_assistant()`) actually correct?**
  _`fetch_all()` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BM25 ranking algorithm for text search`, `Lowercase, split, remove punctuation, filter short words`, `Build BM25 index from documents` to the rest of the system?**
  _179 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `_search_csv` be split into smaller, more focused modules?**
  _Cohesion score 0.14736842105263157 - nodes in this community are weakly interconnected._