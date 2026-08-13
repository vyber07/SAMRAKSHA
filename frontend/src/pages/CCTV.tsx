import React, { useState, useEffect } from 'react';
import {
  Camera, AlertTriangle, Wifi, WifiOff, ZoomIn, ZoomOut,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Eye, EyeOff, Sun, RotateCcw, Car, Download, Bell
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePublishedPage } from '../hooks/usePublishedPage';
import { PublishedPageRenderer } from '../editor/PublishedPageRenderer';

const CAMERAS = [
  { id: 'CAM-001', location: 'Satellite Ward - Main Rd', status: 'live', alert: false, persons: 3, lastPlate: 'GJ01AB1234' },
  { id: 'CAM-002', location: 'Naranpura Crossing', status: 'alert', alert: true, persons: 7, lastPlate: 'GJ01XY9988' },
  { id: 'CAM-003', location: 'SG Highway Node 3', status: 'live', alert: false, persons: 1, lastPlate: 'MH04CD5678' },
  { id: 'CAM-004', location: 'Maninagar Junction', status: 'offline', alert: false, persons: 0, lastPlate: '--' },
  { id: 'CAM-005', location: 'Bodakdev Lake Front', status: 'live', alert: false, persons: 5, lastPlate: 'GJ01MN2222' },
  { id: 'CAM-006', location: 'Ghatlodia Sector B', status: 'alert', alert: true, persons: 12, lastPlate: 'RJ14WX7777' },
  { id: 'CAM-007', location: 'Nikol BRTS Station', status: 'live', alert: false, persons: 9, lastPlate: 'GJ01PQ3344' },
  { id: 'CAM-008', location: 'Vastrapur Overbridge', status: 'live', alert: false, persons: 2, lastPlate: 'GJ05ZZ0011' },
];

const ANPR_ALERTS = [
  { plate: 'GJ01XY9988', time: '11:42', camera: 'CAM-002', fir: 'FIR-2024/MN/0441', reason: 'Wanted in Robbery Case' },
  { plate: 'RJ14WX7777', time: '10:15', camera: 'CAM-006', fir: 'FIR-2024/NK/0312', reason: 'Cyber fraud suspect vehicle' },
  { plate: 'MH04CD5678', time: '09:30', camera: 'CAM-003', fir: 'FIR-2024/SB/1187', reason: 'Stolen vehicle reported' },
];

const FEED_COLORS = [
  ['rgba(0,75,135,0.15)', 'rgba(0,99,178,0.1)'],
  ['rgba(139,92,246,0.15)', 'rgba(109,40,217,0.1)'],
  ['rgba(16,185,129,0.1)', 'rgba(5,150,105,0.08)'],
  ['rgba(245,158,11,0.12)', 'rgba(217,119,6,0.08)'],
  ['rgba(59,130,246,0.12)', 'rgba(37,99,235,0.08)'],
  ['rgba(236,72,153,0.12)', 'rgba(190,24,93,0.08)'],
  ['rgba(20,184,166,0.12)', 'rgba(13,148,136,0.08)'],
  ['rgba(239,68,68,0.1)', 'rgba(185,28,28,0.06)'],
];

