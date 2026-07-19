import React, { useEffect, useState, useCallback } from 'react';
import PageShell, { EmptyState } from './PageShell';
import { patrol } from '../lib/api';

const STATUS_COLORS = {
  available: 'var(--success)',
  deployed: 'var(--info)',
  responding: 'var(--tertiary)',
  offline: 'var(--error)',
};

const MOCK_UNITS = [
  { unit_no: 'PU-101', officer_name: 'Const. Rathod', vehicle: 'GJ-01-PA-1101', status: 'available', location: 'Ellisbridge' },
  { unit_no: 'PU-102', officer_name: 'Const. Joshi', vehicle: 'GJ-01-PA-1102', status: 'deployed', location: 'Navrangpura' },
  { unit_no: 'PU-103', officer_name: 'HC Solanki', vehicle: 'GJ-01-PA-1103', status: 'responding', location: 'Maninagar' },
  { unit_no: 'PU-104', officer_name: 'Const. Parmar', vehicle: 'GJ-01-PA-1104', status: 'available', location: 'Satellite' },
  { unit_no: 'PU-105', officer_name: 'HC Chauhan', vehicle: 'GJ-01-PA-1105', status: 'offline', location: 'Vastrapur' },
];

export default function PatrolPage() {
  const [units, setUnits] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await patrol.list();
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setUnits(data.length ? data : MOCK_UNITS);
    } catch {
      setUnits(MOCK_UNITS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <PageShell title="Patrol Units" onRefresh={load}>
      {units.length === 0 ? (
        <EmptyState icon="🚔" text="No patrol units available" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {units.map((u, i) => {
            const status = String(u.status || 'available').toLowerCase();
            const color = STATUS_COLORS[status] || 'var(--secondary)';
            return (
              <div key={u.unit_no || i} className="glass fade-in-up" style={{ padding: 20, animationDelay: `${i * 0.04}s`, borderTop: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontFamily: 'var(--font-headline)', fontWeight: 700, fontSize: 17 }}>
                    🚔 {u.unit_no || u.unit_number || `Unit ${i + 1}`}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      width: 9, height: 9, borderRadius: '50%', background: color,
                      animation: status !== 'offline' ? 'pulse 2s infinite' : 'none',
                    }} />
                    <span style={{ color, fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                      {status}
                    </span>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                  <div>
                    <div className="label" style={{ fontSize: 10, marginBottom: 3 }}>Officer</div>
                    <span style={{ color: 'var(--text)' }}>{u.officer_name || u.officer || '—'}</span>
                  </div>
                  <div>
                    <div className="label" style={{ fontSize: 10, marginBottom: 3 }}>Vehicle</div>
                    <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{u.vehicle || u.vehicle_number || '—'}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="label" style={{ fontSize: 10, marginBottom: 3 }}>Location</div>
                    <span style={{ color: 'var(--text)' }}>📍 {u.location || u.current_location || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
