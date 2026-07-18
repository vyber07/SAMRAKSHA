import React, { useEffect, useState } from 'react';
import { incidents } from '../lib/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import SearchBar from '../components/SearchBar';

export default function IncidentsPage() {
  const [incidentsList, setIncidentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      setLoading(true);
      const res = await incidents.list(0, 50);
      setIncidentsList(res.data.items || []);
    } catch (error) {
      console.error('Failed to load incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    const colors = { critical: '#dc2626', high: '#f97316', medium: '#64748b', low: '#16a34a' };
    return colors[severity?.toLowerCase()] || '#2563eb';
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onRefresh={loadIncidents} />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 100%)' }}>
          <div style={{ marginBottom: '24px' }} className="fade-in">
            <h1 className="heading-md" style={{ marginBottom: '8px' }}>Active Incidents</h1>
            <p className="body-md" style={{ color: 'var(--light-text-secondary)' }}>Real-time incident tracking and response</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <SearchBar placeholder="Search incidents by title, location, or type..." />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--light-text-secondary)' }}>
              <div className="pulse" style={{ display: 'inline-block' }}>Loading incidents...</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {incidentsList.length === 0 ? (
                <div className="glass" style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--light-text-secondary)',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛡️</div>
                  <p className="body-lg">No active incidents</p>
                  <p className="body-md">All systems operational</p>
                </div>
              ) : (
                incidentsList.map((incident, idx) => {
                  const sevColor = getSeverityColor(incident.severity);
                  return (
                    <div
                      key={incident.id}
                      className="glass slide-up"
                      style={{
                        padding: '20px',
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: '4px 1fr auto',
                        gap: '16px',
                        alignItems: 'start',
                        overflow: 'hidden',
                        animationDelay: `${idx * 50}ms`,
                        borderLeft: `4px solid ${sevColor}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px) translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 12px 32px ${sevColor}25`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0) translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div />
                      <div>
                        <h3 className="heading-sm" style={{ margin: '0 0 8px 0' }}>
                          {incident.title || `Incident #${incident.id}`}
                        </h3>
                        <p className="body-md" style={{ color: 'var(--light-text-secondary)', margin: '0 0 12px 0' }}>
                          {incident.description || 'No description'}
                        </p>
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                          <div className="body-md" style={{ color: 'var(--light-text-secondary)' }}>
                            <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '4px' }}>Location</div>
                            {incident.location || 'Unknown'}
                          </div>
                          <div className="body-md" style={{ color: 'var(--light-text-secondary)' }}>
                            <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '4px' }}>Time</div>
                            {new Date(incident.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div
                        className="transition-short"
                        style={{
                          padding: '8px 16px',
                          borderRadius: 'var(--radius-12)',
                          background: `${sevColor}20`,
                          color: sevColor,
                          fontSize: '12px',
                          fontWeight: '600',
                          border: `1px solid ${sevColor}40`,
                          whiteSpace: 'nowrap',
                          height: 'fit-content',
                        }}
                      >
                        {incident.severity?.toUpperCase() || 'MEDIUM'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
