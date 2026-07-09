import { useAuth } from '../../hooks/useAuth'
import { Link, useLocation } from 'react-router-dom'
import {
  Map, FileText, Plus, Activity, Video,
  MessageSquare, BarChart2, Shield, Settings, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { path: '/dashboard', icon: Activity, label: 'Dashboard',
    roles: ['constable','io','sho','dcp','admin'] },
  { path: '/map', icon: Map, label: 'Crime Map',
    roles: ['constable','io','sho','dcp','admin'] },
  { path: '/fir/new', icon: Plus, label: 'New FIR',
    roles: ['io','sho','admin'] },
  { path: '/cases', icon: FileText, label: 'Cases',
    roles: ['io','sho','dcp','admin'] },
  { path: '/patrol', icon: Shield, label: 'Patrol',
    roles: ['io','sho','dcp','admin'] },
  { path: '/cctv', icon: Video, label: 'CCTV',
    roles: ['sho','dcp','admin'] },
  { path: '/assistant', icon: MessageSquare, label: 'AI Assistant',
    roles: ['io','sho','dcp','admin'] },
  { path: '/analytics', icon: BarChart2, label: 'Analytics',
    roles: ['sho','dcp','admin'] },
]

export function Sidebar() {
  const { officer, logout } = useAuth()
  
  const allowed = NAV_ITEMS.filter(item =>
    item.roles.includes(officer?.role || '')
  )
  
  return (
    <aside style={{
      width: '240px',
      height: '100vh',
      background: '#1A2B4A',
      position: 'fixed',
      left: 0, top: 0,
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid #0F1E35',
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid #0F1E35'
      }}>
        <div style={{
          fontSize: '20px', fontWeight: 700,
          color: '#FFFFFF', letterSpacing: '0.5px'
        }}>
          SAMRAKSHA
        </div>
        <div style={{ fontSize: '11px', color: '#8FA3BF', marginTop: '2px' }}>
          Ahmedabad City Police
        </div>
      </div>
      
      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
        {allowed.map(item => (
          <NavItem key={item.path} {...item} />
        ))}
      </nav>
      
      {/* Officer info */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid #0F1E35',
        background: '#111D32'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#8FA3BF', fontFamily: 'IBM Plex Mono' }}>
              {officer?.badge_no}
            </div>
            <div style={{
              fontSize: '13px', color: '#FFFFFF',
              fontWeight: 500, marginTop: '2px'
            }}>
              {officer?.name}
            </div>
          </div>
          <button 
            onClick={logout}
            title="Sign Out"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              padding: '6px'
            }}
          >
            <LogOut size={16} color="#8FA3BF" />
          </button>
        </div>
        <RoleBadge role={officer?.role} />
      </div>
    </aside>
  )
}

function NavItem({ path, icon: Icon, label }: any) {
  const location = useLocation()
  const active = location.pathname.startsWith(path)
  
  return (
    <Link to={path} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 20px',
      textDecoration: 'none',
      color: active ? '#FFFFFF' : '#8FA3BF',
      background: active ? '#2E5F8A' : 'transparent',
      fontSize: '14px',
      fontWeight: active ? 600 : 400,
      transition: 'background 150ms'
    }}>
      <Icon size={16} color={active ? '#FFFFFF' : '#8FA3BF'} />
      <span>{label}</span>
    </Link>
  )
}

function RoleBadge({ role }: { role?: string }) {
  const colors: Record<string, string> = {
    constable: '#5A6A7E',
    io:        '#2E5F8A',
    sho:       '#2A7A4B',
    dcp:       '#C4922A',
    admin:     '#B52A2A',
  }
  return (
    <span style={{
      display: 'inline-block',
      marginTop: '6px',
      padding: '2px 8px',
      background: colors[role || ''] || '#5A6A7E',
      borderRadius: '3px',
      fontSize: '10px',
      fontWeight: 600,
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }}>
      {role?.toUpperCase()}
    </span>
  )
}
