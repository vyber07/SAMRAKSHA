import React, { useEffect, useState } from 'react';
import { cctv as cctvApi } from '../lib/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function CCTVPage() {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      setLoading(true);
      const res = await cctvApi.list();
      setCameras(res.data);
    } catch (error) {
      console.error('Failed to load CCTV data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return status?.toLowerCase() === 'online' ? '#10b981' : '#ef4444';
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onRefresh={loadCameras} />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 100%)' }}>
          <div style={{ marginBottom: '24px' }} className="fade-in">
            <h1 className="heading-md" style={{ marginBottom: '8px' }}>CCTV Monitoring</h1>
            <p className="body-md" style={{ color: 'var(--light-text-secondary)' }}>Surveillance camera network status and feed</p>
          </div>

          {/* Status Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="glass fade-in" style={{ padding: '16px', textAlign: 'center' }}>
              <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '8px' }}>Online</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>
                {cameras.filter(c => c.status?.toLowerCase() === 'online').length}
              </div>
            </div>
            <div className="glass fade-in" style={{ padding: '16px', textAlign: 'center' }}>
              <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '8px' }}>Offline</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>
                {cameras.filter(c => c.status?.toLowerCase() !== 'online').length}
              </div>
            </div>
            <div className="glass fade-in" style={{ padding: '16px', textAlign: 'center' }}>
              <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '8px' }}>Total</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: '#6366f1' }}>
                {cameras.length}
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--light-text-secondary)' }}>
              <div className="pulse" style={{ display: 'inline-block' }}>Loading camera feed...</div>
            </div>
          ) : cameras.length === 0 ? (
            <div className="glass" style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--light-text-secondary)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📹</div>
              <p className="body-lg">No cameras found</p>
              <p className="body-md">Configure cameras in the system settings</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '20px',
            }}>
              {cameras.map((camera, i) => {
                const statusColor = getStatusColor(camera.status);
                const isOnline = camera.status?.toLowerCase() === 'online';
                return (
                  <div
                    key={i}
                    className="glass slide-up"
                    style={{
                      overflow: 'hidden',
                      cursor: 'pointer',
                      animationDelay: `${i * 50}ms`,
                      borderTop: `3px solid ${statusColor}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 12px 32px ${statusColor}25`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Camera Feed Placeholder */}
                    <div style={{
                      width: '100%',
                      aspectRatio: '16 / 9',
                      background: isOnline
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))'
                        : 'linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(239, 68, 68, 0.05))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      color: isOnline ? '#10b981' : '#ef4444',
                      borderBottom: `1px solid rgba(148, 163, 184, 0.1)`,
                      position: 'relative',
                    }}>
                      📹
                      {isOnline && (
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          right: '8px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: '#10b981',
                          animation: 'pulse 2s infinite',
                          boxShadow: '0 0 8px rgba(16, 185, 129, 0.5)',
                        }} />
                      )}
                    </div>

                    {/* Camera Info */}
                    <div style={{ padding: '20px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '16px',
                        gap: '12px',
                      }}>
                        <div>
                          <h3 className="heading-sm" style={{ margin: 0, marginBottom: '4px' }}>
                            Camera {camera.camera_id || i + 1}
                          </h3>
                          <p className="body-md" style={{ color: 'var(--light-text-secondary)', margin: 0 }}>
                            {camera.location || 'Central Area'}
                          </p>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-8)',
                          background: `${statusColor}20`,
                          border: `1px solid ${statusColor}40`,
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: statusColor,
                            animation: isOnline ? 'pulse 2s infinite' : 'none',
                          }} />
                          <span className="label-sm" style={{ color: statusColor, margin: 0 }}>
                            {camera.status?.toUpperCase() || 'ONLINE'}
                          </span>
                        </div>
                      </div>

                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
                      }}>
                        <div>
                          <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '4px' }}>Type</div>
                          <div className="body-md" style={{ color: 'var(--light-text)' }}>{camera.camera_type || 'Fixed'}</div>
                        </div>
                        <div>
                          <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '4px' }}>Last Sync</div>
                          <div className="body-md" style={{ color: 'var(--light-text)' }}>
                            {camera.last_sync ? new Date(camera.last_sync).toLocaleTimeString() : 'Now'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
