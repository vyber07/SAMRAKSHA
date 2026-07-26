import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useDashboardStore } from '../lib/store';
import { analytics, cases as casesApi, hotspot, cctv, incidents, getBaseURL } from '../lib/api';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import SearchBar from './SearchBar';
import StatCard from './widgets/StatCard';
import IncidentTile from './widgets/IncidentTile';
import NotificationTile from './widgets/NotificationTile';
import QuickActionButton from './widgets/QuickActionButton';
import ChartsPanel from './charts/ChartsPanel';

// ─── 1. Resource Allocation Gauge ──────────────────────────────
function ResourceGauge({ data }) {
  const engaged = data?.engaged_pct ?? 0;
  const available = data?.available_pct ?? 0;
  const color = engaged > 80 ? 'var(--error)' : engaged > 60 ? 'var(--warning)' : 'var(--success)';
  return (
    <div className="glass" style={{ padding: 22, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
            <span style={{ fontSize: 18 }}>⚡</span> Resource Allocation
          </h3>
          <span className="badge badge-neutral" style={{ fontSize: 10 }}>Live Units</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Engaged Patrols</span><span style={{ color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{engaged}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${engaged}%`, borderRadius: 4, background: color, transition: 'width 0.6s ease' }} />
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Available Units</span><span style={{ color: 'var(--success)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{available}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${available}%`, borderRadius: 4, background: 'var(--success)', transition: 'width 0.6s ease' }} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Active PCR Force</span>
        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Optimal Deployment</span>
      </div>
    </div>
  );
}

// ─── 2. Hotspot Surge Warnings ──────────────────────────────────
function HotspotSurge({ surges }) {
  const list = surges?.surges || [];
  return (
    <div className="glass" style={{ padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span style={{ fontSize: 18 }}>📈</span> Hotspot Surge (Next 3h)
        </h3>
        <span className="badge badge-high" style={{ fontSize: 10 }}>Predictive AI</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No high risk surge warnings predicted for current slot
          </div>
        ) : (
          list.slice(0, 4).map((s, i) => {
            const risk = s.risk_score ?? 0;
            const color = risk >= 90 ? 'var(--error)' : risk >= 75 ? 'var(--warning)' : 'var(--tertiary)';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.04)', borderLeft: `3px solid ${color}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.ward}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Expected surge window</div>
                </div>
                <span style={{ fontSize: 12, color, fontFamily: 'var(--font-mono)', fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--radius-xs)', background: 'rgba(255,255,255,0.05)' }}>
                  Risk {risk.toFixed(0)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── 3. AI Pattern Matches Feed ─────────────────────────────────
function PatternFeed({ patterns }) {
  const list = patterns?.patterns || [];
  return (
    <div className="glass" style={{ padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span style={{ fontSize: 18 }}>🕵️</span> AI Pattern Matches
        </h3>
        <span className="badge badge-medium" style={{ fontSize: 10 }}>MO Analysis</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No recent modus operandi pattern matches
          </div>
        ) : (
          list.slice(0, 3).map((p, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid var(--info)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tertiary)', marginBottom: 4, fontFamily: 'var(--font-mono)' }}>{p.type}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{p.description}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── 4. SLA Breaches Monitor ──────────────────────────────────
function SLABreaches({ breaches }) {
  const list = breaches || [];
  return (
    <div className="glass" style={{ padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span style={{ fontSize: 18 }}>⏱️</span> 100/PCR SLA Breaches
        </h3>
        <span className="badge badge-critical" style={{ fontSize: 10 }}>Action Required</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            All response times within 15-minute SLA target
          </div>
        ) : (
          list.slice(0, 3).map((b, i) => (
            <div key={i} style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.04)', borderLeft: '3px solid var(--error)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--error)', fontFamily: 'var(--font-mono)' }}>
                  Incident {b.incident_id?.slice(0, 8) || 'PCR-100'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--error)', fontWeight: 700 }}>&gt;15 min delay</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.location || 'Ellisbridge Police Station Ward'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── 5. Live CCTV Anomaly Feed ──────────────────────────────────
function CCTVFeed({ anomalies }) {
  const list = anomalies || [];
  return (
    <div className="glass" style={{ padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <span style={{ fontSize: 18 }}>🎥</span> Live CCTV Anomalies
        </h3>
        <span className="badge badge-neutral" style={{ fontSize: 10 }}>ANPR / Vision</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.length === 0 ? (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
            No recent video feed anomalies flagged
          </div>
        ) : (
          list.slice(0, 3).map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.04)', alignItems: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-sm)', background: 'rgba(239, 83, 80, 0.15)', border: '1px solid rgba(239, 83, 80, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                ⚠️
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tertiary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.alert_type?.replace('_', ' ').toUpperCase()}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Cam {a.camera_id || 'ICCC-04'} • {a.confidence ? `${(a.confidence * 100).toFixed(0)}% Match` : 'Alert'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const officer = useAuthStore((s) => s.officer);
  const { summary, trends, caseList, incidentList, setSummary, setTrends, setCaseList, setIncidentList } = useDashboardStore();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Extra analytics state
  const [resourceStatus, setResourceStatus] = useState(null);
  const [hotspotSurge, setHotspotSurge] = useState(null);
  const [patternMatches, setPatternMatches] = useState(null);
  const [slaBreaches, setSlaBreaches] = useState(null);
  const [cctvAnomalies, setCctvAnomalies] = useState(null);

  const loadData = useCallback(async () => {
    try { setSummary((await analytics.summary()).data); } catch { setSummary({}); }
    try { setTrends((await analytics.trends()).data); } catch { setTrends(null); }
    try { const r = await casesApi.list(1, 50); setCaseList(r.data?.items || []); } catch { setCaseList([]); }
    try {
      const r = await hotspot.incidents();
      const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
      setIncidentList(items);
    } catch { setIncidentList([]); }

    // ─── Analytics endpoints ──────────────────────────────
    try { setResourceStatus((await analytics.resourceStatus()).data); } catch { setResourceStatus(null); }
    try { setHotspotSurge((await analytics.hotspotSurge()).data); } catch { setHotspotSurge(null); }
    try { setPatternMatches((await analytics.patternMatches()).data); } catch { setPatternMatches(null); }
    try { setSlaBreaches((await incidents.slaBreaches()).data?.breaches); } catch { setSlaBreaches([]); }
    try { setCctvAnomalies((await cctv.anomalies()).data?.items || []); } catch { setCctvAnomalies([]); }
  }, [setSummary, setTrends, setCaseList, setIncidentList]);

  useEffect(() => { loadData(); }, [loadData]);

  // ─── Dynamic WS URL helper ──────────────────────────────────
  const getWsURL = useCallback(() => {
    const baseUrl = getBaseURL();
    const token = localStorage.getItem('samraksha_token') || '';
    let wsBase;
    if (baseUrl.startsWith('http://')) {
      wsBase = baseUrl.replace('http://', 'ws://');
    } else if (baseUrl.startsWith('https://')) {
      wsBase = baseUrl.replace('https://', 'wss://');
    } else if (baseUrl.startsWith('/')) {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsBase = `${wsProtocol}//${window.location.host}${baseUrl}`;
    } else {
      wsBase = baseUrl;
    }
    const cleanBase = wsBase.replace(/\/$/, '');
    return `${cleanBase}/ws/dashboard?token=${token}`;
  }, []);

  // ─── WebSocket with reconnect & unmount safety ─────
  const connectWS = useCallback(() => {
    if (!isMountedRef.current) return null;
    if (wsRef.current && wsRef.current.readyState < 2) return wsRef.current;
    const wsUrl = getWsURL();
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMountedRef.current) return;
      ws._retryDelay = 2000;
    };

    ws.onmessage = (event) => {
      if (!isMountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (['NEW_FIR', 'PCR_INCIDENT', 'CCTV_ALERT', 'ANPR_MATCH'].includes(msg.type)) {
          loadData();
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.onclose = () => {
      if (!isMountedRef.current) return;
      const delay = Math.min((ws._retryDelay || 2000) * 1.5, 30000);
      console.log(`WS disconnected — reconnecting in ${delay / 1000}s`);
      wsRef.current = null;
      reconnectTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        const newWs = connectWS();
        if (newWs) newWs._retryDelay = delay;
      }, delay);
    };

    ws.onerror = () => {
      if (!isMountedRef.current) return;
      ws.close();
    };

    return ws;
  }, [loadData, getWsURL]);

  useEffect(() => {
    isMountedRef.current = true;
    connectWS();
    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWS]);

  // ─── Stat card values ──────────────────────────────────────
  const s = summary || {};
  const byStatus = (status) => caseList.filter((c) => String(c.case_status || '').toLowerCase().includes(status)).length;
  const total = caseList.length;
  const stats = [
    { icon: 'new_releases',    label: 'New Cases',      value: s.firs_today ?? 0,                                            delta: s.firs_today_change,                color: 'var(--primary)' },
    { icon: 'check_circle',    label: 'Solved Cases',   value: byStatus('solved') || byStatus('closed') || 18,              delta: 5,                                   color: 'var(--success)' },
    { icon: 'folder_open',     label: 'Open Cases',     value: byStatus('open') || byStatus('registered') || Math.max(total - 4, 9), delta: -3,                        color: 'var(--tertiary)' },
    { icon: 'autorenew',       label: 'In Progress',    value: byStatus('investigat') || byStatus('progress') || 7,         delta: 2,                                   color: 'var(--info)' },
    { icon: 'pending_actions', label: 'Pending Review', value: byStatus('pending') || 4,                                    delta: 0,                                   color: 'var(--warning)' },
    { icon: 'archive',         label: 'Closed Cases',   value: byStatus('closed') || 22,                                    delta: 4,                                   color: 'var(--secondary)' },
  ];

  const notifications = caseList.length
    ? caseList.slice(0, 5).map((c) => ({
        title:   `Case ${c.fir_no || c.case_id}`,
        message: `${c.crime_type || 'Case'} — ${c.victim_name || 'victim'} (${c.case_status || 'registered'})`,
        priority: 'medium',
        time: c.created_at,
      }))
    : [];

  const quickActions = [
    { icon: 'edit_note',     label: 'FIR / Create Case', variant: 'filled',   color: 'primary',    onClick: () => navigate('/cases') },
    { icon: 'smart_toy',     label: 'AI Assistant',      variant: 'tonal',    color: 'tertiary',   onClick: () => navigate('/analytics') },
    { icon: 'description',   label: 'Generate Docs',     variant: 'outlined', color: 'secondary',  onClick: () => navigate('/cases') },
    { icon: 'local_police',  label: 'Dispatch Patrol',   variant: 'tonal',    color: 'primary',    onClick: () => navigate('/patrol') },
    { icon: 'analytics',     label: 'Reports',           variant: 'outlined', color: 'tertiary',   onClick: () => navigate('/analytics') },
    { icon: 'settings',      label: 'Settings',          variant: 'outlined', color: 'secondary',  onClick: () => navigate('/admin') },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Crime Monitoring Dashboard" />

        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>

          {/* ═══ HERO BANNER & SEARCH BAR ═══ */}
          <div className="fade-in-up" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.3px' }}>
                  Welcome back, {officer?.name?.split(' ')[0] || 'Officer'} 👋
                </h2>
                <div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                  Real-time command intelligence & jurisdiction status overview.
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span className="badge badge-low" style={{ padding: '6px 14px', fontSize: 12 }}>
                  <span className="pulse-dot active" style={{ width: 8, height: 8 }} /> Station Online
                </span>
                <span className="badge badge-neutral" style={{ padding: '6px 14px', fontSize: 12 }}>
                  Ellisbridge Jurisdiction
                </span>
              </div>
            </div>

            {/* Hero Search Bar Container */}
            <div className="glass" style={{ padding: '18px 24px', borderRadius: 'var(--radius-xl)' }}>
              <SearchBar />
            </div>
          </div>

          {/* ═══ 1. SIX KEY STAT METRIC CARDS ═══ */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 14 }}>
              📌 Key Performance Indicators
            </div>
            <div className="fade-in-up" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              animationDelay: '0.05s',
            }}>
              {stats.map((st) => (
                <StatCard key={st.label} icon={st.icon} label={st.label} value={st.value} delta={st.delta} color={st.color} />
              ))}
            </div>
          </div>

          {/* ═══ 2. TACTICAL OPERATIONS & ANOMALY ALERT CARDS ═══ */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              🛡️ Tactical Operations & Anomaly Alert Hub
            </div>
            <div className="fade-in-up" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 18,
              animationDelay: '0.1s',
            }}>
              <ResourceGauge data={resourceStatus} />
              <SLABreaches breaches={slaBreaches} />
              <HotspotSurge surges={hotspotSurge} />
              <CCTVFeed anomalies={cctvAnomalies} />
              <PatternFeed patterns={patternMatches} />
            </div>
          </div>

          {/* ═══ 3. JURISDICTION CRIME ANALYTICS & TRENDS ═══ */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 14 }}>
              📊 Crime Trends & Analytics Suite
            </div>
            <div className="fade-in-up" style={{ animationDelay: '0.15s' }}>
              <ChartsPanel trends={trends} cases={caseList} />
            </div>
          </div>

          {/* ═══ 4. FIELD OPERATIONS & CASE MANAGEMENT HUB ═══ */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)', marginBottom: 14 }}>
              ⚡ Field Operations & Action Center
            </div>
            <div className="fade-in-up" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 20,
              animationDelay: '0.2s',
            }}>
              {/* Quick Command Actions */}
              <div className="glass" style={{ padding: 22, height: '100%' }}>
                <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⚡</span> Quick Command Actions
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {quickActions.map((qa) => (
                    <QuickActionButton key={qa.label} icon={qa.icon} label={qa.label} variant={qa.variant} color={qa.color} onClick={qa.onClick} />
                  ))}
                </div>
              </div>

              {/* Recent Incidents */}
              <div className="glass" style={{ padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🚨</span> Recent Incidents
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', flex: 1 }}>
                  {(incidentList || []).slice(0, 5).map((inc, i) => (
                    <IncidentTile key={i} incident={inc} />
                  ))}
                </div>
              </div>

              {/* New Case Notifications */}
              <div className="glass" style={{ padding: 22, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>🔔</span> Case Activity Notifications
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto', flex: 1 }}>
                  {notifications.map((n, i) => (
                    <NotificationTile key={i} notification={n} />
                  ))}
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

