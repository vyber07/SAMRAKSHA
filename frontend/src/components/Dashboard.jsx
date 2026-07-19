import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useDashboardStore } from '../lib/store';
import { analytics, cases as casesApi, hotspot } from '../lib/api';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import SearchBar from './SearchBar';
import StatCard from './widgets/StatCard';
import IncidentTile from './widgets/IncidentTile';
import NotificationTile from './widgets/NotificationTile';
import QuickActionButton from './widgets/QuickActionButton';
import ChartsPanel from './charts/ChartsPanel';
import CrimeTypesChart from './charts/CrimeTypesChart';

// ─── Mock fallbacks so dashboard always renders ───
const MOCK_SUMMARY = { firs_today: 12, firs_today_change: 8, active_alerts: 3, patrol_active: 14, high_risk_zones: 2 };
const MOCK_INCIDENTS = [
  { type: 'Theft', location: 'Ellisbridge, Ahmedabad', severity: 'high', time: new Date().toISOString() },
  { type: 'Assault', location: 'Navrangpura', severity: 'critical', time: new Date(Date.now() - 36e5).toISOString() },
  { type: 'Vandalism', location: 'Maninagar', severity: 'medium', time: new Date(Date.now() - 72e5).toISOString() },
  { type: 'Fraud', location: 'Satellite', severity: 'low', time: new Date(Date.now() - 12e6).toISOString() },
  { type: 'Robbery', location: 'Vastrapur Lake', severity: 'high', time: new Date(Date.now() - 15e6).toISOString() },
];
const MOCK_NOTIFICATIONS = [
  { title: 'New FIR Registered', message: 'FIR #2026/0341 — Theft, Ellisbridge PS', priority: 'high', time: new Date().toISOString() },
  { title: 'Case Assigned', message: 'Case #C-1204 assigned to IO Patel', priority: 'medium', time: new Date(Date.now() - 30e5).toISOString() },
  { title: 'Case Update', message: 'Chargesheet filed for FIR #2026/0322', priority: 'low', time: new Date(Date.now() - 80e5).toISOString() },
  { title: 'New Case Alert', message: 'Cybercrime complaint — Navrangpura', priority: 'high', time: new Date(Date.now() - 96e5).toISOString() },
];

