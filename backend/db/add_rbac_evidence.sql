-- Hybrid RBAC
CREATE TABLE IF NOT EXISTS permissions (
    id                  SERIAL PRIMARY KEY,
    permission_key      VARCHAR(100) UNIQUE NOT NULL,
    module              VARCHAR(50),
    action              VARCHAR(50),
    description         TEXT,
    default_for_role    VARCHAR(20),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS officer_permission_overrides (
    id                  SERIAL PRIMARY KEY,
    officer_id          UUID REFERENCES officers(id) ON DELETE CASCADE,
    permission_key      VARCHAR(100) REFERENCES permissions(permission_key),
    granted             BOOLEAN DEFAULT TRUE,
    expires_at          TIMESTAMPTZ,
    reason              TEXT,
    granted_by          UUID REFERENCES officers(id),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (officer_id, permission_key)
);

-- Insert default permissions
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

-- Evidence Table
CREATE TABLE evidence (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id     UUID REFERENCES cases(case_id),
    file_name   VARCHAR(255),
    mime_type   VARCHAR(100),
    sha256      VARCHAR(64),
    uploaded_by UUID REFERENCES officers(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);
