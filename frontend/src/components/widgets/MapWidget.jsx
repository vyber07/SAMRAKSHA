import React, { useEffect, useState } from 'react';
import { hotspot } from '../../lib/api';

export default function MapWidget() {
  const [hotspots, setHotspots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHotspots();
  }, []);

  const loadHotspots = async () => {
    try {
      const res = await hotspot.list();
      setHotspots(res.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load hotspots:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      borderRadius: '16px',
      padding: '20px',
      minHeight: '300px',
    }}>
      <h2 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
        Crime Hotspots Map
      </h2>

      <div style={{
        width: '100%',
        height: '250px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(236, 72, 153, 0.1))',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(99, 102, 241, 0.2)',
      }}>
        {loading ? (
          <div style={{ color: '#cbd5e1' }}>Loading map...</div>
        ) : (
          <div style={{
            position: 'relative',
            width: '100%',
            height: '100%',
          }}>
            {/* Simple grid background */}
            <svg style={{ width: '100%', height: '100%', position: 'absolute' }}>
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>

            {/* Hotspots */}
            {hotspots.map((spot, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${20 + (i * 15)}%`,
                  top: `${30 + (i * 10)}%`,
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  border: '3px solid #f1f5f9',
                  boxShadow: '0 0 12px rgba(239, 68, 68, 0.6)',
                  transition: 'all 0.2s',
                  position: 'relative',
                }} />
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  left: '-40px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  borderRadius: '6px',
                  padding: '6px 8px',
                  fontSize: '10px',
                  color: '#cbd5e1',
                  whiteSpace: 'nowrap',
                  opacity: 0,
                  pointerEvents: 'none',
                  transition: 'opacity 0.2s',
                }}>
                  {spot.area || `Hotspot ${i + 1}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '8px',
        marginTop: '12px',
      }}>
        {hotspots.map((spot, i) => (
          <div key={i} style={{
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            fontSize: '12px',
            color: '#cbd5e1',
          }}>
            <div style={{ fontWeight: '600', marginBottom: '2px' }}>
              {spot.area || `Zone ${i + 1}`}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {spot.incidents || 0} incidents
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
