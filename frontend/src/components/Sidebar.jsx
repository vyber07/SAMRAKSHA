import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useAuthStore((state) => state.logout);
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { path: '/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/cases', icon: '📁', label: 'Cases' },
    { path: '/incidents', icon: '🚨', label: 'Incidents' },
    { path: '/map', icon: '🗺️', label: 'Crime Map' },
    { path: '/patrol', icon: '🚔', label: 'Patrol Units' },
    { path: '/cctv', icon: '📹', label: 'CCTV' },
    { path: '/analytics', icon: '📈', label: 'Analytics' },
    { path: '/admin', icon: '⚙️', label: 'Admin' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      width: collapsed ? '80px' : '260px',
      background: 'var(--dark-surface)',
      border: '1px solid rgba(148, 163, 184, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      padding: '12px',
      gap: '12px',
    }}>
      {/* Logo */}
      <div style={{
        padding: '16px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        marginBottom: '12px',
        cursor: 'pointer',
      }} onClick={() => navigate('/dashboard')}>
        <div style={{
          fontSize: '24px',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {collapsed ? 'S' : 'SAMRAKSHA'}
        </div>
      </div>

      {/* Menu items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              border: 'none',
              background: location.pathname === item.path
                ? 'rgba(99, 102, 241, 0.2)'
                : 'transparent',
              color: location.pathname === item.path ? '#6366f1' : '#cbd5e1',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              borderLeft: location.pathname === item.path
                ? '3px solid #6366f1'
                : '3px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(99, 102, 241, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = location.pathname === item.path
                ? 'rgba(99, 102, 241, 0.2)'
                : 'transparent';
            }}
          >
            <span style={{ fontSize: '18px' }}>{item.icon}</span>
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>

      {/* Collapse button & logout */}
      <div style={{
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        paddingTop: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#cbd5e1',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {collapsed ? '→' : '←'}
        </button>
        <button
          onClick={handleLogout}
          style={{
            padding: '12px 16px',
            borderRadius: '12px',
            border: 'none',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#fca5a5',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(239, 68, 68, 0.1)';
          }}
        >
          {collapsed ? '🚪' : 'Logout'}
        </button>
      </div>
    </div>
  );
}
