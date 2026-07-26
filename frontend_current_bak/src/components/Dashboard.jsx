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
import CrimeTypesChart from './charts/CrimeTypesChart';

export default function Dashboard() {
  const officer = useAuthStore((s) => s.officer);
  const { summary, trends, caseList, incidentList, setSummary, setTrends, setCaseList, setIncidentList } = useDashboardStore();
  const navigate = useNavigate();
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  const [wsMessages, setWsMessages] = useState([]);
  const [resourceStatus, setResourceStatus] = useState(null);
  const [hotspotSurge, setHotspotSurge] = useState(null);
  const [patternMatches, setPatternMatches] = useState(null);
  const [slaBreaches, setSlaBreaches] = useState(null);
  const [cctvAnomalies, setCctvAnomalies] = useState(null);

  const [simLoading, setSimLoading] = useState(false);
  const handleSimulate = async () => {
    setSimLoading(true);
    try {
      await analytics.simulate('Festival', 10000);
      alert('AI Festival Simulation started successfully!');
    } catch (e) {
      alert('Simulation failed');
    } finally {
      setSimLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    try { setSummary((await analytics.summary()).data); } catch { setSummary({}); }
    try { setTrends((await analytics.trends()).data); } catch { setTrends(null); }
    try { const r = await casesApi.list(1, 50); setCaseList(r.data?.items || []); } catch { setCaseList([]); }
    try {
      const r = await hotspot.incidents();
      const items = Array.isArray(r.data) ? r.data : r.data?.items || [];
      setIncidentList(items);
    } catch { setIncidentList([]); }

    try { setResourceStatus((await analytics.resourceStatus()).data); } catch { setResourceStatus(null); }
    try { setHotspotSurge((await analytics.hotspotSurge()).data); }    catch { setHotspotSurge(null); }
    try { setPatternMatches((await analytics.patternMatches()).data); } catch { setPatternMatches(null); }
    try { setSlaBreaches((await incidents.slaBreaches()).data?.breaches); } catch { setSlaBreaches([]); }
    try { setCctvAnomalies((await cctv.anomalies()).data?.items || []); } catch { setCctvAnomalies([]); }
  }, [setSummary, setTrends, setCaseList, setIncidentList]);

  useEffect(() => { loadData(); }, [loadData]);

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
        setWsMessages(prev => [{...msg, ts: new Date().toISOString()}, ...prev].slice(0, 50));
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

  const s = summary || {};
  const byStatus = (status) => caseList.filter((c) => String(c.case_status || '').toLowerCase().includes(status)).length;
  const total = caseList.length;
  
  const stats = [
    { icon: 'new_releases',   label: 'New Cases',      value: s.firs_today ?? 0, delta: s.firs_today_change, color: 'var(--primary)' },
    { icon: 'autorenew',      label: 'Active Cases',   value: byStatus('investigat') || byStatus('progress') || 7, delta: 2, color: 'var(--success)' },
    { icon: 'memory',         label: 'Predictive Score', value: '84/100', delta: 3, color: 'var(--tertiary)' },
    { icon: 'warning',        label: 'High Risk Zone', value: 4, delta: 0, color: 'var(--error)' },
    { icon: 'folder_open',    label: 'Open Cases',     value: byStatus('open') || byStatus('registered') || Math.max(total - 4, 9), delta: -3, color: 'var(--warning)' },
    { icon: 'archive',        label: 'Closed Cases',   value: byStatus('closed') || 22, delta: 4, color: 'var(--success)' },
  ];

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff/60)}h ago`;
  };

  const WS_COLOR = {
    NEW_FIR: "var(--info)",
    CCTV_ALERT: "var(--error)",
    SYSTEM_UPDATE: "var(--tertiary)",
    ANPR_MATCH: "var(--warning)",
    PCR_INCIDENT: "var(--primary)"
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <TopBar title="Command Center" subtitle="Real-time overview — Ahmedabad City Police" />

        <main style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 22, fontFamily: 'var(--font-headline)' }}>
              Command Center
            </h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Real-time overview — Ahmedabad City Police
            </div>
          </div>

          {/* Row 1: Stat Cards */}
          <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
            {stats.map((st) => (
              <StatCard key={st.label} icon={st.icon} label={st.label} value={st.value} delta={st.delta} color={st.color} />
            ))}
          </div>

          {/* Row 2: Recent Notifications & Quick Actions */}
          <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginBottom: 24 }}>
            
            {/* Recent Notifications */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '280px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', flex: 1 }}>Recent Notifications</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{wsMessages.length} received</span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {wsMessages.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>No notifications yet.</div>
                ) : (
                  wsMessages.slice(0, 8).map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '12px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: WS_COLOR[m.type] || 'var(--primary)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '12px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.payload || JSON.stringify(m)}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>{timeAgo(m.ts)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '280px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', flex: 1 }}>Quick Actions</span>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--success)', padding: '2px 10px', backgroundColor: 'var(--success-container)', borderRadius: '12px' }}>Shortcuts</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: '12px', flex: 1, marginTop: '12px' }}>
                {[
                  { icon: 'add_circle', label: 'New FIR', path: '/fir-entry' },
                  { icon: 'local_police', label: 'Patrol Units', path: '/patrol' },
                  { icon: 'smart_toy', label: 'AI Assistant', path: '/assistant' },
                  { icon: 'description', label: 'Documents', path: '/documents' },
                ].map((action, i) => (
                  <button key={i} onClick={() => navigate(action.path)} className="btn-glass" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer' }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '30px', color: 'var(--primary)' }}>{action.icon}</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Row 3: Charts Panel */}
          <div className="fade-in-up" style={{ marginBottom: 24 }}>
            <ChartsPanel trends={trends} cases={caseList} />
          </div>

          {/* Row 4: Camera Alerts Panel & Live Events */}
          <div className="fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 16, marginBottom: 24 }}>
            
            {/* Live Events Feed */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '380px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', flex: 1 }}>Live Events Feed</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block', animation: 'pulse 2s infinite' }} /> WebSocket Live
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {wsMessages.length === 0 ? (
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '48px 0' }}>Awaiting events...</div>
                ) : (
                  wsMessages.slice(0, 10).map((m, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '10px', borderRadius: '12px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: WS_COLOR[m.type] || 'var(--primary)', flexShrink: 0, marginTop: '6px' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500, margin: 0 }}>{m.payload || JSON.stringify(m)}</p>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{timeAgo(m.ts)} · {m.type}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Camera Alerts Panel */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '380px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--error)' }}>videocam</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>Camera Alerts</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, backgroundColor: 'var(--error-container)', color: 'var(--error)', padding: '2px 6px', borderRadius: '4px' }}>● LIVE</span>
                </div>
                <button onClick={() => navigate('/cctv')} style={{ background: 'transparent', border: 'none', color: 'var(--info)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>View all</button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(cctvAnomalies && cctvAnomalies.length > 0) ? cctvAnomalies.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)', borderLeft: '4px solid var(--error)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>CAM-{a.camera_id || 'XX'}</div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{a.alert_type?.replace('_', ' ').toUpperCase()}</div>
                    </div>
                    <button onClick={() => navigate('/cctv')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>open_in_new</span>
                    </button>
                  </div>
                )) : (
                  [
                    { cam: "CAM-04 · CG Road Junction", msg: "Suspicious loitering detected", meta: "SESSION/2026/041 · 8m ago", sev: "var(--error)" },
                    { cam: "CAM-11 · Railway Station Gate 2", msg: "Unattended object flagged", meta: "SESSION/2026/039 · 20m ago", sev: "var(--warning)" },
                    { cam: "CAM-07 · Maninagar Circle", msg: "Crowd anomaly — density spike", meta: "SESSION/2026/036 · 45m ago", sev: "var(--info)" },
                  ].map((alert, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '12px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)', borderLeft: `4px solid ${alert.sev}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px', fontFamily: 'var(--font-mono)' }}>{alert.cam}</div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{alert.msg}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{alert.meta}</div>
                      </div>
                      <button onClick={() => navigate('/cctv')} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>open_in_new</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
        </main>
      </div>
    </div>
  );
}
