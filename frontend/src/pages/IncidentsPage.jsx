import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell, { EmptyState } from './PageShell';
import IncidentTile from '../components/widgets/IncidentTile';
import { hotspot } from '../lib/api';

const MOCK_INCIDENTS = [
  { type: 'Theft', location: 'Ellisbridge', severity: 'high', time: new Date().toISOString() },
  { type: 'Assault', location: 'Navrangpura', severity: 'critical', time: new Date(Date.now() - 36e5).toISOString() },
  { type: 'Vandalism', location: 'Maninagar', severity: 'medium', time: new Date(Date.now() - 72e5).toISOString() },
  { type: 'Fraud', location: 'Satellite', severity: 'low', time: new Date(Date.now() - 12e6).toISOString() },
  { type: 'Robbery', location: 'Vastrapur', severity: 'high', time: new Date(Date.now() - 15e6).toISOString() },
  { type: 'Cybercrime', location: 'Bodakdev', severity: 'medium', time: new Date(Date.now() - 20e6).toISOString() },
];

const SEVERITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

export default function IncidentsPage() {
  const [items, setItems] = useState([]);
  const [severity, setSeverity] = useState('All');
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();

  const load = useCallback(async () => {
    try {
      const res = await hotspot.incidents();
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setItems(data.length ? data : MOCK_INCIDENTS);
    } catch {
      setItems(MOCK_INCIDENTS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = items.filter((inc) => {
    const sev = String(inc.severity || '').toLowerCase();
    const matchesSev = severity === 'All' || sev === severity.toLowerCase();
    const matchesQ = !q || JSON.stringify(inc).toLowerCase().includes(q);
    return matchesSev && matchesQ;
  });

  return (
    <PageShell title="Incident Tracking" onRefresh={load}>
      {q && <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 13 }}>Search results for “{q}”</div>}

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {SEVERITIES.map((s) => (
          <button key={s} onClick={() => setSeverity(s)} style={{
            padding: '7px 16px',
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${severity === s ? 'var(--tertiary)' : 'var(--border)'}`,
            background: severity === s ? 'var(--tertiary)' : 'var(--surface)',
            color: severity === s ? '#fff' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
            cursor: 'pointer', transition: 'all var(--t-fast) var(--ease)',
          }}>{s}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState icon="✅" text="No incidents — all systems operational" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
          {visible.map((inc, i) => (
            <div key={i} className="fade-in-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <IncidentTile incident={inc} />
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
