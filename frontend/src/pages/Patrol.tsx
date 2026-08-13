import React, { useState } from 'react';
import { Truck, Phone, Fuel, Gauge, MapPin, CheckCircle2, Circle, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePublishedPage } from '../hooks/usePublishedPage';
import { PublishedPageRenderer } from '../editor/PublishedPageRenderer';

const PATROL_UNITS = [
  { id: 'PCR-11', type: 'Interceptor', status: 'Responding', speed: 72, fuel: 68, officer: 'SI Ashok Mehta', phone: '9876543210', ward: 'Satellite', lat: '23.0290° N', lng: '72.5180° E', since: '08:00', incident: 'Robbery call — Satellite PS' },
  { id: 'PCR-14', type: 'Quick Response Van', status: 'Active', speed: 45, fuel: 82, officer: 'SI Rajan Joshi', phone: '9876543211', ward: 'Bodakdev', lat: '23.0500° N', lng: '72.5300° E', since: '06:00', incident: null },
  { id: 'PCR-23', type: 'Patrol Van', status: 'Idle', speed: 0, fuel: 55, officer: 'HC Devraj Desai', phone: '9876543212', ward: 'Nikol', lat: '23.0420° N', lng: '72.6100° E', since: '10:00', incident: null },
  { id: 'HWY-01', type: 'Highway Patrol', status: 'Active', speed: 110, fuel: 40, officer: 'SI Vijay Rana', phone: '9876543213', ward: 'SG Highway', lat: '23.0200° N', lng: '72.5150° E', since: '07:00', incident: null },
  { id: 'PCR-07', type: 'Interceptor', status: 'Active', speed: 55, fuel: 90, officer: 'HC Suresh Patel', phone: '9876543214', ward: 'Maninagar', lat: '23.0100° N', lng: '72.6020° E', since: '09:00', incident: null },
  { id: 'QRF-02', type: 'Quick Response Force', status: 'Idle', speed: 0, fuel: 75, officer: 'SI Nisha Chauhan', phone: '9876543215', ward: 'Naranpura', lat: '23.0607° N', lng: '72.5637° E', since: '08:30', incident: null },
];

const ROUTES = [
  {
    id: 'RT-01',
    name: 'Satellite Loop',
    unit: 'PCR-14',
    checkpoints: [
      { name: 'Satellite PS', done: true, time: '06:15' },
      { name: 'Shyamal Cross Rd', done: true, time: '06:45' },
      { name: 'Rajpath Club', done: true, time: '07:20' },
      { name: 'Drive-in Rd', done: false, time: '--' },
      { name: 'Bodakdev', done: false, time: '--' },
    ],
  },
  {
    id: 'RT-02',
    name: 'Naranpura Sector',
    unit: 'QRF-02',
    checkpoints: [
      { name: 'Naranpura PS', done: true, time: '08:35' },
      { name: 'Vijay Char Rasta', done: true, time: '09:05' },
      { name: 'Stadium Rd', done: false, time: '--' },
      { name: 'Commerce Six Rd', done: false, time: '--' },
    ],
  },
  {
    id: 'RT-03',
    name: 'SG Highway Corridor',
    unit: 'HWY-01',
    checkpoints: [
      { name: 'Helmet Cross Rd', done: true, time: '07:10' },
      { name: 'ISCON Cross Rd', done: true, time: '07:40' },
      { name: 'Shela Junction', done: true, time: '08:15' },
      { name: 'Bopal Cross Rd', done: false, time: '--' },
      { name: 'GIFT City Entry', done: false, time: '--' },
    ],
  },
];

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  Active: { bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
  Responding: { bg: 'rgba(239,68,68,0.15)', text: '#EF4444' },
  Idle: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
};

