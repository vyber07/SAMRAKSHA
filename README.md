# SAMRAKSHA Unified Platform

SAMRAKSHA is a real-time situational awareness and law enforcement platform for the Ahmedabad City Police.

## Architecture & Service Map
- **Frontend**: React, Leaflet, Recharts
- **Backend**: FastAPI (Async)
- **Database**: PostgreSQL + PostGIS (Spatial Data) + pg_trgm
- **External Dependencies**: Redis (Caching), ICCC/PCR Webhooks

## Developer Onboarding

1. **Environment Setup**
   Copy the example environment file and fill in your secrets.
   \`\`\`bash
   cp .env.example .env
   \`\`\`

2. **Run Services locally**
   Start the application using docker-compose:
   \`\`\`bash
   docker-compose up -d --build
   \`\`\`

3. **Database Migrations**
   Apply initial schema to PostgreSQL:
   \`\`\`bash
   psql -U samraksha_user -d samraksha -f backend/db/schema.sql
   \`\`\`

## OpenAPI & Webhooks Contract

### ICCC Webhook Interface
**Endpoint**: `/api/v1/webhooks/iccc`
**Headers Required**:
- \`X-API-Key\`: Must match \`ICCC_API_KEY\` from environment.

**Payload Schema (JSON)**:
\`\`\`json
{
  "event_id": "string",
  "camera_id": "string",
  "alert_type": "string",
  "confidence": "number",
  "timestamp": "ISO-8601"
}
\`\`\`

### PCR Webhook Interface
**Endpoint**: `/api/v1/webhooks/pcr`
**Headers Required**:
- \`Authorization\`: Bearer token matching \`PCR_WEBHOOK_TOKEN\`.

**Payload Schema (JSON)**:
\`\`\`json
{
  "unit_id": "string",
  "status": "string",
  "lat": "number",
  "lon": "number"
}
\`\`\`
