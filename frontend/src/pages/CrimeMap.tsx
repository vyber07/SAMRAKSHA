import React, { useEffect, useRef, useState } from 'react';
import { Camera, Truck, Layers, AlertTriangle, Clock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePublishedPage } from '../hooks/usePublishedPage';
import { PublishedPageRenderer } from '../editor/PublishedPageRenderer';

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

const WARD_DATA = [
  { name: 'Satellite', lat: 23.0225, lng: 72.5100, risk: 82, color: '#EF4444', radius: 1800 },
  { name: 'Naranpura', lat: 23.0607, lng: 72.5637, risk: 67, color: '#F59E0B', radius: 1500 },
  { name: 'Maninagar', lat: 22.9975, lng: 72.6020, risk: 74, color: '#F59E0B', radius: 1600 },
  { name: 'Bodakdev', lat: 23.0380, lng: 72.5070, risk: 55, color: '#10B981', radius: 1400 },
  { name: 'Ghatlodia', lat: 23.0820, lng: 72.5560, risk: 61, color: '#F59E0B', radius: 1500 },
  { name: 'Nikol', lat: 23.0442, lng: 72.6460, risk: 78, color: '#EF4444', radius: 1600 },
  { name: 'Vastrapur', lat: 23.0330, lng: 72.5260, risk: 48, color: '#10B981', radius: 1300 },
];

const CRIME_MARKERS = [
  { lat: 23.0310, lng: 72.5200, type: 'Theft', fir: '2024/SB/1187', time: '08:32', ward: 'Satellite' },
  { lat: 23.0600, lng: 72.5600, type: 'Assault', fir: '2024/NR/0923', time: '14:15', ward: 'Naranpura' },
  { lat: 22.9990, lng: 72.6010, type: 'Robbery', fir: '2024/MN/0441', time: '22:05', ward: 'Maninagar' },
  { lat: 23.0400, lng: 72.6450, type: 'Cyber Crime', fir: '2024/NK/0312', time: '11:20', ward: 'Nikol' },
  { lat: 23.0360, lng: 72.5280, type: 'NDPS', fir: '2024/VP/0178', time: '03:40', ward: 'Vastrapur' },
  { lat: 23.0790, lng: 72.5530, type: 'Theft', fir: '2024/GL/0229', time: '17:55', ward: 'Ghatlodia' },
];

const PATROL_UNITS = [
  { id: 'PCR-11', lat: 23.0290, lng: 72.5180, status: 'Responding', officer: 'SI Mehta' },
  { id: 'PCR-14', lat: 23.0500, lng: 72.5300, status: 'Active', officer: 'SI Joshi' },
  { id: 'PCR-23', lat: 23.0420, lng: 72.6100, status: 'Idle', officer: 'HC Desai' },
];

const CCTV_NODES = [
  { id: 'CCTV-001', lat: 23.0350, lng: 72.5250, status: 'Live' },
  { id: 'CCTV-002', lat: 23.0610, lng: 72.5620, status: 'Alert' },
  { id: 'CCTV-003', lat: 23.0070, lng: 72.5950, status: 'Offline' },
  { id: 'ANPR-01', lat: 23.0200, lng: 72.5150, status: 'Live' },
];

