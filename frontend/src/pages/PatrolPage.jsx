import React, { useEffect, useState } from 'react';
import { patrol } from '../lib/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function PatrolPage() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatrols();
  }, []);

  const loadPatrols = async () => {
    try {
      setLoading(true);
      const res = await patrol.list();
      setUnits(res.data);
    } catch (error) {
      console.error('Failed to load patrol data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = { active: '#10b981', idle: '#f59e0b', responding: '#ec4899', offline: '#ef4444' };
    return colors[status?.toLowerCase()] || '#6366f1';
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onRefresh={loadPatrols} />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 100%)' }}>
          <div style={{ marginBottom: '24px' }} className="fade-in">
            <h1 className="heading-md" style={{ marginBottom: '8px' }}>Patrol Units</h1>
            <p className="body-md" style={{ color: 'var(--light-text-secondary)' }}>Real-time patrol unit tracking and status</p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--light-text-secondary)' }}>
              <div className="pulse" style={{ display: 'inline-block' }}>Loading patrol units...</div>
            </div>
          ) : units.length === 0 ? (
            <div className="glass" style={{
              padding: '48px 24px',
              textAlign: 'center',
              color: 'var(--light-text-secondary)',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚔</div>
              <p className="body-lg">No patrol units available</p>
              <p className="body-md">Check back soon for active units</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {units.map((unit, i) => {
                const statusColor = getStatusColor(unit.status);
                const isActive = unit.status?.toLowerCase() === 'active' || unit.status?.toLowerCase() === 'responding';
                return (
                  <div
                    key={i}
                    className="glass slide-up"
                    style={{
                      padding: '20px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                      animationDelay: `${i * 50}ms`,
                      borderTop: `2px solid ${statusColor}`,
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
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}>
                      <h3 className="heading-sm" style={{ margin: 0 }}>
                        Unit {unit.unit_number || i + 1}
                      </h3>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-8)',
                        background: `${statusColor}20`,
                        border: `1px solid ${statusColor}40`,
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: statusColor,
                          animation: isActive ? 'pulse 2s infinite' : 'none',
                        }} />
                        <span className="label-sm" style={{ color: statusColor, margin: 0 }}>
                          {unit.status?.toUpperCase() || 'ACTIVE'}
                        </span>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                      marginBottom: '16px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    }}>
                      <div>
                        <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '6px' }}>Officer</div>
                        <div className="body-md" style={{ color: 'var(--light-text)' }}>{unit.officer_name || '—'}</div>
                      </div>
                      <div>
                        <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '6px' }}>Vehicle</div>
                        <div className="body-md" style={{ color: 'var(--light-text)' }}>{unit.vehicle_number || '—'}</div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '16px',
                    }}>
                      <div>
                        <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '6px' }}>Location</div>
                        <div className="body-md" style={{ color: 'var(--light-text)' }}>{unit.current_location || 'Unknown'}</div>
                      </div>
                      <div>
                        <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '6px' }}>Last Update</div>
                        <div className="body-md" style={{ color: 'var(--light-text)' }}>
                          {unit.last_update ? new Date(unit.last_update).toLocaleTimeString() : '—'}
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
