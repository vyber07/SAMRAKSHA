CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Officers
CREATE TABLE officers (
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
CREATE TABLE police_stations (
    id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name    VARCHAR(200) NOT NULL,
    zone    VARCHAR(100),
    ward    VARCHAR(100),
    lat     FLOAT,
    lon     FLOAT,
    address TEXT
);

-- Master case record (core of entire system)
CREATE TABLE cases (
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

CREATE INDEX ix_cases_geoloc  ON cases USING GIST(geoloc);
CREATE INDEX ix_cases_search  ON cases USING GIN(search_vector);
CREATE INDEX ix_cases_status  ON cases(case_status);
CREATE INDEX ix_cases_ps      ON cases(ps_id);

-- Spatial incidents (feeds hotspot model)
CREATE TABLE incidents (
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

CREATE INDEX ix_incidents_geoloc ON incidents USING GIST(geoloc);
CREATE INDEX ix_incidents_ts     ON incidents(timestamp DESC);

-- Insert-only audit log (no UPDATE/DELETE ever)
CREATE TABLE case_audit (
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
CREATE RULE no_update_audit AS ON UPDATE TO case_audit DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO case_audit DO INSTEAD NOTHING;

-- Case diary (auto-built timeline)
CREATE TABLE case_diary (
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
CREATE TABLE doc_log (
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
CREATE TABLE cctv_alerts (
    id           BIGSERIAL PRIMARY KEY,
    camera_id    VARCHAR(100),
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
CREATE TABLE zone_risk_scores (
    id           SERIAL PRIMARY KEY,
    ward         VARCHAR(100) NOT NULL,
    hour_slot    SMALLINT CHECK (hour_slot BETWEEN 0 AND 23),
    day_of_week  SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),
    risk_score   FLOAT NOT NULL,
    festival_flag BOOLEAN DEFAULT FALSE,
    computed_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Patrol units
CREATE TABLE patrol_units (
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

-- FIR SEQUENCE TABLE (Atomic Numbering)
CREATE TABLE IF NOT EXISTS fir_sequences (
    ps_id           UUID NOT NULL,
    year            INTEGER NOT NULL,
    next_number     INTEGER DEFAULT 1,
    PRIMARY KEY (ps_id, year)
);

-- Atomic FIR numbering function (uses row-level lock, no race condition)
CREATE OR REPLACE FUNCTION next_fir_number(p_ps_id UUID, p_year INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    v_ps_code VARCHAR;
    v_next_number INTEGER;
BEGIN
    -- Get PS code (first 3 letters of PS name)
    SELECT SUBSTRING(name, 1, 3) INTO v_ps_code
    FROM police_stations WHERE id = p_ps_id;
    
    -- Insert or update sequence, get next number
    INSERT INTO fir_sequences (ps_id, year, next_number)
    VALUES (p_ps_id, p_year, 1)
    ON CONFLICT (ps_id, year)
    DO UPDATE SET next_number = fir_sequences.next_number + 1
    RETURNING next_number INTO v_next_number;
    
    -- Return formatted FIR number: AMB/2026/0001
    RETURN v_ps_code || '/' || p_year::VARCHAR || '/' || LPAD(v_next_number::VARCHAR, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ========== PERMISSIONS & RBAC ==========

-- Permission catalog
CREATE TABLE IF NOT EXISTS permissions (
    id                  SERIAL PRIMARY KEY,
    permission_key      VARCHAR(100) UNIQUE NOT NULL,
    module              VARCHAR(50),  -- 'cases', 'documents', 'patrol', 'admin'
    action              VARCHAR(50),  -- 'create', 'view', 'edit', 'delete'
    description         TEXT,
    default_for_role    VARCHAR(20),  -- Default role that has this permission
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Officer-level permission overrides (for exceptions)
CREATE TABLE IF NOT EXISTS officer_permission_overrides (
    id                  SERIAL PRIMARY KEY,
    officer_id          UUID REFERENCES officers(id) ON DELETE CASCADE,
    permission_key      VARCHAR(100) REFERENCES permissions(permission_key),
    granted             BOOLEAN DEFAULT TRUE,  -- TRUE=grant, FALSE=revoke
    expires_at          TIMESTAMPTZ,  -- NULL=permanent
    reason              TEXT,
    granted_by          UUID REFERENCES officers(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (officer_id, permission_key)
);

-- Seed base permissions
INSERT INTO permissions (permission_key, module, action, description, default_for_role) VALUES
    ('case_create',       'cases', 'create', 'Create new FIR', 'io'),
    ('case_view_own_ps',  'cases', 'view',   'View cases from own PS only', 'io'),
    ('case_view_all',     'cases', 'view',   'View all cases', 'sho'),
    ('case_edit',         'cases', 'edit',   'Edit case details', 'io'),
    ('doc_generate',      'documents', 'create', 'Generate legal documents', 'sho'),
    ('patrol_view',       'patrol', 'view',   'View patrol routes', 'io'),
    ('patrol_dispatch',   'patrol', 'edit',   'Dispatch patrol units', 'sho'),
    ('analytics_view',    'admin', 'view',   'View analytics dashboard', 'dcp'),
    ('admin_permissions', 'admin', 'edit',   'Manage officer permissions', 'admin'),
    ('cctv_view',         'cctv', 'view',   'View CCTV alerts', 'sho') ON CONFLICT DO NOTHING;
