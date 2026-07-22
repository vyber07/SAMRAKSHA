import React, { useEffect, useState, useCallback } from 'react';
import PageShell, { EmptyState } from './PageShell';
import { cctv } from '../lib/api';

const MOCK_CAMERAS = [
  { camera_id: 'CAM-01', location: 'Ellisbridge Circle', status: 'online',  camera_type: 'PTZ' },
  { camera_id: 'CAM-02', location: 'Navrangpura Cross',  status: 'online',  camera_type: 'Fixed' },
  { camera_id: 'CAM-03', location: 'Maninagar Station',  status: 'offline', camera_type: 'Fixed' },
  { camera_id: 'CAM-04', location: 'Satellite Road',     status: 'online',  camera_type: 'ANPR' },
  { camera_id: 'CAM-05', location: 'Vastrapur Lake',     status: 'online',  camera_type: 'PTZ' },
  { camera_id: 'CAM-06', location: 'Law Garden',         status: 'offline', camera_type: 'Fixed' },
];

const MOCK_ANOMALIES = [
  { id: 1, camera_id: 'CAM-01', alert_type: 'crowd_density', confidence: 0.91, person_count: 45, ts: new Date().toISOString() },
  { id: 2, camera_id: 'CAM-04', alert_type: 'anpr',          confidence: 0.98, plate_no: 'GJ01AB1234', ts: new Date(Date.now() - 12e5).toISOString() },
  { id: 3, camera_id: 'CAM-02', alert_type: 'loitering',     confidence: 0.77, person_count: 3, ts: new Date(Date.now() - 36e5).toISOString() },
  { id: 4, camera_id: 'CAM-05', alert_type: 'anomaly',       confidence: 0.84, ts: new Date(Date.now() - 72e5).toISOString() },
];

const ALERT_COLOR = {
  crowd_density: 'var(--error)',
  anpr:          'var(--primary)',
  loitering:     'var(--warning)',
  anomaly:       'var(--tertiary)',
};

const ALERT_LABEL = {
  crowd_density: '👥 Crowd Density',
  anpr:          '🚗 ANPR Match',
  loitering:     '🕵️ Loitering',
  anomaly:       '⚠️ Anomaly',
};

export default function CCTVPage() {
  const [cameras,   setCameras]   = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [tab, setTab] = useState('cameras'); // 'cameras' | 'anomalies'

  const load = useCallback(async () => {
    // Load cameras
    try {
      const res = await cctv.list();
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setCameras(data.length ? data : MOCK_CAMERAS);
    } catch {
      setCameras(MOCK_CAMERAS);
    }

    // Load anomaly feed
    try {
      const res = await cctv.anomalies();
      const data = res.data?.anomalies || res.data || [];
      setAnomalies(Array.isArray(data) && data.length ? data : MOCK_ANOMALIES);
    } catch {
      setAnomalies(MOCK_ANOMALIES);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const online  = cameras.filter((c) => String(c.status).toLowerCase() === 'online').length;
  const offline = cameras.length - online;

  return (
    <PageShell title="CCTV Monitoring" onRefresh={load}>
      {/* Status summary bar */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="glass" style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 13 }}><strong>{online}</strong> Online</span>
        </div>
        <div className="glass" style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--error)' }} />
          <span style={{ fontSize: 13 }}><strong>{offline}</strong> Offline</span>
        </div>
        <div className="glass" style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--warning)', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 13 }}><strong>{anomalies.length}</strong> Active Alerts</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { id: 'cameras',   label: '📹 Cameras' },
          { id: 'anomalies', label: '🚨 Anomaly Feed' },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '9px 20px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${tab === t.id ? 'var(--primary)' : 'var(--border)'}`,
            background: tab === t.id ? 'var(--primary)' : 'var(--surface)',
            color: tab === t.id ? '#fff' : 'var(--text-muted)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all var(--t-fast) var(--ease)',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Cameras grid */}
      {tab === 'cameras' && (
        cameras.length === 0 ? (
          <EmptyState icon="📹" text="No cameras registered" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {cameras.map((cam, i) => {
              const isOnline = String(cam.status).toLowerCase() === 'online';
              const color = isOnline ? 'var(--success)' : 'var(--error)';
              return (
                <div key={cam.camera_id || i} className="glass fade-in-up" style={{ overflow: 'hidden', animationDelay: `${i * 0.04}s` }}>
                  {/* Feed placeholder */}
                  <div style={{
                    height: 150,
                    background: isOnline
                      ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(37,99,235,0.06))'
                      : 'linear-gradient(135deg, rgba(100,100,100,0.05), rgba(50,50,50,0.04))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 6,
                    borderBottom: '1px solid var(--border)',
                    position: 'relative',
                  }}>
                    {isOnline && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        background: 'rgba(220,38,38,0.85)', color: '#fff',
                        fontSize: 9, fontWeight: 800, padding: '2px 7px',
                        borderRadius: 3, fontFamily: 'var(--font-mono)', letterSpacing: '0.5px',
                      }}>● LIVE</span>
                    )}
                    <span style={{ fontSize: 28, opacity: isOnline ? 1 : 0.25 }}>📹</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {isOnline ? 'LIVE FEED' : 'NO SIGNAL'}
                    </span>
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14 }}>{cam.camera_id || `CAM-${i + 1}`}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 'var(--radius-sm)', background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: isOnline ? 'pulse 2s infinite' : 'none' }} />
                        <span style={{ color, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                      </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--text-muted)', display: 'grid', gap: 4 }}>
                      <div>📍 {cam.location || 'Unknown'}</div>
                      <div>🎥 {cam.camera_type || 'Fixed'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Anomaly feed */}
      {tab === 'anomalies' && (
        anomalies.length === 0 ? (
          <EmptyState icon="✅" text="No anomalies detected — all feeds clear" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
            {anomalies.map((a, i) => {
              const color = ALERT_COLOR[a.alert_type] || 'var(--secondary)';
              return (
                <div key={a.id || i} className="glass fade-in-up" style={{ padding: 18, borderLeft: `4px solid ${color}`, animationDelay: `${i * 0.05}s` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color }}>{ALERT_LABEL[a.alert_type] || a.alert_type}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', padding: '3px 8px', borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                      {a.camera_id}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: 5, fontSize: 12, color: 'var(--text-muted)' }}>
                    <div>🎯 Confidence: <strong style={{ color: 'var(--text)' }}>{((a.confidence || 0) * 100).toFixed(0)}%</strong></div>
                    {a.person_count && <div>👥 Persons: <strong style={{ color: 'var(--text)' }}>{a.person_count}</strong></div>}
                    {a.plate_no    && <div>🚗 Plate: <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>{a.plate_no}</strong></div>}
                    <div>🕐 {a.ts ? new Date(a.ts).toLocaleTimeString('en-IN') : '—'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </PageShell>
  );
}
