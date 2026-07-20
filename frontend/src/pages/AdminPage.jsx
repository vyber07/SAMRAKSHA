import React, { useEffect, useState } from 'react';
import PageShell from './PageShell';
import { admin } from '../lib/api';

const TABS = [
  { id: 'users', icon: '👥', label: 'Users' },
  { id: 'roles', icon: '🔐', label: 'Roles' },
  { id: 'logs', icon: '📋', label: 'Logs' },
];

const MOCK_OFFICERS = [
  { badge_no: 'admin', name: 'Admin Officer', role: 'admin', is_active: true },
  { badge_no: 'sho001', name: 'SHO Sharma', role: 'sho', is_active: true },
  { badge_no: 'io001', name: 'IO Patel', role: 'io', is_active: true },
  { badge_no: 'dcp001', name: 'DCP Singh', role: 'dcp', is_active: true },
];

const ROLE_MATRIX = [
  { feature: 'View Cases', admin: true, sho: true, dcp: true, io: true, constable: false },
  { feature: 'Create FIR', admin: true, sho: true, dcp: false, io: true, constable: false },
  { feature: 'Analytics', admin: true, sho: true, dcp: true, io: false, constable: false },
  { feature: 'Patrol Dispatch', admin: true, sho: true, dcp: false, io: false, constable: false },
  { feature: 'CCTV View', admin: true, sho: true, dcp: false, io: false, constable: false },
  { feature: 'Admin Panel', admin: true, sho: false, dcp: false, io: false, constable: false },
];

const MOCK_LOGS = [
  { time: '10:42', actor: 'admin', action: 'Granted analytics_view override to io001' },
  { time: '09:57', actor: 'sho001', action: 'Created chargesheet for FIR 2026/0322' },
  { time: '09:12', actor: 'io001', action: 'Created FIR 2026/0341 (Theft)' },
  { time: '08:30', actor: 'system', action: 'Nightly risk-score recompute completed' },
];

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [officers, setOfficers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await admin.officers();
        const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
        setOfficers(data.length ? data : MOCK_OFFICERS);
      } catch {
        setOfficers(MOCK_OFFICERS);
      }
    })();
  }, []);

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
        {tab === 'users' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr><th style={th}>Badge</th><th style={th}>Name</th><th style={th}>Role</th><th style={th}>Status</th></tr></thead>
            <tbody>
              {officers.map((o, i) => (
                <tr key={o.badge_no || i}>
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

        {tab === 'roles' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={th}>Feature</th>
              {['Admin', 'SHO', 'DCP', 'IO', 'Constable'].map((r) => <th key={r} style={{ ...th, textAlign: 'center' }}>{r}</th>)}
            </tr></thead>
            <tbody>
              {ROLE_MATRIX.map((row) => (
                <tr key={row.feature}>
                  <td style={{ ...td, fontWeight: 600 }}>{row.feature}</td>
                  {['admin', 'sho', 'dcp', 'io', 'constable'].map((r) => (
                    <td key={r} style={{ ...td, textAlign: 'center' }}>{row[r] ? '✅' : '—'}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'logs' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {MOCK_LOGS.map((l, i) => (
              <div key={i} style={{
                display: 'flex', gap: 14, alignItems: 'baseline',
                padding: '12px 16px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: '3px solid var(--info)',
              }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{l.time}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--primary)' }}>{l.actor}</span>
                <span style={{ fontSize: 13 }}>{l.action}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
