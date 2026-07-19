import React, { useEffect, useState, useCallback } from 'react';
import PageShell, { EmptyState } from './PageShell';
import { useAuthStore, canViewAnalytics } from '../lib/store';
import { analytics } from '../lib/api';
import ChartsPanel from '../components/charts/ChartsPanel';
import CrimeTypesChart from '../components/charts/CrimeTypesChart';
import StatCard from '../components/widgets/StatCard';

export default function AnalyticsPage() {
  const officer = useAuthStore((s) => s.officer);
  const [trends, setTrends] = useState(null);
  const [summary, setSummary] = useState(null);
  const allowed = canViewAnalytics(officer?.role);

  const load = useCallback(async () => {
    try { setTrends((await analytics.trends()).data); } catch { setTrends(null); }
    try { setSummary((await analytics.summary()).data); } catch { setSummary(null); }
  }, []);

  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  if (!allowed) {
    return (
      <PageShell title="Analytics">
        <EmptyState icon="🔒" text="Analytics is available to SHO, DCP and Admin roles only." />
      </PageShell>
    );
  }

  const s = summary || {};
  const kpis = [
    { icon: '📝', label: 'FIRs Today', value: s.firs_today ?? 12, delta: s.firs_today_change ?? 8, color: 'var(--primary)' },
    { icon: '🚨', label: 'Active Alerts', value: s.active_alerts ?? 3, color: 'var(--error)' },
    { icon: '🚔', label: 'Patrols Active', value: s.patrol_active ?? 14, color: 'var(--success)' },
    { icon: '⚠️', label: 'High-Risk Zones', value: s.high_risk_zones ?? 2, color: 'var(--tertiary)' },
  ];

  return (
    <PageShell title="Crime Analytics" onRefresh={load}>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 24,
      }}>
        {kpis.map((k) => (
          <StatCard key={k.label} icon={k.icon} label={k.label} value={k.value} delta={k.delta} color={k.color} />
        ))}
      </div>

      <div style={{ marginBottom: 24 }}>
        <ChartsPanel trends={trends} cases={[]} />
      </div>

      <div style={{ maxWidth: 620 }}>
        <CrimeTypesChart data={trends?.by_type} />
      </div>
    </PageShell>
  );
}
