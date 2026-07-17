import React, { useEffect, useState } from 'react';
import { analytics } from '../lib/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analytics.dashboard();
      setStats(res.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockData = (baseValue) => {
    return Array(12).fill(0).map((_, i) => baseValue + Math.random() * 20 - 10);
  };

  const renderSparkline = (data, color) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const normalized = data.map(v => (v - min) / range);
    const pointSpacing = 100 / (data.length - 1);
    let pathData = `M 0,${100 - normalized[0] * 100}`;
    for (let i = 1; i < data.length; i++) {
      pathData += ` L ${i * pointSpacing},${100 - normalized[i] * 100}`;
    }
    return (
      <svg viewBox="0 0 100 100" style={{ height: '40px', width: '100%' }}>
        <path d={pathData} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathData + ' L 100,100 L 0,100 Z'} fill={`${color}20`} opacity="0.4" />
      </svg>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="pulse" style={{ color: 'var(--light-text-secondary)' }}>Loading analytics...</div>
        </div>
      </div>
    );
  }

  const casesData = generateMockData(stats?.total_cases || 50);
  const incidentsData = generateMockData(stats?.active_incidents || 30);
  const solvedData = generateMockData(stats?.solved_cases || 40);
  const closureRate = stats?.solved_cases && stats?.total_cases
    ? Math.round((stats.solved_cases / stats.total_cases) * 100)
    : 0;

  const statsCards = [
    { label: 'Total Cases', value: stats?.total_cases, color: '#6366f1', trend: '+5%', data: casesData },
    { label: 'Active Incidents', value: stats?.active_incidents, color: '#ec4899', trend: '-2%', data: incidentsData },
    { label: 'Solved Cases', value: stats?.solved_cases, color: '#10b981', trend: '+12%', data: solvedData },
    { label: 'Closure Rate', value: `${closureRate}%`, color: '#f59e0b', trend: '+3%', data: null },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onRefresh={loadAnalytics} />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 100%)' }}>
          <div style={{ marginBottom: '32px' }} className="fade-in">
            <h1 className="heading-md" style={{ marginBottom: '8px' }}>Analytics & Insights</h1>
            <p className="body-md" style={{ color: 'var(--light-text-secondary)' }}>Crime statistics and incident trends</p>
          </div>

          {/* Key Metrics - Stocks Style */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}>
            {statsCards.map((card, i) => (
              <div
                key={i}
                className="glass slide-up"
                style={{
                  padding: '24px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  animationDelay: `${i * 50}ms`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = `0 12px 32px ${card.color}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px',
                }}>
                  <div>
                    <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '8px' }}>
                      {card.label}
                    </div>
                    <div style={{
                      fontSize: '32px',
                      fontWeight: '700',
                      color: card.color,
                    }}>
                      {card.value || 0}
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-8)',
                    background: card.trend.startsWith('+') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: card.trend.startsWith('+') ? '#10b981' : '#ef4444',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {card.trend}
                  </div>
                </div>
                {card.data && renderSparkline(card.data, card.color)}
              </div>
            ))}
          </div>

          {/* Performance Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            {/* Closure Rate Card */}
            <div className="glass fade-in" style={{
              padding: '24px',
              borderLeft: '4px solid #6366f1',
            }}>
              <h3 className="heading-sm" style={{ marginBottom: '16px' }}>Closure Rate</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '40px',
                  fontWeight: '700',
                  color: '#6366f1',
                  marginBottom: '8px',
                }}>
                  {closureRate}%
                </div>
                <p className="body-md" style={{ color: 'var(--light-text-secondary)', margin: 0 }}>
                  {stats?.solved_cases} of {stats?.total_cases} cases resolved
                </p>
              </div>
              <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(99, 102, 241, 0.2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #a5b4fc)',
                  width: `${closureRate}%`,
                  borderRadius: '2px',
                }} />
              </div>
            </div>

            {/* Response Time Card */}
            <div className="glass fade-in" style={{
              padding: '24px',
              borderLeft: '4px solid #ec4899',
            }}>
              <h3 className="heading-sm" style={{ marginBottom: '16px' }}>Avg Response Time</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '40px',
                  fontWeight: '700',
                  color: '#ec4899',
                  marginBottom: '8px',
                }}>
                  ~15 min
                </div>
                <p className="body-md" style={{ color: 'var(--light-text-secondary)', margin: 0 }}>
                  <span style={{ color: '#10b981' }}>↓ 2 min</span> from last week
                </p>
              </div>
              <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(236, 72, 153, 0.2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #ec4899, #f472b6)',
                  width: '65%',
                  borderRadius: '2px',
                }} />
              </div>
            </div>

            {/* Active Stations Card */}
            <div className="glass fade-in" style={{
              padding: '24px',
              borderLeft: '4px solid #10b981',
            }}>
              <h3 className="heading-sm" style={{ marginBottom: '16px' }}>Active Stations</h3>
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '40px',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '8px',
                }}>
                  12
                </div>
                <p className="body-md" style={{ color: 'var(--light-text-secondary)', margin: 0 }}>
                  All stations operational
                </p>
              </div>
              <div style={{ height: '4px', borderRadius: '2px', background: 'rgba(16, 185, 129, 0.2)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  background: 'linear-gradient(90deg, #10b981, #6ee7b7)',
                  width: '100%',
                  borderRadius: '2px',
                }} />
              </div>
            </div>
          </div>

          {/* Incident Breakdown */}
          <div className="glass fade-in" style={{ padding: '24px' }}>
            <h2 className="heading-sm" style={{ marginBottom: '24px' }}>Incident Breakdown</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '16px',
            }}>
              {[
                { type: 'Theft', count: 145, color: '#6366f1' },
                { type: 'Assault', count: 78, color: '#ec4899' },
                { type: 'Robbery', count: 42, color: '#ef4444' },
                { type: 'Vandalism', count: 89, color: '#f59e0b' },
              ].map((incident, i) => (
                <div key={i} style={{
                  padding: '16px',
                  background: `${incident.color}10`,
                  borderRadius: 'var(--radius-12)',
                  border: `1px solid ${incident.color}30`,
                }}>
                  <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '8px' }}>
                    {incident.type}
                  </div>
                  <div style={{
                    fontSize: '24px',
                    fontWeight: '700',
                    color: incident.color,
                  }}>
                    {incident.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
