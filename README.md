# SAMRAKSHA Unified Platform

SAMRAKSHA is a real-time situational awareness and law enforcement platform for the Ahmedabad City Police.

## Architecture & Service Map
- **Frontend**: React, Leaflet, Recharts, Vite, TailwindCSS
- **Backend**: FastAPI (Async, Python 3.11)
- **Database**: PostgreSQL + PostGIS (Spatial Data) + pg_trgm
- **External Dependencies**: Redis (Caching), ICCC/PCR Webhooks

## Features Implemented
- **FIR Management**: Create, submit, and view FIR details with automated BNS/BNSS section suggestions and seamless case tracking.
- **Document Generation**: Auto-generate official documents (Chargesheet, Medical Letter, Remand Request) for presentation directly from the Case details or FIR submission interface. Fallback mock generation is active for presentation purposes.
- **Patrolling & Tracking**: Real-time patrol unit tracking map showing route navigation between the unit's current position and assigned destinations.
- **CCTV Integration**: Integrated CCTV streaming interface to monitor live feeds of major intersections and stations.
- **Case AI Assistant**: Chat with an AI assistant integrated into the case detail view to quickly summarize crime narratives and extract key details.

## Developer Onboarding

1. **Environment Setup**
   Copy the example environment file and fill in your secrets.
   ```bash
   cp .env.example .env
   ```

2. **Run Services locally**
   Start the application using docker-compose:
   ```bash
   docker-compose up -d --build
   ```

3. **Database Migrations**
   Apply initial schema to PostgreSQL:
   ```bash
   psql -U samraksha_user -d samraksha -f backend/db/schema.sql
   ```

## OpenAPI & Webhooks Contract

### ICCC Webhook Interface
**Endpoint**: `/api/v1/webhooks/iccc`
**Headers Required**:
- `X-API-Key`: Must match `ICCC_API_KEY` from environment.

**Payload Schema (JSON)**:
```json
{
  "event_id": "string",
  "camera_id": "string",
  "alert_type": "string",
  "confidence": "number",
  "timestamp": "ISO-8601"
}
```

### PCR Webhook Interface
**Endpoint**: `/api/v1/webhooks/pcr`
**Headers Required**:
- `Authorization`: Bearer token matching `PCR_WEBHOOK_TOKEN`.

**Payload Schema (JSON)**:
```json
{
  "unit_id": "string",
  "status": "string",
  "lat": "number",
  "lon": "number"
}
```
