# SAMRAKSHA Project Status Comparison

This document provides a comprehensive comparison between the **Master Notebook (Notion)** requirements and the **actual implemented codebase**, along with strategic recommendations for dashboard enhancements.

## 1. Codebase vs. Master Notebook Comparison

| Component | Status in Master Notebook | Actual Codebase Status | Notes |
| :--- | :--- | :--- | :--- |
| **Backend API (FastAPI)** | ✅ Complete | ✅ Complete | 14 route files implemented (`cases`, `patrol`, `analytics`, `assistant`, etc.). JWT Auth & PBAC integrated. |
| **Database Schema** | ✅ Complete | ✅ Complete | PostgreSQL + PostGIS schema (`schema.sql`) contains all required tables, triggers, and PostGIS indexes. |
| **Access Control (PBAC DB)** | ❌ Priority 1 (Missing) | ✅ Complete | **FIXED:** The `permissions` and `officer_permission_overrides` tables are present in `schema.sql`. |
| **Frontend (React)** | ❌ Priority 1 (Deleted) | 🔄 In Progress | `frontend/src/pages` contains the new flat UI JSX pages (`AdminPage.jsx`, `DashboardPage` components). It is actively being rebuilt. |
| **Mobile App (React Native)** | ❌ Priority 1 (Not started) | ❌ Not Started | No React Native codebase found in the repository yet. |
| **7 Legal Documents** | ❌ Priority 1 | 🔄 Partial | `backend/templates/documents` contains the `.docx` templates, and `documents.py` endpoint exists to trigger them. Still needs legal section verification. |
| **Admin Dashboard** | ❌ Priority 2 | 🔄 In Progress | `AdminPage.jsx` exists on the frontend, and `admin.py` API is implemented. |
| **Hotspot Mapping & AI** | ✅ Mapped | ✅ Implemented | `hotspot.py`, `ml.py`, `vision.py` exist with stubs/integrations for XGBoost, DBSCAN, MediaPipe, etc. |

## 2. Recommended Dashboard Cards (New Additions)

To enhance the DCP Command Center and Officer Dashboards, here are high-impact cards we should add:

### 🚨 1. Real-Time Resource Allocation (Gauge/Donut)
- **What it shows:** % of on-duty officers currently engaged in an active incident vs. available.
- **Why:** Allows the DCP to instantly know if the current shift is overwhelmed (e.g., 90% engaged) and if reserve forces need to be called in.

### ⏱️ 2. 100/PCR SLA Breaches (List/Alerts)
- **What it shows:** A live queue of incidents where the response time has exceeded the SLA (e.g., >15 mins). 
- **Why:** Flags severe delays in response time for immediate intervention.

### 📈 3. Predictive Hotspot Surge Warnings (Trend Line)
- **What it shows:** Upcoming 3-hour risk trajectory for the top 3 highest-risk wards.
- **Why:** Shifts focus from "what is happening" to "what is about to happen," allowing pre-emptive deployment.

### 🕵️ 4. AI Pattern Matches (Feed)
- **What it shows:** A scrolling feed of recent AI-detected Modus Operandi (MO) matches (e.g., "Chain snatching in Ward 4 matches 3 cases from yesterday").
- **Why:** Connects the dots for investigators automatically without requiring manual search.

### 🎥 5. Live CCTV Anomaly Feed (Thumbnails)
- **What it shows:** The latest 4 thumbnail captures from ICCC or MediaPipe where an anomaly (crowd gathering/loitering) was detected.
- **Why:** Provides visual context to alerts before an officer arrives on the scene.

## 3. Workflow & Agent Deployment Tasks
I will formulate the task lists based on the above suggestions to continue the workflow.
