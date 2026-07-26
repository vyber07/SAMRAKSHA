import React, { useEffect, useState } from 'react';
import PageShell from './PageShell';
import { admin } from '../lib/api';

const TABS = [
  { id: 'users', icon: '👥', label: 'Users' },
  { id: 'roles', icon: '🔐', label: 'Roles Matrix' },
  { id: 'iam',   icon: '🛡️', label: 'IAM Policies' },
  { id: 'logs',  icon: '📋', label: 'Audit Logs' },
];



const ROLE_MATRIX = [
  { feature: 'View Cases',      admin: true,  sho: true,  dcp: true,  io: true,  constable: false },
  { feature: 'Create FIR',      admin: true,  sho: true,  dcp: false, io: true,  constable: false },
  { feature: 'Analytics',       admin: true,  sho: true,  dcp: true,  io: false, constable: false },
  { feature: 'Patrol Dispatch', admin: true,  sho: true,  dcp: false, io: false, constable: false },
  { feature: 'CCTV View',       admin: true,  sho: true,  dcp: false, io: false, constable: false },
  { feature: 'Gen Documents',   admin: true,  sho: true,  dcp: false, io: true,  constable: false },
  { feature: 'Admin Panel',     admin: true,  sho: false, dcp: false, io: false, constable: false },
];

