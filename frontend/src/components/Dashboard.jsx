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
import MapWidget from './widgets/MapWidget';
import StatsCard from './widgets/StatsCard';
import IncidentGraph from './IncidentGraph';
import MapComponent from './MapComponent';

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
            padding: '6px 12px',
            background: isHighRank
              ? 'rgba(99, 102, 241, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
            border: isHighRank
              ? '1px solid rgba(99, 102, 241, 0.3)'
              : '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            color: isHighRank ? '#c7d2fe' : '#a7f3d0',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            {userRole || 'Guest'} Dashboard
            {isHighRank ? ' (Analytics View)' : ' (Field View)'}
          </div>

          {/* HIGH-RANK DASHBOARD: Analytics & Incident Graph */}
          {isHighRank && (
            <>
              <SearchBar />

              {/* Quick Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '24px',
              }}>
                {stats && [
                  { label: 'Total Cases', value: stats.total_cases, color: '#6366f1' },
                  { label: 'Active Incidents', value: stats.active_incidents, color: '#ec4899' },
                  { label: 'Solved Cases', value: stats.solved_cases, color: '#10b981' },
                  { label: 'Crime Hotspots', value: stats.hotspots, color: '#f59e0b' },
                ].map((stat, i) => (
                  <StatsCard key={i} {...stat} />
                ))}
              </div>

              {/* Incident Graphs & Analytics */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                backdropFilter: 'blur(10px)',
              }}>
                <h2 style={{
                  margin: '0 0 20px 0',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#f1f5f9',
                }}>
                  Incident Analytics
                </h2>
                <IncidentGraph />
              </div>

              {/* Main content grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '20px',
                marginBottom: '24px',
              }}>
                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Map Widget */}
                  <MapWidget />

                  {/* Quick Notifications */}
                  <div>
                    <h2 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
                      Quick Notifications
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { title: 'New Incident', desc: 'Case #2024-001 updated', severity: 'high' },
                        { title: 'Alert', desc: 'Suspicious activity detected', severity: 'medium' },
                        { title: 'Info', desc: 'Patrol unit 5 check-in OK', severity: 'low' },
                      ].map((notif, i) => (
                        <NotificationTile key={i} {...notif} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Recent Incidents */}
                  <div>
                    <h2 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
                      Recent Incidents
                    </h2>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '400px',
                      overflow: 'auto',
                    }}>
                      {incidentList.slice(0, 4).map((incident) => (
                        <IncidentTile key={incident.id} incident={incident} />
                      ))}
                    </div>
                  </div>

                  {/* Quick Access Cases */}
                  <div>
                    <h2 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
                      Priority Cases
                    </h2>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '300px',
                      overflow: 'auto',
                    }}>
                      {caseList.slice(0, 3).map((c) => (
                        <CaseCard key={c.id} case={c} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* LOW-RANK DASHBOARD: Field Map & Incident Management */}
          {isLowRank && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 350px',
                gap: '20px',
                height: 'calc(100vh - 200px)',
              }}>
                {/* Full-screen map */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  backdropFilter: 'blur(10px)',
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
                  {/* Quick Stats */}
                  {stats && (
                    <>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(236, 72, 153, 0.05))',
                        border: '1px solid rgba(236, 72, 153, 0.2)',
                        borderRadius: '12px',
                        padding: '16px',
                        backdropFilter: 'blur(10px)',
                      }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px' }}>Active Now</div>
                        <div style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: '700' }}>
                          {stats.active_incidents || 0}
                        </div>
                      </div>

                      <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '12px',
                        padding: '16px',
                        backdropFilter: 'blur(10px)',
                      }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '6px' }}>Resolved</div>
                        <div style={{ color: '#f1f5f9', fontSize: '28px', fontWeight: '700' }}>
                          {stats.solved_cases || 0}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Recent Incidents */}
                  <div>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>
                      My Incidents
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      maxHeight: '300px',
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
                    gap: '8px',
                  }}>
                    <button style={{
                      padding: '10px 16px',
                      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      Report Incident
                    </button>
                    <button style={{
                      padding: '10px 16px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#a5b4fc',
                      fontWeight: '600',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}>
                      Refresh Map
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