const CrimeMap: React.FC = () => {
  const publishedPage = usePublishedPage('map');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [dayRange, setDayRange] = useState<string>('24h');
  const [showCrime, setShowCrime] = useState(true);
  const [showPatrol, setShowPatrol] = useState(true);
  const [showCCTV, setShowCCTV] = useState(true);
  const [showOverlays, setShowOverlays] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<typeof PATROL_UNITS[0] | null>(null);

  const cardBg = isDark ? 'rgba(13,27,46,0.9)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.15)' : 'rgba(0,75,135,0.15)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import('leaflet').then((L) => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!, {
        center: [23.0225, 72.5714],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      const tileLayer = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileLayer, {
        attribution: '© OpenStreetMap contributors, © CARTO',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      // Ward overlays
      WARD_DATA.forEach(ward => {
        L.circle([ward.lat, ward.lng], {
          radius: ward.radius,
          color: ward.color,
          fillColor: ward.color,
          fillOpacity: 0.08,
          weight: 1.5,
        }).addTo(map)
          .bindPopup(`<b>${ward.name}</b><br/>Risk Score: <b>${ward.risk}/100</b>`);
      });

      // Crime markers
      CRIME_MARKERS.forEach(crime => {
        const typeColors: Record<string, string> = {
          Theft: '#3B82F6', Assault: '#EF4444', Robbery: '#F59E0B',
          'Cyber Crime': '#8B5CF6', NDPS: '#EC4899'
        };
        const color = typeColors[crime.type] || '#6B7280';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:11px;color:white;font-weight:700;">${crime.type[0]}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });
        L.marker([crime.lat, crime.lng], { icon }).addTo(map)
          .bindPopup(`<b>${crime.type}</b><br/>FIR: <code>${crime.fir}</code><br/>Ward: ${crime.ward}<br/>Time: ${crime.time}`);
      });

      // Patrol units
      PATROL_UNITS.forEach(unit => {
        const statusColors: Record<string, string> = { Active: '#10B981', Responding: '#EF4444', Idle: '#F59E0B' };
        const color = statusColors[unit.status] || '#6B7280';
        const icon = L.divIcon({
          className: '',
          html: `<div style="padding:3px 7px;border-radius:20px;background:${color};color:white;font-size:10px;font-weight:700;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);white-space:nowrap;">${unit.id}</div>`,
          iconSize: [60, 22],
          iconAnchor: [30, 11],
        });
        L.marker([unit.lat, unit.lng], { icon }).addTo(map)
          .bindPopup(`<b>${unit.id}</b><br/>Officer: ${unit.officer}<br/>Status: <b style="color:${color}">${unit.status}</b>`);
      });

      // CCTV/ANPR nodes
      CCTV_NODES.forEach(node => {
        const statusColors: Record<string, string> = { Live: '#10B981', Alert: '#EF4444', Offline: '#6B7280' };
        const color = statusColors[node.status] || '#6B7280';
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:18px;height:18px;border-radius:4px;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        L.marker([node.lat, node.lng], { icon }).addTo(map)
          .bindPopup(`<b>${node.id}</b><br/>Status: <b style="color:${color}">${node.status}</b>`);
      });

      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // ── Published override ───────────────────────────────────────────────────
  if (publishedPage) return <PublishedPageRenderer snapshot={publishedPage} />;

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{
        width: '280px', minWidth: '280px', background: cardBg, backdropFilter: 'blur(16px)',
        borderRight: `1px solid ${cardBorder}`, overflow: 'y-auto', display: 'flex', flexDirection: 'column',
        padding: '20px', gap: '16px',
      }}>
        <h2 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '16px', color: textPrimary }}>
          Crime & Patrol Map
        </h2>

        {/* Ward filter */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Ward Filter
          </label>
          <select
            value={selectedWard}
            onChange={e => setSelectedWard(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)',
              border: `1px solid ${cardBorder}`, borderRadius: '8px',
              color: textPrimary, fontSize: '13px', outline: 'none',
            }}
          >
            <option value="All">All Wards</option>
            {WARD_DATA.map(w => <option key={w.name}>{w.name}</option>)}
          </select>
        </div>

        {/* Day range */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Time Range
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            {['24h', '7d', '30d'].map(r => (
              <button
                key={r}
                onClick={() => setDayRange(r)}
                style={{
                  flex: 1, padding: '7px', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  background: dayRange === r ? '#004B87' : 'transparent',
                  color: dayRange === r ? 'white' : textMuted,
                  border: `1px solid ${dayRange === r ? '#004B87' : cardBorder}`,
                  transition: 'all 0.15s',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Layer toggles */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            <Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />
            Layer Controls
          </label>
          {[
            { label: 'Crime Incidents', state: showCrime, setter: setShowCrime, color: '#3B82F6' },
            { label: 'Patrol Units', state: showPatrol, setter: setShowPatrol, color: '#10B981' },
            { label: 'CCTV / ANPR', state: showCCTV, setter: setShowCCTV, color: '#F59E0B' },
            { label: 'Ward Overlays', state: showOverlays, setter: setShowOverlays, color: '#EF4444' },
          ].map(layer => (
            <label key={layer.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', cursor: 'pointer', fontSize: '13px', color: textPrimary }}>
              <div
                onClick={() => layer.setter(!layer.state)}
                style={{
                  width: '36px', height: '20px', borderRadius: '10px',
                  background: layer.state ? layer.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.15)'),
                  transition: 'background 0.2s', cursor: 'pointer', position: 'relative', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: '3px',
                  left: layer.state ? '18px' : '3px',
                  width: '14px', height: '14px', borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                }} />
              </div>
              {layer.label}
            </label>
          ))}
        </div>

        {/* Active units */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Active PCR Units
          </label>
          {PATROL_UNITS.map(unit => (
            <div
              key={unit.id}
              onClick={() => setSelectedUnit(selectedUnit?.id === unit.id ? null : unit)}
              style={{
                padding: '10px 12px', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer',
                background: selectedUnit?.id === unit.id ? (isDark ? 'rgba(168,202,255,0.12)' : 'rgba(0,75,135,0.08)') : 'transparent',
                border: `1px solid ${selectedUnit?.id === unit.id ? '#004B87' : cardBorder}`,
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '13px', color: textPrimary }}>{unit.id}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                  background: unit.status === 'Active' ? 'rgba(16,185,129,0.15)' : unit.status === 'Responding' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                  color: unit.status === 'Active' ? '#10B981' : unit.status === 'Responding' ? '#EF4444' : '#F59E0B',
                }}>
                  {unit.status}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: textMuted, marginTop: '3px' }}>{unit.officer}</div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
            Crime Legend
          </label>
          {[
            { type: 'Theft', color: '#3B82F6' }, { type: 'Assault', color: '#EF4444' },
            { type: 'Robbery', color: '#F59E0B' }, { type: 'Cyber Crime', color: '#8B5CF6' }, { type: 'NDPS', color: '#EC4899' },
          ].map(item => (
            <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontSize: '12px', color: textMuted }}>{item.type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div style={{ flex: 1, position: 'relative' }}>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating stats */}
        <div style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 1000,
          background: cardBg, backdropFilter: 'blur(12px)',
          border: `1px solid ${cardBorder}`, borderRadius: '12px',
          padding: '12px 16px', display: 'flex', gap: '20px',
        }}>
          {[
            { label: 'Incidents', value: CRIME_MARKERS.length, icon: AlertTriangle, color: '#EF4444' },
            { label: 'Patrols', value: PATROL_UNITS.length, icon: Truck, color: '#10B981' },
            { label: 'CCTV', value: CCTV_NODES.length, icon: Camera, color: '#F59E0B' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <stat.icon size={14} style={{ color: stat.color, margin: '0 auto 4px' }} />
              <div style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'Montserrat', color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '10px', color: textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Time range badge */}
        <div style={{
          position: 'absolute', bottom: '16px', right: '16px', zIndex: 1000,
          background: cardBg, backdropFilter: 'blur(12px)',
          border: `1px solid ${cardBorder}`, borderRadius: '8px',
          padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '12px', color: textMuted,
        }}>
          <Clock size={13} />
          Showing data: last {dayRange}
        </div>
      </div>
    </div>
  );
};

export default CrimeMap;