export default function AdminPage() {
  const [tab,       setTab]      = useState('users');
  const [officers,  setOfficers] = useState([]);
  const [logs,      setLogs]     = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Audit Logs Filters
  const [logFilterOfficer, setLogFilterOfficer] = useState('');
  const [logFilterAction, setLogFilterAction] = useState('');
  const [logFilterQuery, setLogFilterQuery] = useState('');

  // IAM state
  const [allPerms, setAllPerms] = useState([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [overrides, setOverrides] = useState({});
  const [iamSaving, setIamSaving] = useState(false);

  // Load officers list & all permissions
  useEffect(() => {
    (async () => {
      try {
        const res = await admin.officers();
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setOfficers(data);
      } catch {
        setOfficers([]);
      }
      try {
        const pRes = await admin.getPermissions();
        setAllPerms(pRes.data || []);
      } catch (e) { console.error('Failed to load permissions'); }
    })();
  }, []);

  useEffect(() => {
    if (tab === 'iam' && selectedOfficer) {
      (async () => {
        try {
          const res = await admin.getOfficerPerms(selectedOfficer);
          const map = {};
          (res.data || []).forEach(o => { map[o.permission_key] = o.granted; });
          setOverrides(map);
        } catch(e) { console.error('Failed to load overrides'); }
      })();
    }
  }, [tab, selectedOfficer]);

  const handleSaveIAM = async () => {
    if (!selectedOfficer) return;
    setIamSaving(true);
    try {
      const payload = Object.entries(overrides).map(([k, v]) => ({ permission_key: k, granted: v }));
      await admin.setOfficerPerms(selectedOfficer, payload);
      alert('✅ IAM Policies updated successfully!');
    } catch (e) {
      alert('❌ Failed to update policies');
    } finally {
      setIamSaving(false);
    }
  };

  // Load audit logs when tab is switched to logs
  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await admin.auditLogs({ officer: logFilterOfficer, type: logFilterAction, q: logFilterQuery });
      const data = Array.isArray(res.data) ? res.data : [];
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'logs') fetchLogs();
  }, [tab, logFilterOfficer, logFilterAction, logFilterQuery]);

  const th = { textAlign: 'left', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' };
  const td = { padding: '11px 14px', fontSize: 13, borderBottom: '1px solid var(--border)' };

  return (
    <PageShell title="Administration">
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '9px 20px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${tab === t.id ? 'var(--primary)' : 'var(--border)'}`,
            background: tab === t.id ? 'var(--primary)' : 'var(--surface)',
            color: tab === t.id ? '#fff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all var(--t-fast) var(--ease)',
          }}>{t.icon} {t.label}</button>
        ))}
      </div>

      <div className="glass" style={{ padding: 24 }}>
        {/* ─── Users Tab ─────────────────────────────────────────── */}
        {tab === 'users' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Badge</th>
                <th style={th}>Name</th>
                <th style={th}>Role</th>
                <th style={th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((o, i) => (
                <tr key={o.badge_no || i} style={{ transition: 'background var(--t-fast)' }}>
                  <td style={{ ...td, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{o.badge_no}</td>
                  <td style={td}>{o.name}</td>
                  <td style={{ ...td, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tertiary)' }}>{o.role}</td>
                  <td style={td}>
                    <span style={{ color: o.is_active !== false ? 'var(--success)' : 'var(--error)', fontSize: 12, fontWeight: 600 }}>
                      {o.is_active !== false ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ─── Roles Tab ─────────────────────────────────────────── */}
        {tab === 'roles' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={th}>Feature</th>
                {['Admin', 'SHO', 'DCP', 'IO', 'Constable'].map((r) => (
                  <th key={r} style={{ ...th, textAlign: 'center' }}>{r}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLE_MATRIX.map((row) => (
                <tr key={row.feature}>
                  <td style={{ ...td, fontWeight: 600 }}>{row.feature}</td>
                  {['admin', 'sho', 'dcp', 'io', 'constable'].map((r) => (
                    <td key={r} style={{ ...td, textAlign: 'center' }}>
                      {row[r]
                        ? <span style={{ color: 'var(--success)', fontSize: 16 }}>✅</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ─── IAM Policies Tab ────────────────────────────────────── */}
        {tab === 'iam' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Target Officer / Role Override</label>
                <select style={{
                  width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', color: 'var(--text)', fontSize: 14, outline: 'none'
                }} value={selectedOfficer} onChange={(e) => setSelectedOfficer(e.target.value)}>
                  <option value="">-- Select an Officer --</option>
                  {officers.map(o => (
                    <option key={o.badge_no} value={o.badge_no}>{o.name} ({o.badge_no} - {o.role.toUpperCase()})</option>
                  ))}
                </select>
              </div>
              <button onClick={handleSaveIAM} disabled={!selectedOfficer || iamSaving} style={{
                padding: '10px 24px', borderRadius: 'var(--radius-md)',
                border: 'none', background: 'var(--primary)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: (!selectedOfficer || iamSaving) ? 'not-allowed' : 'pointer',
                opacity: (!selectedOfficer || iamSaving) ? 0.6 : 1,
              }}>
                {iamSaving ? 'Saving...' : '💾 Save IAM Policy'}
              </button>
            </div>

            {!selectedOfficer ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
                Select an officer above to view or override their granular permissions.
              </div>
            ) : allPerms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
                No permissions loaded from database.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
                {/* Group permissions by module */}
                {Array.from(new Set(allPerms.map(p => p.module))).map(mod => (
                  <div key={mod} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--border)', fontSize: 12, fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      📦 {mod}
                    </div>
                    <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {allPerms.filter(p => p.module === mod).map(p => {
                        const isGranted = overrides[p.permission_key] === true;
                        const isDenied = overrides[p.permission_key] === false;
                        const isDefault = overrides[p.permission_key] === undefined;
                        
                        return (
                          <div key={p.permission_key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.action}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{p.description}</div>
                            </div>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                              <button onClick={() => setOverrides(o => ({...o, [p.permission_key]: true}))} style={{ border: 'none', background: isGranted ? 'var(--success)' : 'transparent', color: isGranted ? '#fff' : 'var(--text-muted)', padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>ALLOW</button>
                              <button onClick={() => { const nx = {...overrides}; delete nx[p.permission_key]; setOverrides(nx); }} style={{ border: 'none', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: isDefault ? 'var(--primary)' : 'transparent', color: isDefault ? '#fff' : 'var(--text-muted)', padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>DEFAULT</button>
                              <button onClick={() => setOverrides(o => ({...o, [p.permission_key]: false}))} style={{ border: 'none', background: isDenied ? 'var(--error)' : 'transparent', color: isDenied ? '#fff' : 'var(--text-muted)', padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>DENY</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Audit Logs Tab ────────────────────────────────────── */}
        {tab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Filters</span>
              
              <input 
                type="text" 
                placeholder="Officer Badge or Name..." 
                value={logFilterOfficer}
                onChange={e => setLogFilterOfficer(e.target.value)}
                style={{ flex: 1, minWidth: 150, background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              />
              
              <select
                value={logFilterAction}
                onChange={e => setLogFilterAction(e.target.value)}
                style={{ width: 140, background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create_case">Create Case</option>
                <option value="view_case">View Case</option>
                <option value="generate_document">Gen. Document</option>
              </select>

              <input 
                type="text" 
                placeholder="Search case, docs..." 
                value={logFilterQuery}
                onChange={e => setLogFilterQuery(e.target.value)}
                style={{ flex: 2, minWidth: 200, background: 'var(--surface)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              />
            </div>

            {logsLoading ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
                Loading audit logs…
              </div>
            ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 14 }}>
              No audit logs found.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.map((l, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 14, alignItems: 'baseline',
                  padding: '12px 16px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: '3px solid var(--info)',
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {l.changed_at ? new Date(l.changed_at).toLocaleTimeString('en-IN') : '—'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                    {l.officer_name ? `${l.officer_name} (${l.badge_no})` : (l.officer_id ? String(l.officer_id).slice(0, 8) : 'SYSTEM')}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--tertiary)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    [{l.action}]
                  </span>
                  <span style={{ fontSize: 13, flex: 1 }}>{l.new_value || l.field_name || '—'}</span>
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
