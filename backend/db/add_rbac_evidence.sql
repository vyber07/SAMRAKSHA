-- Hybrid RBAC
CREATE TABLE permissions (
    id          VARCHAR(50) PRIMARY KEY,
    description TEXT
);

CREATE TABLE officer_permission_overrides (
    officer_id  UUID REFERENCES officers(id),
    permission  VARCHAR(50) REFERENCES permissions(id),
    is_grant    BOOLEAN NOT NULL,
    PRIMARY KEY (officer_id, permission)
);

-- Insert default permissions
INSERT INTO permissions (id, description) VALUES
('fir:create', 'Create new FIRs'),
('fir:view_all', 'View FIRs across all stations'),
('docs:generate', 'Generate legal documents'),
('patrol:reroute', 'Reroute patrol units'),
('analytics:view', 'View analytics and simulate'),
('cctv:view', 'View CCTV alerts');

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
