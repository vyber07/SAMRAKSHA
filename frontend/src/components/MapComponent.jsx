import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Circle, Polygon, Popup } from 'react-leaflet';
import { hotspot } from '../lib/api';
import { normalizeSeverity, SEVERITY_COLORS } from '../utils/severity';

const WARD_COORDINATES = {
  'Satellite':   [23.0300, 72.5100],
  'Bodakdev':    [23.0470, 72.5060],
  'Vastrapur':   [23.0370, 72.5290],
  'Ambawadi':    [23.0200, 72.5510],
  'Navrangpura': [23.0270, 72.5620],
  'Maninagar':   [22.9890, 72.6030],
  'Vatwa':       [22.9720, 72.6380],
  'Gomtipur':    [23.0380, 72.6260],
  'Jamalpur':    [23.0370, 72.6050],
  'Kalupur':     [23.0240, 72.5990],
  'Shahibaug':   [23.0600, 72.5900],
  'Chandkheda':  [23.1010, 72.5870],
  'Bopal':       [23.0170, 72.4680],
  'Ghatlodiya':  [23.0670, 72.5540],
  'Ghatlodia':   [23.0670, 72.5540],
  'Naranpura':   [23.0530, 72.5550],
  'Ellisbridge': [23.0225, 72.5714],
  'Danilimda':   [22.9960, 72.5820],
  'Isanpur':     [22.9780, 72.5950],
  'Odhav':       [23.0280, 72.6510],
  'Vastral':     [23.0040, 72.6450],
  'Bapunagar':   [23.0420, 72.6350],
};

function generateWardPolygon([lat, lon], rLat = 0.009, rLon = 0.011) {
  const points = [];
  const numSides = 8;
  for (let i = 0; i < numSides; i++) {
    const angle = (i * 2 * Math.PI) / numSides;
    points.push([
      lat + rLat * Math.sin(angle),
      lon + rLon * Math.cos(angle)
    ]);
  }
  return points;
}

function getRiskStyle(score, level) {
  const lev = String(level || '').toUpperCase();
  if (score >= 80 || lev === 'HIGH') {
    return { fillColor: '#dc2626', color: '#b91c1c', fillOpacity: 0.28, weight: 2 };
  }
  if (score >= 60 || lev === 'ELEVATED') {
    return { fillColor: '#f97316', color: '#c2410c', fillOpacity: 0.24, weight: 2 };
  }
  if (score >= 30 || lev === 'MEDIUM') {
    return { fillColor: '#eab308', color: '#a16207', fillOpacity: 0.18, weight: 2 };
  }
  return { fillColor: '#22c55e', color: '#15803d', fillOpacity: 0.14, weight: 2 };
}

function getHeatmapColor(intensity) {
  if (intensity > 0.75) return '#dc2626';
  if (intensity > 0.50) return '#f97316';
  if (intensity > 0.25) return '#eab308';
  return '#3b82f6';
}

