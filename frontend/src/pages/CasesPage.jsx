import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell, { EmptyState, StatusBadge } from './PageShell';
import { cases as casesApi } from '../lib/api';

const MOCK_CASES = [
  { case_id: 'C-1201', fir_no: '2026/0341', victim_name: 'R. Shah', accused_name: 'Unknown', crime_type: 'Theft', case_status: 'open', created_at: new Date().toISOString() },
  { case_id: 'C-1202', fir_no: '2026/0342', victim_name: 'M. Desai', accused_name: 'K. Yadav', crime_type: 'Assault', case_status: 'investigating', created_at: new Date(Date.now() - 864e5).toISOString() },
  { case_id: 'C-1203', fir_no: '2026/0338', victim_name: 'P. Mehta', accused_name: 'Unknown', crime_type: 'Fraud', case_status: 'solved', created_at: new Date(Date.now() - 2 * 864e5).toISOString() },
  { case_id: 'C-1204', fir_no: '2026/0335', victim_name: 'A. Trivedi', accused_name: 'S. Rana', crime_type: 'Robbery', case_status: 'pending', created_at: new Date(Date.now() - 3 * 864e5).toISOString() },
];

const FILTERS = ['All', 'Open', 'Investigating', 'Pending', 'Solved', 'Closed'];

export default function CasesPage() {
  const [items, setItems] = useState([]);
  const [forbidden, setForbidden] = useState(false);
  const [filter, setFilter] = useState('All');
  const [params] = useSearchParams();
  const q = (params.get('q') || '').toLowerCase();

  const load = useCallback(async () => {
    try {
      const res = await casesApi.list(1, 100);
      setItems(res.data?.items?.length ? res.data.items : MOCK_CASES);
      setForbidden(false);
    } catch (err) {
      if (err.response?.status === 403) setForbidden(true);
      else setItems(MOCK_CASES);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = items.filter((c) => {
    const matchesFilter = filter === 'All' || String(c.case_status || '').toLowerCase().includes(filter.toLowerCase());
    const matchesQ = !q || JSON.stringify(c).toLowerCase().includes(q);
    return matchesFilter && matchesQ;
  });

  return (
    <PageShell title="Case Management" onRefresh={load}>
      {forbidden ? (
        <EmptyState icon="🔒" text="Your role does not have permission to view cases. Contact your SHO." />
      ) : (
        <>
          {q && <div style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 13 }}>Search results for “{q}”</div>}

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 16px',
                borderRadius: 'var(--radius-xl)',
                border: `1px solid ${filter === f ? 'var(--primary)' : 'var(--border)'}`,
                background: filter === f ? 'var(--primary)' : 'var(--surface)',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)',
                cursor: 'pointer', transition: 'all var(--t-fast) var(--ease)',
              }}>{f}</button>
            ))}
          </div>

          {visible.length === 0 ? (
            <EmptyState icon="📁" text="No cases match your filters" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {visible.map((c, i) => (
                <div key={c.case_id || i} className="glass fade-in-up" style={{ padding: 20, animationDelay: `${i * 0.04}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
                      FIR {c.fir_no || c.case_id}
                    </span>
                    <StatusBadge status={c.case_status} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-headline)', marginBottom: 10 }}>
                    {c.crime_type || 'Case'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'grid', gap: 5 }}>
                    <div>👤 Victim: <span style={{ color: 'var(--text)' }}>{c.victim_name || '—'}</span></div>
                    <div>🎯 Accused: <span style={{ color: 'var(--text)' }}>{c.accused_name || 'Unknown'}</span></div>
                    <div>📅 {c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN') : '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
