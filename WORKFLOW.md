# SAMRAKSHA Platform Workflow

## 1. FIR Creation & Case Assignment Workflow
1. **Report Entry**: Officer inputs the incident details, crime location, narrative, and victim details into the FIR Entry page.
2. **AI Suggestion**: A background AI assists the officer by suggesting applicable sections of the BNS and BNSS codes based on the narrative.
3. **Submission**: The FIR is saved to the Postgres database. The system automatically extracts location coordinates for GIS mapping.
4. **Document Generation**: Following submission, the officer can directly generate standardized legal forms (e.g., Medical Letter, FIR copy).

## 2. Document Generation Workflow (Presentation Mode)
1. **Select Document**: In the Case Detail page or FIR confirmation modal, select the desired document (e.g., Chargesheet).
2. **Metadata Fetch**: The backend queries the case details, victim info, IO assigned, and relevant police station.
3. **Mock Fallback**: If a dummy case ID is queried during a presentation, the system intercepts the request and automatically populates a dummy JSON object to ensure seamless PDF generation.
4. **Delivery**: The system dynamically converts the data into a PDF or Docx blob and streams it back to the user's browser.

## 3. Real-Time Patrolling & Dispatch Workflow
1. **PCR Webhook Update**: Patrol vehicles constantly ping their locations to the `/api/v1/webhooks/pcr` endpoint.
2. **Dashboard UI**: The frontend polls or subscribes to location updates, animating vehicles on the interactive Leaflet map.
3. **Route Tracing**: Clicking on a patrol unit brings up a popup that traces the assigned navigation route using simulated or actual GPS path nodes.

## 4. CCTV & Monitoring Workflow
1. **Live Feed**: Video streams are routed through an internal stream server (e.g., Nginx-RTMP or direct WebRTC).
2. **Frontend Viewing**: The user selects a camera from the grid view. The frontend loads a mock/live MP4 video loop mimicking a real feed from intersections or stations.
3. **ICCC Alerts**: If the ICCC detects an anomaly (e.g., weapon or crowd), it sends a POST request to `/api/v1/webhooks/iccc`, triggering an alert on the user's dashboard.