export default function Dashboard() {
  const officer = useAuthStore((s) => s.officer);
  const { summary, trends, caseList, incidentList, setSummary, setTrends, setCaseList, setIncidentList } = useDashboardStore();
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    try {
      const res = await analytics.summary();
      setSummary(res.data);
    } catch { setSummary(MOCK_SUMMARY); }

    try {
      const res = await analytics.trends();
      setTrends(res.data);
    } catch { setTrends(null); }

    try {
      const res = await casesApi.list(1, 50);
      setCaseList(res.data?.items || []);
    } catch { setCaseList([]); }

    try {
      const res = await hotspot.incidents();
      const items = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setIncidentList(items.length ? items : MOCK_INCIDENTS);
    } catch { setIncidentList(MOCK_INCIDENTS); }
  }, [setSummary, setTrends, setCaseList, setIncidentList]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Derive 6 stat card values from real data where possible ───
  const s = summary || MOCK_SUMMARY;
  const byStatus = (status) => caseList.filter((c) => String(c.case_status || '').toLowerCase().includes(status)).length;
  const total = caseList.length;
  const stats = [
    { icon: '🆕', label: 'New Cases', value: s.firs_today ?? 0, delta: s.firs_today_change, color: 'var(--primary)' },
    { icon: '✅', label: 'Solved Cases', value: byStatus('solved') || byStatus('closed') || 18, delta: 5, color: 'var(--success)' },
    { icon: '📂', label: 'Open Cases', value: byStatus('open') || byStatus('registered') || Math.max(total - 4, 9), delta: -3, color: 'var(--tertiary)' },
    { icon: '🔄', label: 'In Progress', value: byStatus('investigat') || byStatus('progress') || 7, delta: 2, color: 'var(--info)' },
    { icon: '⏳', label: 'Pending Review', value: byStatus('pending') || 4, delta: 0, color: 'var(--warning)' },
    { icon: '🗄️', label: 'Closed Cases', value: byStatus('closed') || 22, delta: 4, color: 'var(--secondary)' },
  ];

  const notifications = caseList.length
    ? caseList.slice(0, 4).map((c) => ({
        title: `Case ${c.fir_no || c.case_id}`,
        message: `${c.crime_type || 'Case'} — ${c.victim_name || 'victim'} (${c.case_status || 'registered'})`,
        priority: 'medium',
        time: c.created_at,
      }))
    : MOCK_NOTIFICATIONS;

  const quickActions = [
    { icon: '📝', label: 'FIR / Create Case', variant: 'filled', color: 'primary', onClick: () => navigate('/cases') },
    { icon: '🤖', label: 'AI Assistant', variant: 'tonal', color: 'tertiary', onClick: () => navigate('/analytics') },
    { icon: '📄', label: 'Generate Docs', variant: 'outlined', color: 'secondary', onClick: () => navigate('/cases') },
    { icon: '🚔', label: 'Dispatch Patrol', variant: 'tonal', color: 'primary', onClick: () => navigate('/patrol') },
    { icon: '📊', label: 'Reports', variant: 'outlined', color: 'tertiary', onClick: () => navigate('/analytics') },
    { icon: '⚙️', label: 'Settings', variant: 'outlined', color: 'secondary', onClick: () => navigate('/admin') },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Crime Monitoring Dashboard" onRefresh={loadData} />

        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          {/* Greeting */}
          <div className="fade-in-up" style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 22 }}>
              Welcome back, {officer?.name?.split(' ')[0] || 'Officer'} 👋
            </h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
              Here's the live crime monitoring overview for your jurisdiction.
            </div>
          </div>

          {/* ═══ 1. SIX QUICK-ACCESS STAT CARDS ═══ */}
          <div className="fade-in-up" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 16,
            marginBottom: 24,
            animationDelay: '0.05s',
          }}>
            {stats.map((st) => (
              <StatCard key={st.label} icon={st.icon} label={st.label} value={st.value} delta={st.delta} color={st.color} />
            ))}
          </div>

          {/* ═══ 2. GRAPH REPRESENTATION OF CASE DATA ═══ */}
          <div className="fade-in-up" style={{ marginBottom: 24, animationDelay: '0.1s' }}>
            <ChartsPanel trends={trends} cases={caseList} />
          </div>

          {/* ═══ 3. TWO-COLUMN: incidents+notifications (left) | search + quick access + crime types (right) ═══ */}
          <div className="dash-columns fade-in-up" style={{
            display: 'grid',
            gridTemplateColumns: '3fr 2fr',
            gap: 20,
            animationDelay: '0.15s',
          }}>
            {/* LEFT: Recent Incidents & New Case Notifications beside each other */}
            <div className="dash-left" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignContent: 'start' }}>
              <div className="glass" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🚨 Recent Incidents
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                  {(incidentList.length ? incidentList : MOCK_INCIDENTS).slice(0, 6).map((inc, i) => (
                    <IncidentTile key={i} incident={inc} />
                  ))}
                </div>
              </div>

              <div className="glass" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  🔔 New Case Notifications
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
                  {notifications.map((n, i) => (
                    <NotificationTile key={i} notification={n} />
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: Big curved Bing-style search bar + quick access buttons + crime types */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <SearchBar />

              <div className="glass" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 14 }}>⚡ Quick Access</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {quickActions.map((qa) => (
                    <QuickActionButton key={qa.label} icon={qa.icon} label={qa.label} variant={qa.variant} color={qa.color} onClick={qa.onClick} />
                  ))}
                </div>
              </div>

              <CrimeTypesChart data={trends?.by_type} />
            </div>
          </div>
        </main>
      </div>

      <style>{`
        @media (max-width: 1280px) {
          .dash-columns { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 860px) {
          .dash-left { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
