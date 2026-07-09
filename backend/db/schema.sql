CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Officers
CREATE TABLE IF NOT EXISTS officers (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    badge_no      VARCHAR(20) UNIQUE NOT NULL,
    name          VARCHAR(200) NOT NULL,
    rank          VARCHAR(50),
    role          VARCHAR(20) NOT NULL 
                  CHECK (role IN ('constable','io','sho','dcp','admin')),
    ps_id         UUID,
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Police stations
CREATE TABLE IF NOT EXISTS police_stations (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    VARCHAR(200) NOT NULL,
    zone    VARCHAR(100),
    ward    VARCHAR(100),
    lat     FLOAT,
    lon     FLOAT,
    address TEXT
);

-- Master case record (core of entire system)
CREATE TABLE IF NOT EXISTS cases (
    case_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fir_no          VARCHAR(50) UNIQUE NOT NULL,
    ps_id           UUID REFERENCES police_stations(id),
    io_id           UUID REFERENCES officers(id),
    victim_name     VARCHAR(200),
    victim_address  TEXT,
    victim_phone    VARCHAR(15),
    victim_age      SMALLINT,
    victim_gender   VARCHAR(10),
    victim_injury   BOOLEAN DEFAULT FALSE,
    accused_name    VARCHAR(200),
    accused_address TEXT,
    accused_age     SMALLINT,
    accused_photo   VARCHAR(500),
    crime_type      VARCHAR(100),
    crime_code      INTEGER,
    crime_narrative TEXT,
    crime_date      TIMESTAMPTZ,
    crime_location  TEXT,
    crime_lat       FLOAT,
    crime_lon       FLOAT,
    geoloc          GEOGRAPHY(POINT,4326),
    bns_sections    TEXT[],
    bnss_sections   TEXT[],
    bsa_sections    TEXT[],
    ipc_crossref    TEXT[],
    landmark_cases  TEXT[],
    case_status     VARCHAR(30) DEFAULT 'open'
                    CHECK (case_status IN 
                    ('open','arrested','chargesheeted','closed')),
    evidence_items  JSONB DEFAULT '[]',
    witnesses       JSONB DEFAULT '[]',
    arrest_date     TIMESTAMPTZ,
    arrest_lat      FLOAT,
    arrest_lon      FLOAT,
    search_vector   TSVECTOR,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_cases_geoloc  ON cases USING GIST(geoloc);
CREATE INDEX IF NOT EXISTS ix_cases_search  ON cases USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS ix_cases_status  ON cases(case_status);
CREATE INDEX IF NOT EXISTS ix_cases_ps      ON cases(ps_id);

-- Spatial incidents (feeds hotspot model)
CREATE TABLE IF NOT EXISTS incidents (
    id          SERIAL PRIMARY KEY,
    case_id     UUID REFERENCES cases(case_id),
    source      VARCHAR(20) NOT NULL
                CHECK (source IN 
                ('fir','cyber','patrol','pcr','cctv','manual')),
    crime_code  INTEGER,
    crime_type  VARCHAR(100),
    lat         FLOAT NOT NULL,
    lon         FLOAT NOT NULL,
    geoloc      GEOGRAPHY(POINT,4326),
    timestamp   TIMESTAMPTZ DEFAULT NOW(),
    severity    SMALLINT CHECK (severity BETWEEN 1 AND 5),
    zone        VARCHAR(100),
    ward        VARCHAR(100),
    status      VARCHAR(30) DEFAULT 'active'
);

CREATE INDEX IF NOT EXISTS ix_incidents_geoloc ON incidents USING GIST(geoloc);
CREATE INDEX IF NOT EXISTS ix_incidents_ts     ON incidents(timestamp DESC);

-- Insert-only audit log (no UPDATE/DELETE ever)
CREATE TABLE IF NOT EXISTS case_audit (
    id          BIGSERIAL PRIMARY KEY,
    case_id     UUID NOT NULL,
    officer_id  UUID NOT NULL,
    action      VARCHAR(20) NOT NULL,
    field_name  VARCHAR(100),
    old_value   TEXT,
    new_value   TEXT,
    ip_address  INET,
    changed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Check if rules exist by dropping first or using DO block
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_rules WHERE tablename = 'case_audit' AND rulename = 'no_update_audit') THEN
        CREATE RULE no_update_audit AS ON UPDATE TO case_audit DO INSTEAD NOTHING;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_rules WHERE tablename = 'case_audit' AND rulename = 'no_delete_audit') THEN
        CREATE RULE no_delete_audit AS ON DELETE TO case_audit DO INSTEAD NOTHING;
    END IF;
END
$$;

-- Case diary (auto-built timeline)
CREATE TABLE IF NOT EXISTS case_diary (
    id          BIGSERIAL PRIMARY KEY,
    case_id     UUID REFERENCES cases(case_id) NOT NULL,
    entry_type  VARCHAR(30) NOT NULL
                CHECK (entry_type IN 
                ('fir','arrest','seizure','witness',
                 'document','court','cctv','patrol','note')),
    description TEXT NOT NULL,
    officer_id  UUID REFERENCES officers(id),
    location    VARCHAR(300),
    auto_generated BOOLEAN DEFAULT FALSE,
    ts          TIMESTAMPTZ DEFAULT NOW()
);

-- Document log
CREATE TABLE IF NOT EXISTS doc_log (
    id           BIGSERIAL PRIMARY KEY,
    case_id      UUID REFERENCES cases(case_id) NOT NULL,
    doc_type     VARCHAR(50) NOT NULL
                 CHECK (doc_type IN 
                 ('chargesheet','medical_letter','remand_request',
                  'seizure_receipt','court_custody',
                  'panchanama','face_id')),
    sha256       VARCHAR(64) NOT NULL,
    generated_by UUID REFERENCES officers(id),
    language     VARCHAR(5) DEFAULT 'en',
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CCTV alerts
CREATE TABLE IF NOT EXISTS cctv_alerts (
    id           BIGSERIAL PRIMARY KEY,
    camera_id    VARCHAR(100),
    camera_name  VARCHAR(200),
    source       VARCHAR(20) NOT NULL
                 CHECK (source IN ('iccc','samraksha_model')),
    alert_type   VARCHAR(50) NOT NULL
                 CHECK (alert_type IN 
                 ('crowd_density','loitering','anomaly','anpr')),
    confidence   FLOAT,
    person_count INTEGER,
    lat          FLOAT,
    lon          FLOAT,
    geoloc       GEOGRAPHY(POINT,4326),
    plate_no     VARCHAR(20),
    matched_case UUID REFERENCES cases(case_id),
    ts           TIMESTAMPTZ DEFAULT NOW()
);

-- Zone risk scores (cached hourly from XGBoost)
CREATE TABLE IF NOT EXISTS zone_risk_scores (
    id            SERIAL PRIMARY KEY,
    ward          VARCHAR(100) NOT NULL,
    hour_slot     SMALLINT CHECK (hour_slot BETWEEN 0 AND 23),
    day_of_week   SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
    risk_score    FLOAT NOT NULL,
    crime_breakdown JSONB DEFAULT '{}',
    festival_flag BOOLEAN DEFAULT FALSE,
    computed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Patrol units
CREATE TABLE IF NOT EXISTS patrol_units (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_name   VARCHAR(100) NOT NULL,
    ps_id       UUID REFERENCES police_stations(id),
    current_lat FLOAT,
    current_lon FLOAT,
    status      VARCHAR(20) DEFAULT 'available'
                CHECK (status IN 
                ('available','deployed','unavailable','responding')),
    last_update TIMESTAMPTZ DEFAULT NOW()
);
