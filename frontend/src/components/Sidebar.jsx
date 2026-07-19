import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

const NAV_ITEMS = [
  { to: '/', icon: '📊', label: 'Dashboard' },
  { to: '/cases', icon: '📁', label: 'Cases' },
  { to: '/incidents', icon: '🚨', label: 'Incidents' },
  { to: '/map', icon: '🗺️', label: 'Map' },
  { to: '/analytics', icon: '📈', label: 'Analytics' },
  { to: '/patrol', icon: '🚔', label: 'Patrol' },
  { to: '/cctv', icon: '📹', label: 'CCTV' },
  { to: '/admin', icon: '⚙️', label: 'Admin' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const officer = useAuthStore((s) => s.officer);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside style={{
      width: collapsed ? 72 : 240,
      minWidth: collapsed ? 72 : 240,
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(30, 41, 59, 0.55)',
      backdropFilter: 'blur(12px)',
      borderRight: '1px solid var(--border)',
      transition: 'width var(--t-base) var(--ease), min-width var(--t-base) var(--ease)',
      zIndex: 20,
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: collapsed ? '20px 0' : '20px 18px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>🛡️</div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 16, letterSpacing: '0.5px' }}>SAMRAKSHA</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px' }}>CRIME MONITORING</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: collapsed ? '12px 0' : '11px 14px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: 14, fontWeight: isActive ? 600 : 500,
              color: isActive ? '#fff' : 'var(--text-muted)',
              background: isActive ? 'var(--primary)' : 'transparent',
              boxShadow: isActive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
              transition: 'all var(--t-fast) var(--ease)',
            })}
            title={item.label}
          >
            <span style={{ fontSize: 17 }}>{item.icon}</span>
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>

      {/* Officer + logout */}
      <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border)' }}>
        {!collapsed && officer && (
          <div style={{ marginBottom: 10, padding: '8px 10px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{officer.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 2 }}>
              {officer.role} · {officer.badge_no}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: collapsed ? 'center' : 'flex-start', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center' }}>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              flex: collapsed ? 'none' : 1,
              padding: '9px 12px',
              background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#fca5a5', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all var(--t-fast) var(--ease)',
            }}
          >{collapsed ? '⏻' : '⏻ Logout'}</button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? 'Expand' : 'Collapse'}
            style={{
              padding: '9px 10px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-muted)', fontSize: 12,
              cursor: 'pointer',
            }}
          >{collapsed ? '»' : '«'}</button>
        </div>
      </div>
    </aside>
  );
}
