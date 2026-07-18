import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useDashboardStore } from '../lib/store';
import { analytics, incidents, cases, hotspot } from '../lib/api';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import SearchBar from './SearchBar';
import IncidentTile from './widgets/IncidentTile';
import CaseCard from './widgets/CaseCard';
import NotificationTile from './widgets/NotificationTile';
import StatsCard from './widgets/StatsCard';
import IncidentGraph from './IncidentGraph';
import MapComponent from './MapComponent';
import CaseChartsPanel from './charts/CaseChartsPanel';

// Material 3 Color Palette
const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  tertiary: '#f97316',
  success: '#16a34a',
  warning: '#ea580c',
  error: '#dc2626',
  info: '#0284c7',
  // Glass morphism
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(148, 163, 184, 0.12)',
};

// Shared Glass Card Style
const glassCardStyle = {
  background: COLORS.glass,
  border: `1px solid ${COLORS.glassBorder}`,
  borderRadius: '16px',
  backdropFilter: 'blur(12px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

// Stats Card Component (Material 3 Style)
const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
  <div style={{
    ...glassCardStyle,
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    cursor: 'pointer',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
    e.currentTarget.style.background = `rgba(255, 255, 255, 0.08)`;
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.background = COLORS.glass;
  }}>
    {/* Accent line */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: `linear-gradient(90deg, ${color}, transparent)`,
    }} />

    {/* Icon */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background: `rgba(${parseInt(color.slice(1, 3), 16)}, ${parseInt(color.slice(3, 5), 16)}, ${parseInt(color.slice(5, 7), 16)}, 0.1)`,
      marginBottom: '12px',
    }}>
      <span style={{ fontSize: '24px', color }}>{Icon}</span>
    </div>

    {/* Label */}
    <div style={{
      fontSize: '12px',
      color: '#94a3b8',
      marginBottom: '8px',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      fontWeight: '500',
    }}>
      {label}
    </div>

    {/* Value */}
    <div style={{
      fontSize: '32px',
      fontWeight: '700',
      color: '#f1f5f9',
      marginBottom: '4px',
    }}>
      {value}
    </div>

    {/* Subtext */}
    {subtext && (
      <div style={{
        fontSize: '11px',
        color: '#64748b',
        fontWeight: '500',
      }}>
        {subtext}
      </div>
    )}
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const userRole = useAuthStore((state) => state.userRole);
  const { incidents: incidentList, cases: caseList } = useDashboardStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapData, setMapData] = useState({ incidents: [], patrols: [], hotspots: [] });

  const isHighRank = ['admin', 'sho', 'dcp'].includes(userRole);
  const isLowRank = ['io', 'constable'].includes(userRole);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    loadDashboardData();
  }, [token, navigate]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const requests = [
        analytics.dashboard(),
        incidents.list(0, 10),
        cases.list(0, 10),
      ];

      // Add map data requests for low-rank officers
      if (isLowRank) {
        requests.push(hotspot.list());
      }

      const results = await Promise.all(requests);
      const [analyticsRes, incidentsRes, casesRes, hotspotsRes] = results;

      setStats(analyticsRes.data);
      useDashboardStore.setState({
        incidents: incidentsRes.data.items || [],
        cases: casesRes.data.items || [],
      });

      // Set map data for low-rank officers
      if (isLowRank && hotspotsRes) {
        setMapData({
          incidents: incidentsRes.data.items || [],
          patrols: [],
          hotspots: hotspotsRes.data || [],
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'var(--dark-bg)',
      color: 'var(--light-text)',
    }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onRefresh={loadDashboardData} />
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '24px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 100%)',
        }}>
          {/* Role Badge */}
          <div style={{
            display: 'inline-block',
            padding: '8px 14px',
            background: `rgba(${parseInt(COLORS.primary.slice(1, 3), 16)}, ${parseInt(COLORS.primary.slice(3, 5), 16)}, ${parseInt(COLORS.primary.slice(5, 7), 16)}, 0.1)`,
            border: `1px solid rgba(${parseInt(COLORS.primary.slice(1, 3), 16)}, ${parseInt(COLORS.primary.slice(3, 5), 16)}, ${parseInt(COLORS.primary.slice(5, 7), 16)}, 0.25)`,
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#a5b4fc',
            marginBottom: '24px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {userRole || 'Guest'} Dashboard
          </div>

          {/* HIGH-RANK DASHBOARD: New Material 3 Design */}
          {isHighRank && (
            <>
              {/* TOP ROW: 6 Quick Access Stats Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '28px',
              }}>
                {stats ? (
                  <>
                    <StatCard
                      icon="📋"
                      label="New Cases"
                      value={stats.total_cases || 0}
                      color={COLORS.primary}
                      subtext="This month"
                    />
                    <StatCard
                      icon="✓"
                      label="Solved Cases"
                      value={stats.solved_cases || 0}
                      color={COLORS.success}
                      subtext="Completed"
                    />
                    <StatCard
                      icon="📂"
                      label="Open Cases"
                      value={Math.max(0, (stats.total_cases || 0) - (stats.solved_cases || 0))}
                      color={COLORS.info}
                      subtext="Active"
                    />
                    <StatCard
                      icon="⚙️"
                      label="In Progress"
                      value={stats.active_incidents || 0}
                      color={COLORS.secondary}
                      subtext="Being processed"
                    />
                    <StatCard
                      icon="⏳"
                      label="Pending Review"
                      value={Math.max(0, (stats.total_cases || 0) - (stats.solved_cases || 0) - (stats.active_incidents || 0))}
                      color={COLORS.warning}
                      subtext="Awaiting approval"
                    />
                    <StatCard
                      icon="🔒"
                      label="Closed Cases"
                      value={stats.hotspots || 0}
                      color={COLORS.tertiary}
                      subtext="Archived"
                    />
                  </>
                ) : (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                    Loading statistics...
                  </div>
                )}
              </div>

              {/* CHARTS SECTION: Case Analytics */}
              <div style={{
                marginBottom: '28px',
              }}>
                <CaseChartsPanel cases={caseList} />
              </div>

              {/* MIDDLE SECTION: 50/50 Layout - Graph & Search */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '28px',
              }}>
                {/* Left side: Incident Analytics Graph */}
                <div style={{
                  ...glassCardStyle,
                  padding: '24px',
                }}>
                  <h2 style={{
                    margin: '0 0 20px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '20px' }}>📊</span>
                    Incident Analytics
                  </h2>
                  <div style={{ minHeight: '300px' }}>
                    <IncidentGraph />
                  </div>
                </div>

                {/* Right side: Search & Quick Actions */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}>
                  {/* Bing-style Search Bar (self-contained prominent surface) */}
                  <SearchBar />

                  {/* Quick Action Cards */}
                  <div style={{
                    ...glassCardStyle,
                    padding: '20px',
                    flex: 1,
                  }}>
                    <h3 style={{
                      margin: '0 0 16px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#f1f5f9',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Quick Actions
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}>
                      <button style={{
                        padding: '12px 16px',
                        background: `linear-gradient(135deg, ${COLORS.primary}, #1e40af)`,
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = `0 8px 16px rgba(37, 99, 235, 0.3)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}>
                        + New Case
                      </button>
                      <button style={{
                        padding: '12px 16px',
                        background: `rgba(100, 116, 139, 0.1)`,
                        border: `1.5px solid ${COLORS.secondary}`,
                        borderRadius: '12px',
                        color: '#cbd5e1',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `rgba(100, 116, 139, 0.15)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `rgba(100, 116, 139, 0.1)`;
                      }}>
                        Report Issue
                      </button>
                      <button style={{
                        padding: '12px 16px',
                        background: `rgba(249, 115, 22, 0.1)`,
                        border: `1.5px solid ${COLORS.tertiary}`,
                        borderRadius: '12px',
                        color: '#fed7aa',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `rgba(249, 115, 22, 0.15)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `rgba(249, 115, 22, 0.1)`;
                      }}>
                        View Analytics
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM SECTION: Incidents & Notifications Side by Side */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '24px',
              }}>
                {/* Left: Recent Incidents */}
                <div style={{
                  ...glassCardStyle,
                  padding: '24px',
                }}>
                  <h2 style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '18px' }}>🚨</span>
                    Recent Incidents
                  </h2>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '320px',
                    overflow: 'auto',
                  }}>
                    {incidentList.length > 0 ? (
                      incidentList.slice(0, 5).map((incident) => (
                        <IncidentTile key={incident.id} incident={incident} />
                      ))
                    ) : (
                      <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                        No incidents
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Notifications & Alerts */}
                <div style={{
                  ...glassCardStyle,
                  padding: '24px',
                }}>
                  <h2 style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: '700',
                    color: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}>
                    <span style={{ fontSize: '18px' }}>🔔</span>
                    Alerts & Notifications
                  </h2>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '320px',
                    overflow: 'auto',
                  }}>
                    {[
                      { title: 'New Incident', desc: 'Case #2024-001 updated', severity: 'high' },
                      { title: 'Alert', desc: 'Suspicious activity detected at Sector 5', severity: 'medium' },
                      { title: 'Info', desc: 'Patrol unit 5 check-in OK', severity: 'low' },
                      { title: 'Priority', desc: 'Follow-up required on Case #2024-002', severity: 'high' },
                      { title: 'Update', desc: 'Database sync completed', severity: 'low' },
                    ].map((notif, i) => (
                      <NotificationTile key={i} {...notif} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px',
              }}>
                <button style={{
                  padding: '14px 16px',
                  background: COLORS.glass,
                  border: `1px solid ${COLORS.glassBorder}`,
                  borderRadius: '12px',
                  color: '#94a3b8',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(255, 255, 255, 0.08)`;
                  e.currentTarget.style.color = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.glass;
                  e.currentTarget.style.color = '#94a3b8';
                }}>
                  📥 Import Data
                </button>
                <button style={{
                  padding: '14px 16px',
                  background: COLORS.glass,
                  border: `1px solid ${COLORS.glassBorder}`,
                  borderRadius: '12px',
                  color: '#94a3b8',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(255, 255, 255, 0.08)`;
                  e.currentTarget.style.color = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.glass;
                  e.currentTarget.style.color = '#94a3b8';
                }}>
                  📊 Export Report
                </button>
                <button style={{
                  padding: '14px 16px',
                  background: COLORS.glass,
                  border: `1px solid ${COLORS.glassBorder}`,
                  borderRadius: '12px',
                  color: '#94a3b8',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(255, 255, 255, 0.08)`;
                  e.currentTarget.style.color = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.glass;
                  e.currentTarget.style.color = '#94a3b8';
                }}>
                  🔄 Sync Data
                </button>
                <button style={{
                  padding: '14px 16px',
                  background: COLORS.glass,
                  border: `1px solid ${COLORS.glassBorder}`,
                  borderRadius: '12px',
                  color: '#94a3b8',
                  fontWeight: '600',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(255, 255, 255, 0.08)`;
                  e.currentTarget.style.color = '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = COLORS.glass;
                  e.currentTarget.style.color = '#94a3b8';
                }}>
                  ⚙️ Settings
                </button>
              </div>
            </>
          )}

          {/* LOW-RANK DASHBOARD: Field Map & Incident Management */}
          {isLowRank && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 380px',
                gap: '20px',
                height: 'calc(100vh - 200px)',
              }}>
                {/* Full-screen map */}
                <div style={{
                  ...glassCardStyle,
                  overflow: 'hidden',
                }}>
                  <MapComponent
                    incidents={mapData.incidents}
                    hotspots={mapData.hotspots}
                    patrols={mapData.patrols}
                    showIncidents={true}
                    showHotspots={true}
                    showPatrols={false}
                  />
                </div>

                {/* Right sidebar */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  overflow: 'auto',
                }}>
                  {/* Bing-style Search Bar */}
                  <SearchBar />

                  {/* Quick Stats */}
                  {stats && (
                    <>
                      <StatCard
                        icon="🔴"
                        label="Active Incidents"
                        value={stats.active_incidents || 0}
                        color={COLORS.error}
                        subtext="Right now"
                      />
                      <StatCard
                        icon="✅"
                        label="Resolved Today"
                        value={stats.solved_cases || 0}
                        color={COLORS.success}
                        subtext="Completed"
                      />
                    </>
                  )}

                  {/* Recent Incidents */}
                  <div style={{
                    ...glassCardStyle,
                    padding: '16px',
                    flex: 1,
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: '600', color: '#f1f5f9', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      My Incidents
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '280px',
                      overflow: 'auto',
                    }}>
                      {incidentList.slice(0, 5).map((incident) => (
                        <IncidentTile key={incident.id} incident={incident} />
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}>
                    <button style={{
                      padding: '12px 16px',
                      background: `linear-gradient(135deg, ${COLORS.primary}, #1e40af)`,
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      🚨 Report Incident
                    </button>
                    <button style={{
                      padding: '12px 16px',
                      background: `rgba(${parseInt(COLORS.secondary.slice(1, 3), 16)}, ${parseInt(COLORS.secondary.slice(3, 5), 16)}, ${parseInt(COLORS.secondary.slice(5, 7), 16)}, 0.1)`,
                      border: `1.5px solid ${COLORS.secondary}`,
                      borderRadius: '12px',
                      color: '#cbd5e1',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      🔄 Refresh Map
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
