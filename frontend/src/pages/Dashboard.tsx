import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, TrendingUp, Shield, MapPin, FolderOpen, CheckCircle2,
  FilePlus, Truck, Bot, Map, Bell, Activity, Clock, Zap
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePublishedPage } from '../hooks/usePublishedPage';
import { PublishedPageRenderer } from '../editor/PublishedPageRenderer';

// --- DATA ---
const hourlyData = [
  { hour: '00', incidents: 2 }, { hour: '02', incidents: 1 }, { hour: '04', incidents: 1 },
  { hour: '06', incidents: 3 }, { hour: '08', incidents: 7 }, { hour: '10', incidents: 11 },
  { hour: '12', incidents: 9 }, { hour: '14', incidents: 13 }, { hour: '16', incidents: 14 },
  { hour: '18', incidents: 17 }, { hour: '20', incidents: 15 }, { hour: '22', incidents: 8 },
];

const crimeCategories = [
  { name: 'Theft', count: 38 },
  { name: 'Assault', count: 21 },
  { name: 'Robbery', count: 14 },
  { name: 'Cyber Crime', count: 19 },
  { name: 'Traffic', count: 29 },
  { name: 'NDPS', count: 8 },
];

const wardRiskData = [
  { ward: 'Satellite', risk: 82 },
  { ward: 'Naranpura', risk: 67 },
  { ward: 'Maninagar', risk: 74 },
  { ward: 'Bodakdev', risk: 55 },
  { ward: 'Ghatlodia', risk: 61 },
  { ward: 'Vastrapur', risk: 48 },
  { ward: 'Nikol', risk: 78 },
];

const PIE_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899'];

const TICKER_MESSAGES = [
  '🚨 PCR-11 dispatched to Satellite Ward incident — FIR 2024/SB/1187',
  '📷 CCTV Alert: Suspicious vehicle detected at SG Highway ANPR Node 4',
  '🔴 HIGH PRIORITY: Armed robbery report received — Naranpura PS',
  '✅ FIR 2024/NR/0923 chargesheeted — IO Ravi Sharma',
  '🚔 PCR-23 at Vastrapur Lake checkpoint — all clear',
  '⚠️ Predictive threat score elevated: Nikol Ward 78/100',
  '📋 New FIR registered: Cyber fraud complaint — Bodakdev PS',
  '🟢 PCR-14 back in service — SG Highway patrol resumed',
];

const metricCards = [
  { label: 'New Cases Today', value: '23', icon: FilePlus, color: '#3B82F6', trend: '+4 vs yesterday' },
  { label: 'Active Investigations', value: '147', icon: Activity, color: '#F59E0B', trend: '12 escalated' },
  { label: 'Threat Score Index', value: '84/100', icon: AlertTriangle, color: '#EF4444', trend: 'ELEVATED' },
  { label: 'High Risk Zones', value: '5', icon: MapPin, color: '#EF4444', trend: 'Nikol, Satellite...' },
  { label: 'Open Cases', value: '312', icon: FolderOpen, color: '#F59E0B', trend: '38 pending review' },
  { label: 'Closed Cases', value: '1,204', icon: CheckCircle2, color: '#10B981', trend: '+18 this week' },
];

const quickActions = [
  { label: 'Register FIR', icon: FilePlus, path: '/cases', color: '#3B82F6' },
  { label: 'Dispatch Patrol', icon: Truck, path: '/patrol', color: '#10B981' },
  { label: 'Query Legal AI', icon: Bot, path: '/ai-assistant', color: '#8B5CF6' },
  { label: 'View Threat Map', icon: Map, path: '/map', color: '#EF4444' },
];

