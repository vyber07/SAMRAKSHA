import { useMemo } from 'react';
import CaseTrendsChart from './CaseTrendsChart';
import CasesByTypeChart from './CasesByTypeChart';
import StatusDistributionChart from './StatusDistributionChart';

// Map raw analytics/trends + cases props into the shapes each child expects,
// always falling back to undefined so children render their own mocks.

function mapTrends(trends) {
  // Backend trends.weekly: [{day,count}] or trends.daily/hourly. Prefer weekly.
  const weekly = trends?.weekly;
  if (Array.isArray(weekly) && weekly.length) {
    return weekly.slice(0, 7).map((d) => ({ date: d.day ?? d.date ?? '', count: +d.count || 0 }));
  }
  return undefined;
}

function mapByType(trends, cases) {
  // Prefer analytics trends.by_type: [{type,count}].
  const byType = trends?.by_type;
  if (Array.isArray(byType) && byType.length) {
    return byType.map((d) => ({ type: d.type ?? '—', count: +d.count || 0 }));
  }
  // Fallback: derive from a case list by crime_type.
  if (Array.isArray(cases) && cases.length) {
    const counts = {};
    cases.forEach((c) => {
      const t = c?.crime_type ?? 'Other';
      counts[t] = (counts[t] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }
  return undefined;
}

function mapStatus(cases) {
  // Derive status distribution from a case list by case_status.
  if (Array.isArray(cases) && cases.length) {
    const norm = {
      open: 'Open',
      in_progress: 'In Progress',
      'in progress': 'In Progress',
      solved: 'Solved',
      closed: 'Closed',
    };
    const counts = {};
    cases.forEach((c) => {
      const raw = String(c?.case_status ?? 'Open').toLowerCase();
      const label = norm[raw] ?? (c?.case_status ?? 'Open');
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  }
  return undefined;
}

export default function ChartsPanel({ trends, cases }) {
  const caseList = Array.isArray(cases) ? cases : cases?.items;

  const trendData = useMemo(() => mapTrends(trends), [trends]);
  const byTypeData = useMemo(() => mapByType(trends, caseList), [trends, caseList]);
  const statusData = useMemo(() => mapStatus(caseList), [caseList]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      <CaseTrendsChart data={trendData} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 460px), 1fr))',
          gap: 20,
        }}
      >
        <CasesByTypeChart data={byTypeData} />
        <StatusDistributionChart data={statusData} />
      </div>
    </div>
  );
}
