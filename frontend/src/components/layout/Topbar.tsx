import { useAuth } from '../../hooks/useAuth'

export function Topbar() {
  const { officer } = useAuth()
  
  return (
    <header style={{
      height: '60px',
      background: '#FFFFFF',
      borderBottom: '1px solid #D1D9E6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 90
    }}>
      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1A2B4A' }}>
        Ahmedabad Police Secure Portal
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#2A7A4B'
          }} />
          <span style={{ fontSize: '12px', color: '#5A6A7E', fontWeight: 500 }}>
            Secure Node Connected
          </span>
        </div>
        <div style={{
          fontSize: '12px',
          color: '#5A6A7E',
          borderLeft: '1px solid #D1D9E6',
          paddingLeft: '16px',
          fontFamily: 'IBM Plex Mono'
        }}>
          BNS Compliance v2024
        </div>
      </div>
    </header>
  )
}