export default function MapComponent({ height = '100%', filterSeverity = 'All' }) {
  const [markers, setMarkers] = useState([]);
  const [wardData, setWardData] = useState({});
  const [heatmapData, setHeatmapData] = useState({ heatmap: [], clusters: [] });
  const [cyberData, setCyberData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Layer Visibility Controls
  const [showIncidents, setShowIncidents] = useState(true);
  const [showWards, setShowWards] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showCyber, setShowCyber] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const [incRes, wardRes, heatRes, cyberRes] = await Promise.allSettled([
          hotspot.incidents(),
          hotspot.wards(),
          hotspot.hotspots(30),
          hotspot.cybercrime(30),
        ]);

        if (!isMounted) return;

        if (incRes.status === 'fulfilled') {
          const raw = Array.isArray(incRes.value.data)
            ? incRes.value.data
            : incRes.value.data?.items || [];
          const cleaned = raw
            .map((m) => ({
              lat: Number(m.lat ?? m.latitude),
              lon: Number(m.lon ?? m.lng ?? m.longitude),
              type: m.type || m.crime_type || 'Incident',
              severity: normalizeSeverity(m.severity),
              location: m.location || m.ward || '',
            }))
            .filter((m) => Number.isFinite(m.lat) && Number.isFinite(m.lon));
          setMarkers(cleaned);
        }

        if (wardRes.status === 'fulfilled') {
          setWardData(wardRes.value.data || {});
        }

        if (heatRes.status === 'fulfilled') {
          setHeatmapData(heatRes.value.data || { heatmap: [], clusters: [] });
        }

        if (cyberRes.status === 'fulfilled') {
          const raw = Array.isArray(cyberRes.value.data) ? cyberRes.value.data : [];
          const cleaned = raw
            .map((c) => ({
              lat: Number(c.lat),
              lon: Number(c.lon),
              ward: c.ward,
              type: c.crime_type || 'Cybercrime',
              count: c.count || 1,
              latest: c.latest,
            }))
            .filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon));
          setCyberData(cleaned);
        }
      } catch (e) {
        console.error('Failed to load map overlays', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const visibleMarkers = markers.filter(
    (m) => filterSeverity === 'All' || m.severity === filterSeverity.toLowerCase()
  );

  return (
    <div style={{ height, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Map Control Bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '8px 14px', background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        fontSize: 12, zIndex: 10, fontFamily: 'var(--font-mono)'
      }}>
        <span style={{ fontWeight: 700, color: 'var(--text)', marginRight: 4 }}>Layers:</span>
        <button
          onClick={() => setShowIncidents(!showIncidents)}
          style={{
            padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            border: `1px solid ${showIncidents ? 'var(--primary)' : 'var(--border)'}`,
            background: showIncidents ? 'var(--primary)' : 'transparent',
            color: showIncidents ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          📍 Incidents ({visibleMarkers.length})
        </button>
        <button
          onClick={() => setShowWards(!showWards)}
          style={{
            padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            border: `1px solid ${showWards ? 'var(--tertiary)' : 'var(--border)'}`,
            background: showWards ? 'var(--tertiary)' : 'transparent',
            color: showWards ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          🛡️ Ward Risk ({Object.keys(wardData).length})
        </button>
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          style={{
            padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            border: `1px solid ${showHeatmap ? 'var(--error)' : 'var(--border)'}`,
            background: showHeatmap ? 'var(--error)' : 'transparent',
            color: showHeatmap ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          🔴 Density Heatmap ({heatmapData.heatmap?.length || 0})
        </button>
        <button
          onClick={() => setShowCyber(!showCyber)}
          style={{
            padding: '4px 10px', borderRadius: 4, cursor: 'pointer',
            border: `1px solid ${showCyber ? '#06b6d4' : 'var(--border)'}`,
            background: showCyber ? '#06b6d4' : 'transparent',
            color: showCyber ? '#fff' : 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          💻 Cybercrime ({cyberData.length})
        </button>
        {loading && <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>Loading map layers…</span>}
      </div>

      <MapContainer center={[23.0225, 72.5714]} zoom={12} style={{ flex: 1, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Ward Risk Polygons */}
        {showWards && Object.entries(wardData).map(([wardName, data]) => {
          const coords = WARD_COORDINATES[wardName];
          if (!coords) return null;
          const polyCoords = generateWardPolygon(coords);
          const style = getRiskStyle(data.risk_score, data.level);
          return (
            <Polygon
              key={`ward-${wardName}`}
              positions={polyCoords}
              pathOptions={style}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                  <strong style={{ fontSize: 14 }}>🛡️ Ward: {wardName}</strong><br />
                  Risk Score: <strong style={{ color: style.color }}>{data.risk_score} / 100</strong> ({data.level})<br />
                  {data.festival_flag && <span style={{ color: '#eab308', fontWeight: 700 }}>⚡ Festival Surge Active</span>}
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* 2. Density Heatmap Overlay */}
        {showHeatmap && (heatmapData.heatmap || []).map((pt, i) => (
          <Circle
            key={`heat-${i}`}
            center={[pt.lat, pt.lon]}
            radius={250 + pt.intensity * 350}
            pathOptions={{
              color: getHeatmapColor(pt.intensity),
              fillColor: getHeatmapColor(pt.intensity),
              fillOpacity: 0.25 + pt.intensity * 0.35,
              stroke: false,
            }}
          />
        ))}

        {/* 3. DBSCAN Cluster Highlight Rings */}
        {showHeatmap && (heatmapData.clusters || []).map((cl, i) => (
          <CircleMarker
            key={`cluster-${i}`}
            center={[cl.center_lat, cl.center_lon]}
            radius={18 + Math.min(cl.point_count * 2, 20)}
            pathOptions={{
              color: '#dc2626',
              fillColor: '#dc2626',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '4, 4',
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                <strong style={{ color: '#dc2626' }}>🔥 Hotspot Cluster #{cl.cluster_id}</strong><br />
                Incident Density: <strong>{cl.point_count} incidents</strong>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* 4. Cybercrime Hotspot Markers */}
        {showCyber && cyberData.map((c, i) => (
          <CircleMarker
            key={`cyber-${i}`}
            center={[c.lat, c.lon]}
            radius={12}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#0891b2',
              fillOpacity: 0.7,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                <strong style={{ color: '#06b6d4' }}>💻 Cybercrime Hotspot</strong><br />
                Type: <strong>{c.type}</strong><br />
                Ward: {c.ward || 'Unknown'}<br />
                Total Complaints: <strong>{c.count}</strong>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* 5. Incident Markers */}
        {showIncidents && visibleMarkers.map((m, i) => (
          <CircleMarker
            key={`inc-${i}`}
            center={[m.lat, m.lon]}
            radius={10}
            pathOptions={{
              color: SEVERITY_COLORS[m.severity] || SEVERITY_COLORS.low,
              fillColor: SEVERITY_COLORS[m.severity] || SEVERITY_COLORS.low,
              fillOpacity: 0.75,
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