const CCTV: React.FC = () => {
  const publishedPage = usePublishedPage('cctv');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedCam, setSelectedCam] = useState<string | null>(null);
  const [nightVision, setNightVision] = useState(false);
  const [showBboxes, setShowBboxes] = useState(true);
  const [toast, setToast] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [scanLine, setScanLine] = useState(0);

  const cardBg = isDark ? 'rgba(13,27,46,0.75)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';

  useEffect(() => {
    const t = setInterval(() => setScanLine(p => (p + 1) % 100), 50);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSnapshot = () => {
    showToast(`📸 Snapshot captured from ${selectedCam || 'CAM-001'} — saved to evidence log`);
  };

  // ── Published override ───────────────────────────────────────────────────
  if (publishedPage) return <PublishedPageRenderer snapshot={publishedPage} />;

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: 'var(--bg-primary)', color: textPrimary }}>
      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '24px', right: '24px', zIndex: 9999,
          padding: '12px 20px', borderRadius: '10px',
          background: isDark ? 'rgba(13,27,46,0.95)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)', border: `1px solid ${cardBorder}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          fontSize: '13px', fontWeight: 600, color: '#10B981',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <Bell size={14} color="#10B981" /> {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Camera size={22} style={{ color: isDark ? '#A8CAFF' : '#004B87' }} />
          <div>
            <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '22px', color: textPrimary }}>
              Live CCTV Surveillance
            </h1>
            <p style={{ fontSize: '13px', color: textMuted }}>
              {CAMERAS.filter(c => c.status === 'live' || c.status === 'alert').length} cameras online · {CAMERAS.filter(c => c.alert).length} alerts active
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ animation: 'livePulse 1.5s ease-in-out infinite', width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>LIVE FEED</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px' }}>
        {/* Camera grid */}
        <div>
          {/* Controls bar */}
          <div style={{
            background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
            borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
            display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
          }}>
            {/* PTZ Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>PTZ</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <button onClick={() => {}} style={ptzBtnStyle(isDark)}><ChevronUp size={14} /></button>
                <div style={{ display: 'flex', gap: '2px' }}>
                  <button onClick={() => {}} style={ptzBtnStyle(isDark)}><ChevronLeft size={14} /></button>
                  <button
                    onClick={() => { setZoomLevel(1); showToast('PTZ Reset'); }}
                    style={{ ...ptzBtnStyle(isDark), background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
                    title="Reset"
                  ><RotateCcw size={12} /></button>
                  <button onClick={() => {}} style={ptzBtnStyle(isDark)}><ChevronRight size={14} /></button>
                </div>
                <button onClick={() => {}} style={ptzBtnStyle(isDark)}><ChevronDown size={14} /></button>
              </div>
            </div>

            <div style={{ width: '1px', height: '60px', background: cardBorder }} />

            {/* Zoom */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Zoom x{zoomLevel.toFixed(1)}</span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => setZoomLevel(Math.min(4, zoomLevel + 0.5))} style={controlBtnStyle(isDark, '#3B82F6')}><ZoomIn size={14} /> In</button>
                <button onClick={() => setZoomLevel(Math.max(1, zoomLevel - 0.5))} style={controlBtnStyle(isDark, '#F59E0B')}><ZoomOut size={14} /> Out</button>
              </div>
            </div>

            <div style={{ width: '1px', height: '60px', background: cardBorder }} />

            {/* Toggles */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { setNightVision(!nightVision); showToast(nightVision ? 'IR Night Vision OFF' : 'IR Night Vision ON'); }}
                style={controlBtnStyle(isDark, nightVision ? '#10B981' : textMuted, nightVision)}
              >
                <Sun size={14} /> IR {nightVision ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={() => setShowBboxes(!showBboxes)}
                style={controlBtnStyle(isDark, showBboxes ? '#8B5CF6' : textMuted, showBboxes)}
              >
                {showBboxes ? <Eye size={14} /> : <EyeOff size={14} />} AI Boxes
              </button>
              <button
                onClick={handleSnapshot}
                style={controlBtnStyle(isDark, '#EF4444', false)}
              >
                <Download size={14} /> Snapshot
              </button>
            </div>
          </div>

          {/* Feed grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {CAMERAS.map((cam, idx) => {
              const isOffline = cam.status === 'offline';
              const isAlert = cam.status === 'alert';
              const isSelected = selectedCam === cam.id;
              const colors = FEED_COLORS[idx % FEED_COLORS.length];

              return (
                <div
                  key={cam.id}
                  onClick={() => setSelectedCam(isSelected ? null : cam.id)}
                  style={{
                    borderRadius: '10px', overflow: 'hidden', cursor: 'pointer',
                    border: `2px solid ${isSelected ? (isDark ? '#A8CAFF' : '#004B87') : isAlert ? '#EF4444' : cardBorder}`,
                    position: 'relative',
                    boxShadow: isSelected ? `0 0 20px ${isDark ? 'rgba(168,202,255,0.3)' : 'rgba(0,75,135,0.25)'}` : 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                  }}
                >
                  {/* Feed area */}
                  <div style={{
                    height: '120px',
                    background: nightVision
                      ? `radial-gradient(ellipse at center, rgba(16,185,129,0.2) 0%, rgba(0,50,0,0.6) 100%)`
                      : `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`,
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isOffline ? (
                      <div style={{ textAlign: 'center', color: '#6B7280' }}>
                        <WifiOff size={24} style={{ margin: '0 auto 6px' }} />
                        <div style={{ fontSize: '10px', fontWeight: 600 }}>OFFLINE</div>
                      </div>
                    ) : (
                      <>
                        {/* Scan line animation */}
                        <div style={{
                          position: 'absolute', left: 0, right: 0,
                          top: `${scanLine}%`, height: '2px',
                          background: nightVision ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)',
                          transition: 'none',
                        }} />

                        {/* Person count bounding box */}
                        {showBboxes && cam.persons > 0 && (
                          <div style={{
                            position: 'absolute', top: '15px', left: '10px',
                            border: `1px solid ${nightVision ? '#10B981' : '#3B82F6'}`,
                            borderRadius: '3px', padding: '2px 6px',
                            fontSize: '9px', fontWeight: 700, fontFamily: 'JetBrains Mono',
                            color: nightVision ? '#10B981' : '#3B82F6',
                            background: nightVision ? 'rgba(16,185,129,0.1)' : 'rgba(59,130,246,0.1)',
                          }}>
                            PERSON x{cam.persons}
                          </div>
                        )}

                        {/* Plate detection */}
                        {showBboxes && cam.lastPlate !== '--' && (
                          <div style={{
                            position: 'absolute', bottom: '10px', right: '6px',
                            border: '1px solid #F59E0B', borderRadius: '3px', padding: '2px 6px',
                            fontSize: '9px', fontWeight: 700, fontFamily: 'JetBrains Mono',
                            color: '#F59E0B', background: 'rgba(245,158,11,0.1)',
                          }}>
                            {cam.lastPlate}
                          </div>
                        )}

                        {/* Alert overlay */}
                        {isAlert && (
                          <div style={{
                            position: 'absolute', inset: 0,
                            border: '2px solid rgba(239,68,68,0.5)',
                            borderRadius: '8px',
                            background: 'rgba(239,68,68,0.05)',
                            animation: 'livePulse 1s ease-in-out infinite',
                          }} />
                        )}
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div style={{
                    padding: '7px 10px', background: isDark ? '#0a1628' : '#f8fafc',
                    borderTop: `1px solid ${cardBorder}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '10px', fontWeight: 700, color: isDark ? '#A8CAFF' : '#004B87' }}>{cam.id}</div>
                      <div style={{ fontSize: '9px', color: textMuted, marginTop: '1px' }}>{cam.location.split(' - ')[0]}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {isOffline ? <WifiOff size={10} color="#6B7280" /> : isAlert ? <AlertTriangle size={10} color="#EF4444" /> : <Wifi size={10} color="#10B981" />}
                      <span style={{ fontSize: '9px', fontWeight: 700, color: isOffline ? '#6B7280' : isAlert ? '#EF4444' : '#10B981', textTransform: 'uppercase' }}>
                        {cam.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel: ANPR Alerts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selected camera info */}
          {selectedCam && (
            <div style={{
              background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${isDark ? '#A8CAFF' : '#004B87'}40`,
              borderRadius: '12px', padding: '16px',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#A8CAFF' : '#004B87', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Selected Camera
              </div>
              {(() => {
                const cam = CAMERAS.find(c => c.id === selectedCam)!;
                return (
                  <>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: '15px', fontWeight: 800, color: textPrimary }}>{cam.id}</div>
                    <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>{cam.location}</div>
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '12px', color: textPrimary }}>Persons detected: <b>{cam.persons}</b></div>
                      <div style={{ fontSize: '12px', color: textPrimary }}>Last plate: <span style={{ fontFamily: 'JetBrains Mono', color: '#F59E0B' }}>{cam.lastPlate}</span></div>
                      <div style={{ fontSize: '12px', color: textPrimary }}>Zoom: <b>x{zoomLevel.toFixed(1)}</b></div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* ANPR Alerts */}
          <div style={{
            background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
            borderRadius: '12px', padding: '16px', flex: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Car size={15} color="#EF4444" />
              <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '13px', color: textPrimary }}>ANPR Alerts</h3>
              <span style={{
                marginLeft: 'auto', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                background: 'rgba(239,68,68,0.15)', color: '#EF4444',
              }}>{ANPR_ALERTS.length} FLAGGED</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ANPR_ALERTS.map(alert => (
                <div key={alert.plate} style={{
                  padding: '12px', borderRadius: '8px',
                  background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '13px', fontWeight: 800, color: '#EF4444' }}>{alert.plate}</span>
                    <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: textMuted }}>{alert.time}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: textPrimary, marginBottom: '6px' }}>{alert.reason}</p>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: textMuted }}>
                    <span>{alert.camera}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'JetBrains Mono', color: isDark ? '#A8CAFF' : '#004B87' }}>{alert.fir}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Camera status summary */}
          <div style={{
            background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
            borderRadius: '12px', padding: '16px',
          }}>
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '12px', color: textPrimary, marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Camera Status
            </h3>
            {[
              { label: 'Live', count: CAMERAS.filter(c => c.status === 'live').length, color: '#10B981' },
              { label: 'Alert Active', count: CAMERAS.filter(c => c.status === 'alert').length, color: '#EF4444' },
              { label: 'Offline', count: CAMERAS.filter(c => c.status === 'offline').length, color: '#6B7280' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: textMuted }}>{s.label}</span>
                <span style={{ fontSize: '14px', fontWeight: 800, fontFamily: 'JetBrains Mono', color: s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ptzBtnStyle = (isDark: boolean): React.CSSProperties => ({
  width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,75,135,0.07)',
  border: isDark ? '1px solid rgba(168,202,255,0.15)' : '1px solid rgba(0,75,135,0.15)',
  cursor: 'pointer', color: isDark ? '#A8CAFF' : '#004B87', transition: 'background 0.15s',
});

const controlBtnStyle = (isDark: boolean, color: string, active?: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px',
  borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  background: active ? `${color}20` : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.05)',
  border: `1px solid ${active ? color : (isDark ? 'rgba(168,202,255,0.15)' : 'rgba(0,75,135,0.15)')}`,
  color: active ? color : (isDark ? '#b8cef8' : '#334155'),
  transition: 'all 0.15s',
});

export default CCTV;
