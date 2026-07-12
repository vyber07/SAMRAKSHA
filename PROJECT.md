# Project: SAMRAKSHA Frontend

## Architecture
- React + Vite + TypeScript frontend.
- Styled using the Markdown Design System (Stitch project `6534848930280493397`).
- Communicates with FastAPI backend running on port 8000.
- Database: PostgreSQL + PostGIS running on port 5432.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Environment & DB | Setup Docker containers, PostGIS DB, backend running, and seed data | none | PLANNED |
| 2 | Stitch Layout & Shell | App shell navigation, login integration, and base styling | M1 | PLANNED |
| 3 | Leaflet Crime Map | Interactive Leaflet map with hotspot/patrol route rendering | M1, M2 | PLANNED |
| 4 | FIR Entry Form | Form submission with BNS legal section autocomplete suggestions | M1, M2 | PLANNED |
| 5 | Case Detail & CCTV | Case tabs, case diary timeline, CCTV alert panel | M1, M2 | PLANNED |
| 6 | AI Chat & Docs UI | Chat interface with assistant and legal document downloader | M1, M2 | PLANNED |
| 7 | Integration & E2E | Final E2E testing, build verify, and compliance checklist | M1-M6 | PLANNED |

## Interface Contracts
### Frontend ↔ Backend
- **Auth**: `POST /auth/login` -> returns `{access_token, token_type, officer}`
- **Hotspots**: `GET /map/hotspots` -> returns `{heatmap, clusters, total, period_days}`
- **Incidents**: `GET /map/incidents` -> returns list of incidents
- **Legal**: `GET /legal/sections` -> BNS section suggestions/lookup
- **Cases**: `POST /cases/` -> creates a new case/FIR
- **CCTV Alerts**: `GET /map/alerts` -> returns list of CCTV alerts
- **AI Assistant**: `POST /assistant/query` -> returns response

## Code Layout
- Frontend: `/home/ubuntu/sa/frontend`
  - Source: `src/`
    - `components/` -> reusable components (Map, Form, Chat)
    - `pages/` -> page views (Dashboard, Login, MapPage, FIRPage, CaseDetail, CCTVPage, ChatPage)
    - `App.tsx` -> routing and app container
    - `index.css` -> design system global styles
