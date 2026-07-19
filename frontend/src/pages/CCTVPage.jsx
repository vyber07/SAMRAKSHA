import React, { useEffect, useState, useCallback } from 'react';
import PageShell, { EmptyState } from './PageShell';
import { cctv } from '../lib/api';

const MOCK_CAMERAS = [
  { camera_id: 'CAM-01', location: 'Ellisbridge Circle', status: 'online', camera_type: 'PTZ' },
  { camera_id: 'CAM-02', location: 'Navrangpura Cross', status: 'online', camera_type: 'Fixed' },
  { camera_id: 'CAM-03', location: 'Maninagar Station', status: 'offline', camera_type: 'Fixed' },
  { camera_id: 'CAM-04', location: 'Satellite Road', status: 'online', camera_type: 'ANPR' },
  { camera_id: 'CAM-05', location: 'Vastrapur Lake', status: 'online', camera_type: 'PTZ' },
  { camera_id: 'CAM-06', location: 'Law Garden', status: 'offline', camera_type: 'Fixed' },
];

export default function CCTVPage() {
  const [cameras, setCameras] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await cctv.list();
      const data = Array.isArray(res.data) ? res.data : res.data?.items || [];
      setCameras(data.length ? data : MOCK_CAMERAS);
    } catch {
      setCameras(MOCK_CAMERAS);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const online = cameras.filter((c) => String(c.status).toLowerCase() === 'online').length;

  return (
    <PageShell title="CCTV Monitoring" onRefresh={load}>
      {/* Status summary */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
        <div className="glass" style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--success)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 13 }}><strong>{online}</strong> Online</span>
        </div>
        <div className="glass" style={{ padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--error)' }} />
          <span style={{ fontSize: 13 }}><strong>{cameras.length - online}</strong> Offline</span>
        </div>
      </div>

      {cameras.length === 0 ? (
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
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(249,115,22,0.06))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 6,
                  borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 28, opacity: isOnline ? 1 : 0.3 }}>📹</span>
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
      )}
    </PageShell>
  );
}
