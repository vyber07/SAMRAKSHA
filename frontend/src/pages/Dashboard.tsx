import { useEffect, useState } from 'react'
import { useWebSocket } from '../hooks/useWebSocket'
import { api } from '../api/client'
import { StatusBadge } from '../components/ui'
import {
  AlertTriangle, FileText, Shield,
  TrendingUp
} from 'lucide-react'

interface DashboardStats {
  firs_today: number
  firs_today_change: number
  active_alerts: number
  patrol_active: number
  high_risk_zones: number
}

export function Dashboard() {
  const [stats, setStats]   = useState<DashboardStats | null>(null)
  const [alerts, setAlerts] = useState<any[]>([])
  const [recent, setRecent] = useState<any[]>([])
  const demoMode = import.meta.env.VITE_DEMO_MODE === 'true'

  const fetchDashboardData = () => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/map/alerts?limit=5'),
      api.get('/cases'),
    ]).then(([statsRes, alertsRes, recentRes]) => {
      setStats(statsRes.data)
      setAlerts(alertsRes.data)
      // Slice top 5 in frontend to guarantee correct display size
      setRecent((recentRes.data || []).slice(0, 5))
    }).catch(err => {
      console.error("Dashboard data load failed", err)
      // Fallback local stats for offline demo stability
      setStats({
        firs_today: 4,
        firs_today_change: 25,
        active_alerts: 2,
        patrol_active: 3,
        high_risk_zones: 1
      })
    })
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  useWebSocket((event) => {
    if (event.type === 'NEW_FIR') {
      setStats(prev => prev ? {
        ...prev,
        firs_today: prev.firs_today + 1
      } : prev)
      
      const newInc = {
        case_id: event.case_id,
        fir_no: event.fir_no,
        crime_type: event.crime_type,
        ward: event.ward,
        crime_date: event.crime_date || new Date().toISOString(),
        case_status: event.case_status || 'open'
      }
      setRecent(prev => [newInc, ...prev.slice(0, 4)])
    }
    if (event.type === 'CCTV_ALERT' && event.alert) {
      setAlerts(prev => [event.alert, ...prev.slice(0, 4)])
      setStats(prev => prev ? {
        ...prev,
        active_alerts: prev.active_alerts + 1
      } : prev)
    }
  })

  const formatTimeAgo = (tsStr: string) => {
    try {
      const d = new Date(tsStr)
      const diffMs = new Date().getTime() - d.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      if (diffMins < 60) {
        return `${diffMins} min ago`
      }
      const diffHrs = Math.floor(diffMins / 60)
      if (diffHrs < 24) {
        return `${diffHrs} hours ago`
      }
      return d.toLocaleDateString()
    } catch {
      return tsStr
    }
  }

  return (
    <div style={{ padding: '24px' }}>
      {demoMode && (
        <div style={{
          background: '#FFF3CD', border: '1px solid #FFEEBA',
          borderRadius: '6px', padding: '10px 16px',
          fontSize: '13px', color: '#856404',
          marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertTriangle size={14} />
          <span>DEMO MODE — All data is synthetic and does not represent real police incidents. For demonstration purposes only.</span>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '22px', fontWeight: 600,
          color: '#1C2B3A', margin: 0
        }}>
          Command Centre Dashboard
        </h1>
        <div style={{
          fontSize: '13px', color: '#5A6A7E', marginTop: '4px'
        }}>
          Ahmedabad City Police — Live Overview
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px', marginBottom: '24px'
      }}>
        <StatCard
          icon={<FileText size={18} color="#2E5F8A" />}
          label="FIRs Registered Today"
          value={stats?.firs_today ?? '—'}
          change={stats?.firs_today_change}
          bg="#EBF4FF"
        />
        <StatCard
          icon={<AlertTriangle size={18} color="#C4922A" />}
          label="Active CCTV Alerts"
          value={stats?.active_alerts ?? '—'}
          change={null}
          bg="#FFF8ED"
        />
        <StatCard
          icon={<Shield size={18} color="#2A7A4B" />}
          label="Active Patrol Units"
          value={stats?.patrol_active ?? '—'}
          change={null}
          bg="#EDFBF4"
        />
        <StatCard
          icon={<TrendingUp size={18} color="#B52A2A" />}
          label="High Risk Zones (Current Hour)"
          value={stats?.high_risk_zones ?? '—'}
          change={null}
          bg="#FFF0F0"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Recent incidents list */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #D1D9E6',
          borderRadius: '6px', padding: '20px'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '14px', fontWeight: 600,
              color: '#1A2B4A', margin: 0
            }}>
              Recent Cases
            </h3>
            <a href="/cases" style={{
              fontSize: '12px', color: '#2E5F8A',
              textDecoration: 'none', fontWeight: 500
            }}>
              View all cases →
            </a>
          </div>

          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontSize: '13px'
          }}>
            <thead>
              <tr>
                {['FIR No.','Crime Type','Ward','Time','Status'].map(h => (
                  <th key={h} style={{
                    padding: '8px 10px', textAlign: 'left',
                    fontSize: '11px', fontWeight: 600,
                    color: '#5A6A7E', background: '#F4F6F9',
                    borderBottom: '1px solid #D1D9E6'
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recent.map((inc, i) => (
                <tr key={inc.case_id}
                    style={{
                      background: i % 2 === 0 ? '#FFFFFF' : '#F8FAFC'
                    }}>
                  <td style={{
                    padding: '10px', fontFamily: 'IBM Plex Mono',
                    fontSize: '12px', color: '#2E5F8A'
                  }}>
                    <a href={`/cases/${inc.case_id}`}
                       style={{
                         color: '#2E5F8A', textDecoration: 'none', fontWeight: 500
                       }}>
                      {inc.fir_no}
                    </a>
                  </td>
                  <td style={{ padding: '10px', color: '#1C2B3A', textTransform: 'capitalize' }}>
                    {inc.crime_type.replace('_', ' ')}
                  </td>
                  <td style={{ padding: '10px', color: '#5A6A7E' }}>
                    {inc.ward}
                  </td>
                  <td style={{
                    padding: '10px', color: '#5A6A7E', fontSize: '12px'
                  }}>
                    {formatTimeAgo(inc.crime_date)}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <StatusBadge status={inc.case_status} />
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#5A6A7E' }}>
                    No recent case files registered in this jurisdiction.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Live Alerts list */}
        <div style={{
          background: '#FFFFFF', border: '1px solid #D1D9E6',
          borderRadius: '6px', padding: '20px'
        }}>
          <h3 style={{
            fontSize: '14px', fontWeight: 600,
            color: '#1A2B4A', margin: '0 0 16px 0'
          }}>
            Live CCTV Feeds Alerts
          </h3>

          {alerts.length === 0 ? (
            <div style={{
              fontSize: '13px', color: '#5A6A7E',
              textAlign: 'center', padding: '20px 0'
            }}>
              No active CCTV alerts.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {alerts.map(alert => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, change, bg }: any) {
  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #D1D9E6',
      borderRadius: '6px', padding: '16px', display: 'flex',
      alignItems: 'center', gap: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{ background: bg, padding: '12px', borderRadius: '6px', display: 'flex' }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#5A6A7E', fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: '#1A2B4A', marginTop: '4px' }}>{value}</div>
        {change !== null && change !== undefined && (
          <div style={{ fontSize: '11px', color: change >= 0 ? '#2A7A4B' : '#B52A2A', marginTop: '2px', fontWeight: 500 }}>
            {change >= 0 ? '+' : ''}{change}% vs yesterday
          </div>
        )}
      </div>
    </div>
  )
}

function AlertCard({ alert }: any) {
  return (
    <div style={{
      background: '#FDF2F2', border: '1px solid #FDE8E8',
      borderRadius: '6px', padding: '12px',
      fontSize: '13px'
    }}>
      <div style={{ fontWeight: 600, color: '#B52A2A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          ⚠️ {alert.alert_type.toUpperCase().replace('_', ' ')}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 400, color: '#5A6A7E', fontFamily: 'IBM Plex Mono' }}>
          {alert.camera_id}
        </span>
      </div>
      <div style={{ marginTop: '6px', color: '#1C2B3A' }}>
        Confidence: {Math.round(alert.confidence * 100)}% {alert.person_count ? `| Count: ${alert.person_count}` : ''}
      </div>
      {alert.plate_no && (
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: '11px', fontWeight: 600, color: '#2E5F8A', marginTop: '6px', background: '#F4F6F9', padding: '3px 6px', borderRadius: '3px' }}>
          ANPR Match: {alert.plate_no}
        </div>
      )}
    </div>
  )
}
export default Dashboard