const Patrol: React.FC = () => {
  const publishedPage = usePublishedPage('patrol');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);

  const cardBg = isDark ? 'rgba(13,27,46,0.75)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';

  // ── Published override ───────────────────────────────────────────────────
  if (publishedPage) return <PublishedPageRenderer snapshot={publishedPage} />;

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: 'var(--bg-primary)', color: textPrimary }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <Truck size={22} style={{ color: isDark ? '#A8CAFF' : '#004B87' }} />
        <div>
          <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '22px', color: textPrimary }}>Patrol Fleet Tracker</h1>
          <p style={{ fontSize: '13px', color: textMuted }}>
            {PATROL_UNITS.filter(u => u.status !== 'Idle').length} units deployed · {PATROL_UNITS.filter(u => u.status === 'Responding').length} responding
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
        {[
          { label: 'Total Units', value: PATROL_UNITS.length, color: isDark ? '#A8CAFF' : '#004B87' },
          { label: 'Active', value: PATROL_UNITS.filter(u => u.status === 'Active').length, color: '#10B981' },
          { label: 'Responding', value: PATROL_UNITS.filter(u => u.status === 'Responding').length, color: '#EF4444' },
          { label: 'Idle', value: PATROL_UNITS.filter(u => u.status === 'Idle').length, color: '#F59E0B' },
        ].map(s => (
          <div key={s.label} style={{
            background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
            borderRadius: '12px', padding: '16px 20px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Montserrat', color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Unit list */}
        <div>
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: textPrimary, marginBottom: '12px' }}>
            Active Fleet Units
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {PATROL_UNITS.map(unit => {
              const st = STATUS_STYLES[unit.status] || STATUS_STYLES.Idle;
              const isSelected = selectedUnit === unit.id;
              return (
                <div
                  key={unit.id}
                  onClick={() => setSelectedUnit(isSelected ? null : unit.id)}
                  style={{
                    background: cardBg, backdropFilter: 'blur(12px)',
                    border: `1px solid ${isSelected ? (isDark ? '#A8CAFF' : '#004B87') : cardBorder}`,
                    borderRadius: '12px', padding: '16px', cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isSelected ? `0 0 20px ${isDark ? 'rgba(168,202,255,0.2)' : 'rgba(0,75,135,0.15)'}` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 800, fontSize: '16px', color: isDark ? '#A8CAFF' : '#004B87' }}>{unit.id}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: st.bg, color: st.text }}>{unit.status}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>{unit.type}</div>
                    </div>
                    <Shield size={16} style={{ color: textMuted, opacity: 0.5 }} />
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: textPrimary }}>
                      <Gauge size={12} style={{ color: '#3B82F6' }} />
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{unit.speed} km/h</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: textPrimary }}>
                      <Fuel size={12} style={{ color: unit.fuel < 30 ? '#EF4444' : '#10B981' }} />
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: unit.fuel < 30 ? '#EF4444' : 'inherit' }}>{unit.fuel}%</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: textMuted }}>
                      <MapPin size={12} />
                      <span>{unit.ward}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(0,75,135,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={12} style={{ color: isDark ? '#A8CAFF' : '#004B87' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>{unit.officer}</div>
                      </div>
                    </div>
                    <a href={`tel:${unit.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: '#10B981', textDecoration: 'none' }}>
                      <Phone size={11} />{unit.phone}
                    </a>
                  </div>

                  {/* Incident alert */}
                  {unit.incident && (
                    <div style={{
                      marginTop: '10px', padding: '7px 10px', borderRadius: '7px',
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                      fontSize: '11px', color: '#EF4444', fontWeight: 600,
                    }}>
                      🚨 {unit.incident}
                    </div>
                  )}

                  {/* Fuel bar */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ height: '4px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${unit.fuel}%`, background: unit.fuel < 30 ? '#EF4444' : unit.fuel < 60 ? '#F59E0B' : '#10B981', borderRadius: '2px' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Route inspector */}
        <div>
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: textPrimary, marginBottom: '12px' }}>
            Route Inspector
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ROUTES.map(route => {
              const done = route.checkpoints.filter(c => c.done).length;
              const total = route.checkpoints.length;
              const pct = Math.round((done / total) * 100);
              return (
                <div key={route.id} style={{
                  background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
                  borderRadius: '12px', padding: '18px',
                  boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(0,75,135,0.08)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: textPrimary }}>{route.name}</div>
                      <div style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', color: isDark ? '#A8CAFF' : '#004B87', fontWeight: 600 }}>{route.unit}</span>
                        {' '}· {done}/{total} checkpoints
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '20px', fontWeight: 800, color: pct === 100 ? '#10B981' : pct > 50 ? '#F59E0B' : '#3B82F6' }}>{pct}%</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ height: '5px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '14px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10B981' : '#3B82F6', borderRadius: '3px', transition: 'width 0.5s' }} />
                  </div>

                  {/* Checkpoints */}
                  <div style={{ position: 'relative', paddingLeft: '20px' }}>
                    <div style={{
                      position: 'absolute', left: '6px', top: '6px', bottom: '6px', width: '2px',
                      background: isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)',
                    }} />
                    {route.checkpoints.map((cp, cpIdx) => (
                      <div key={cpIdx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '-18px', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {cp.done
                            ? <CheckCircle2 size={14} color="#10B981" />
                            : <Circle size={14} color={textMuted} strokeDasharray="3 2" />}
                        </div>
                        <span style={{ fontSize: '12px', color: cp.done ? textPrimary : textMuted, fontWeight: cp.done ? 500 : 400 }}>{cp.name}</span>
                        <span style={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: cp.done ? '#10B981' : textMuted }}>{cp.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Patrol;