const Dashboard: React.FC = () => {
  const publishedPage = usePublishedPage('dashboard');
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [currentTime, setCurrentTime] = useState(new Date());
  const tickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const cardBg = isDark ? 'rgba(13,27,46,0.75)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.1)' : 'rgba(255,255,255,0.8)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';
  const gridColor = isDark ? 'rgba(168,202,255,0.06)' : 'rgba(0,75,135,0.06)';
  const chartTextColor = isDark ? '#7a9cc8' : '#94a3b8';

  // ── Published override ───────────────────────────────────────────────────
  if (publishedPage) return <PublishedPageRenderer snapshot={publishedPage} />;

  return (
    <div
      style={{
        padding: '24px',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        color: textPrimary,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '22px', color: textPrimary }}>
            Command Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: textMuted, marginTop: '2px' }}>
            Welcome back, {user?.name} · {user?.station}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: cardBg,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${cardBorder}`,
              borderRadius: '10px',
              fontSize: '13px',
              fontFamily: 'JetBrains Mono',
              color: textMuted,
            }}
          >
            <Clock size={14} />
            {currentTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: '10px',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#10B981',
                display: 'inline-block',
                animation: 'livePulse 1.5s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>SYSTEMS LIVE</span>
          </div>
        </div>
      </div>

      {/* Notification ticker */}
      <div
        style={{
          background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.06)',
          border: `1px solid rgba(239,68,68,0.2)`,
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '24px',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Bell size={14} color="#EF4444" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#EF4444', letterSpacing: '0.1em' }}>LIVE</span>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div
            ref={tickerRef}
            style={{
              display: 'inline-block',
              whiteSpace: 'nowrap',
              animation: 'ticker 40s linear infinite',
              fontSize: '13px',
              color: isDark ? '#b8cef8' : '#334155',
            }}
          >
            {[...TICKER_MESSAGES, ...TICKER_MESSAGES].join('   ·   ')}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {metricCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: cardBg,
              backdropFilter: 'blur(12px)',
              border: `1px solid ${cardBorder}`,
              borderRadius: '14px',
              padding: '20px',
              boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,75,135,0.1)',
              borderLeft: `3px solid ${card.color}`,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,75,135,0.18)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,75,135,0.1)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: textMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {card.label}
              </span>
              <card.icon size={18} style={{ color: card.color, opacity: 0.8 }} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'Montserrat', color: textPrimary, lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ fontSize: '11px', color: card.color, marginTop: '8px', fontWeight: 500 }}>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div
        style={{
          background: cardBg,
          backdropFilter: 'blur(12px)',
          border: `1px solid ${cardBorder}`,
          borderRadius: '14px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,75,135,0.1)',
        }}
      >
        <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: textPrimary, marginBottom: '16px' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {quickActions.map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                padding: '20px 12px',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,75,135,0.04)',
                border: `1px solid ${isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)'}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                color: textPrimary,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,75,135,0.08)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,75,135,0.04)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${action.color}20`,
                border: `1px solid ${action.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', color: textPrimary }}>
                {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Charts grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Hourly incident chart */}
        <div style={{
          background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
          borderRadius: '14px', padding: '20px',
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,75,135,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Zap size={16} color="#3B82F6" />
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '13px', color: textPrimary }}>
              Hourly Incident Distribution (24h)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="incidentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="hour" tick={{ fill: chartTextColor, fontSize: 11 }} />
              <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#0d1b2e' : '#fff',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  color: textPrimary,
                  fontSize: '12px',
                }}
              />
              <Area type="monotone" dataKey="incidents" stroke="#3B82F6" strokeWidth={2} fill="url(#incidentGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Crime categories bar chart */}
        <div style={{
          background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
          borderRadius: '14px', padding: '20px',
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,75,135,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Shield size={16} color="#F59E0B" />
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '13px', color: textPrimary }}>
              Crime Categories Breakdown
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={crimeCategories} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fill: chartTextColor, fontSize: 10 }} />
              <YAxis tick={{ fill: chartTextColor, fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#0d1b2e' : '#fff',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  color: textPrimary,
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {crimeCategories.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ward risk + Pie chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Ward risk bars */}
        <div style={{
          background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
          borderRadius: '14px', padding: '20px',
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,75,135,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <TrendingUp size={16} color="#EF4444" />
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '13px', color: textPrimary }}>
              Ward Risk Intensity
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {wardRiskData.map(ward => (
              <div key={ward.ward} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: textMuted, minWidth: '80px', fontWeight: 500 }}>{ward.ward}</span>
                <div style={{ flex: 1, height: '8px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${ward.risk}%`,
                      background: ward.risk > 75 ? '#EF4444' : ward.risk > 60 ? '#F59E0B' : '#10B981',
                      borderRadius: '4px',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
                <span style={{
                  fontSize: '12px',
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 600,
                  color: ward.risk > 75 ? '#EF4444' : ward.risk > 60 ? '#F59E0B' : '#10B981',
                  minWidth: '40px',
                  textAlign: 'right',
                }}>
                  {ward.risk}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Crime pie chart */}
        <div style={{
          background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
          borderRadius: '14px', padding: '20px',
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,75,135,0.1)',
        }}>
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '13px', color: textPrimary, marginBottom: '8px' }}>
            Crime Mix
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={crimeCategories}
                cx="50%" cy="50%"
                innerRadius={45} outerRadius={70}
                dataKey="count"
                strokeWidth={0}
              >
                {crimeCategories.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: isDark ? '#0d1b2e' : '#fff',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  color: textPrimary,
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {crimeCategories.map((cat, idx) => (
              <div key={cat.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: PIE_COLORS[idx], flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: textMuted }}>{cat.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 600, color: textPrimary, fontFamily: 'JetBrains Mono' }}>
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
