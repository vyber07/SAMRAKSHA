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
    ward            VARCHAR(100),
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

-- PL/pgSQL Trigger function to log case alterations to case_audit and auto-update case_diary on state transition
CREATE OR REPLACE FUNCTION log_case_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_row jsonb;
    old_row jsonb;
    key_name text;
    val_old text;
    val_new text;
    off_id UUID;
BEGIN
    off_id := COALESCE(NEW.io_id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF (TG_OP = 'UPDATE') THEN
        old_row := to_jsonb(OLD);
        changed_row := to_jsonb(NEW);
        
        FOR key_name IN SELECT jsonb_object_keys(changed_row) LOOP
            IF key_name NOT IN ('search_vector', 'updated_at') THEN
                val_old := old_row ->> key_name;
                val_new := changed_row ->> key_name;
                
                IF val_old IS DISTINCT FROM val_new THEN
                    INSERT INTO case_audit (case_id, officer_id, action, field_name, old_value, new_value)
                    VALUES (NEW.case_id, off_id, 'UPDATE', key_name, val_old, val_new);
                END IF;
            END IF;
        END LOOP;
        
        -- Auto-log status transitions to case_diary
        IF OLD.case_status IS DISTINCT FROM NEW.case_status THEN
            INSERT INTO case_diary (case_id, entry_type, description, officer_id, auto_generated)
            VALUES (
                NEW.case_id,
                CASE 
                    WHEN NEW.case_status = 'arrested' THEN 'arrest'
                    WHEN NEW.case_status = 'chargesheeted' THEN 'court'
                    WHEN NEW.case_status = 'closed' THEN 'court'
                    ELSE 'note'
                END,
                'Case status updated from ' || OLD.case_status || ' to ' || NEW.case_status,
                off_id,
                TRUE
            );
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO case_audit (case_id, officer_id, action, field_name, old_value, new_value)
        VALUES (NEW.case_id, off_id, 'INSERT', 'case_status', NULL, NEW.case_status);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Bind trigger to cases table
CREATE OR REPLACE TRIGGER trg_case_audit
AFTER INSERT OR UPDATE ON cases
FOR EACH ROW EXECUTE FUNCTION log_case_changes();

-- FIR sequences: atomic row-level locked counter per station+year (fixes race condition)
CREATE TABLE IF NOT EXISTS fir_sequences (
    ps_id   UUID     NOT NULL,
    year    SMALLINT NOT NULL,
    last_no INTEGER  NOT NULL DEFAULT 0,
    PRIMARY KEY (ps_id, year)
);

CREATE OR REPLACE FUNCTION next_fir_number(p_ps_id UUID, p_year INT)
RETURNS INT AS $$
DECLARE
    new_no INT;
BEGIN
    INSERT INTO fir_sequences (ps_id, year, last_no)
    VALUES (p_ps_id, p_year, 1)
    ON CONFLICT (ps_id, year)
    DO UPDATE SET last_no = fir_sequences.last_no + 1
    RETURNING last_no INTO new_no;
    RETURN new_no;
END;
$$ LANGUAGE plpgsql;

-- Scene log: every person entering/exiting a crime scene (Phase 2)
CREATE TABLE IF NOT EXISTS scene_log (
    id          BIGSERIAL PRIMARY KEY,
    case_id     UUID REFERENCES cases(case_id) NOT NULL,
    person_name VARCHAR(200) NOT NULL,
    role        VARCHAR(100),
    entry_time  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    exit_time   TIMESTAMPTZ,
    purpose     TEXT,
    logged_by   UUID REFERENCES officers(id)
);

-- Evidence chain of custody: every transfer step logged (Phase 3)
CREATE TABLE IF NOT EXISTS evidence_custody (
    id               BIGSERIAL PRIMARY KEY,
    case_id          UUID REFERENCES cases(case_id) NOT NULL,
    item_description TEXT NOT NULL,
    item_no          VARCHAR(50),
    status           VARCHAR(30) NOT NULL
                     CHECK (status IN ('collected','packaged','transferred','lab','court','returned')),
    transferred_from UUID REFERENCES officers(id),
    transferred_to   UUID REFERENCES officers(id),
    location         VARCHAR(300),
    notes            TEXT,
    ts               TIMESTAMPTZ DEFAULT NOW()
);

-- Forensic lab requests (Phase 4)
CREATE TABLE IF NOT EXISTS forensic_requests (
    id           BIGSERIAL PRIMARY KEY,
    case_id      UUID REFERENCES cases(case_id) NOT NULL,
    request_type VARCHAR(100) NOT NULL,
    lab_name     VARCHAR(200),
    status       VARCHAR(30) DEFAULT 'pending'
                 CHECK (status IN ('pending','submitted','in_progress','received','inconclusive')),
    result_summary TEXT,
    submitted_at TIMESTAMPTZ,
    received_at  TIMESTAMPTZ,
    requested_by UUID REFERENCES officers(id),
    ts           TIMESTAMPTZ DEFAULT NOW()
);

-- Witness/victim/accused statements with BNSS recording flag (Phase 6)
CREATE TABLE IF NOT EXISTS statements (
    id             BIGSERIAL PRIMARY KEY,
    case_id        UUID REFERENCES cases(case_id) NOT NULL,
    person_name    VARCHAR(200) NOT NULL,
    person_role    VARCHAR(20) NOT NULL
                   CHECK (person_role IN ('victim','witness','accused','expert')),
    statement_text TEXT,
    is_recorded    BOOLEAN DEFAULT FALSE,
    recording_path VARCHAR(500),
    recorded_by    UUID REFERENCES officers(id),
    bnss_section   VARCHAR(50) DEFAULT 'BNSS 183',
    ts             TIMESTAMPTZ DEFAULT NOW()
);

-- Warrants: search/arrest issued under BNSS (Phase 8)
CREATE TABLE IF NOT EXISTS warrants (
    id           BIGSERIAL PRIMARY KEY,
    case_id      UUID REFERENCES cases(case_id) NOT NULL,
    warrant_type VARCHAR(30) NOT NULL
                 CHECK (warrant_type IN ('search','arrest','production')),
    status       VARCHAR(30) DEFAULT 'requested'
                 CHECK (status IN ('requested','issued','denied','executed','expired')),
    issued_by    VARCHAR(200),
    issued_at    TIMESTAMPTZ,
    executed_at  TIMESTAMPTZ,
    notes        TEXT,
    requested_by UUID REFERENCES officers(id),
    ts           TIMESTAMPTZ DEFAULT NOW()
);

-- Court proceedings tracker: chargesheet through appeal (Phases 10-15)
CREATE TABLE IF NOT EXISTS court_proceedings (
    id           BIGSERIAL PRIMARY KEY,
    case_id      UUID REFERENCES cases(case_id) NOT NULL,
    stage        VARCHAR(40) NOT NULL
                 CHECK (stage IN (
                     'chargesheet_filed','remand_hearing','bail_hearing',
                     'framing_of_charge','trial','judgment','appeal'
                 )),
    hearing_date TIMESTAMPTZ,
    outcome      VARCHAR(300),
    next_date    TIMESTAMPTZ,
    court_name   VARCHAR(200),
    notes        TEXT,
    updated_by   UUID REFERENCES officers(id),
    ts           TIMESTAMPTZ DEFAULT NOW()
);

-- Closure columns on cases (Phase 16)
ALTER TABLE cases
    ADD COLUMN IF NOT EXISTS closure_type   VARCHAR(30)
        CHECK (closure_type IN ('cleared_by_arrest','cleared_otherwise','inactive_cold')),
    ADD COLUMN IF NOT EXISTS closure_reason TEXT,
    ADD COLUMN IF NOT EXISTS closed_at      TIMESTAMPTZ;



-- 15. Permissions Catalog
CREATE TABLE IF NOT EXISTS permissions (
    key VARCHAR(50) PRIMARY KEY,
    description TEXT
);

-- 16. Officer Permission Overrides
CREATE TABLE IF NOT EXISTS officer_permission_overrides (
    officer_id VARCHAR(50) REFERENCES officers(badge_no),
    permission_key VARCHAR(50) REFERENCES permissions(key),
    is_granted BOOLEAN NOT NULL,
    PRIMARY KEY (officer_id, permission_key)
);
