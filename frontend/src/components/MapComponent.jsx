import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { hotspot } from '../lib/api';

const SEVERITY_COLORS = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#ea580c',
  low: '#64748b',
};

export default function MapComponent({ height = '100%', filterSeverity = 'All' }) {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await hotspot.incidents();
        const raw = Array.isArray(res.data) ? res.data : res.data?.items || [];
        const cleaned = raw
          .map((m) => ({
            lat: Number(m.lat ?? m.latitude),
            lon: Number(m.lon ?? m.lng ?? m.longitude),
            type: m.type || m.crime_type || 'Incident',
            severity: String(m.severity || 'low').toLowerCase(),
            location: m.location || m.ward || '',
          }))
          .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lon));
        setMarkers(cleaned);
      } catch (e) {
        setMarkers([]);
      }
    })();
  }, []);

  const visible = markers.filter(
    (m) => filterSeverity === 'All' || m.severity === filterSeverity.toLowerCase()
  );

  return (
    <div style={{ height, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
      <MapContainer center={[23.0225, 72.5714]} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {visible.map((m, i) => (
          <CircleMarker
            key={i}
            center={[m.lat, m.lon]}
            radius={10}
            pathOptions={{
              color: SEVERITY_COLORS[m.severity] || SEVERITY_COLORS.low,
              fillColor: SEVERITY_COLORS[m.severity] || SEVERITY_COLORS.low,
              fillOpacity: 0.55,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                <strong>{m.type}</strong><br />
                {m.location && <>📍 {m.location}<br /></>}
                Severity: <span style={{ color: SEVERITY_COLORS[m.severity], fontWeight: 700, textTransform: 'uppercase' }}>{m.severity}</span>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
