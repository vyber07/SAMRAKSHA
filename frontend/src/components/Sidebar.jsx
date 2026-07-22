import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

// One UI: nav grouped into labelled sections
const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { to: '/', icon: 'dashboard', label: 'Dashboard', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' },
      { to: '/analytics', icon: 'trending_up', label: 'Analytics', gradient: 'linear-gradient(135deg, #f97316, #c2410c)' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/cases', icon: 'folder_open', label: 'Cases', gradient: 'linear-gradient(135deg, #10b981, #047857)' },
      { to: '/cases/create', icon: 'add_circle', label: 'Create FIR', gradient: 'linear-gradient(135deg, #34d399, #059669)' },
      { to: '/incidents', icon: 'warning', label: 'Incidents', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
      { to: '/map', icon: 'map', label: 'Crime Map', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
      { to: '/patrol', icon: 'local_police', label: 'Patrol', gradient: 'linear-gradient(135deg, #eab308, #a16207)' },
    ],
  },
  {
    title: 'System',
    items: [
      { to: '/cctv', icon: 'videocam', label: 'CCTV', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
      { to: '/admin', icon: 'settings', label: 'Admin', gradient: 'linear-gradient(135deg, #6b7280, #374151)' },
    ],
  },
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
    <div style={{ padding: 14, position: 'sticky', top: 0, height: '100vh' }}>
      <aside style={{
        width: collapsed ? 76 : 248,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
        backdropFilter: 'blur(var(--blur)) saturate(1.4)',
        WebkitBackdropFilter: 'blur(var(--blur)) saturate(1.4)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        transition: 'width var(--t-base) var(--ease)',
        overflow: 'hidden',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: collapsed ? '22px 0' : '22px 20px',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '13px', flexShrink: 0,
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(37,99,235,0.25)',
          }}>
            <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: 22 }}>shield</span>
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, fontSize: 16, letterSpacing: '0.5px' }}>SAMRAKSHA</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', letterSpacing: '1px' }}>CRIME MONITORING</div>
            </div>
          )}
        </div>

        {/* Grouped nav — One UI sections */}
        <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 8 }}>
              {!collapsed && (
                <div className="label" style={{ fontSize: 10, padding: '10px 14px 6px' }}>{section.title}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    style={({ isActive }) => ({
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: collapsed ? '6px' : '8px 12px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 'var(--radius-lg)',
                      textDecoration: 'none',
                      fontSize: 14, fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#fff' : 'var(--text-muted)',
                      background: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                      border: isActive ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                      transition: 'all var(--t-fast) var(--ease)',
                    })}
                    title={item.label}
                  >
                    <div style={{
                      width: 36, height: 36,
                      borderRadius: '12px',
                      background: item.gradient,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                      flexShrink: 0
                    }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 19 }}>{item.icon}</span>
                    </div>
                    {!collapsed && item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Officer card + controls */}
        <div style={{ padding: 12 }}>
          {!collapsed && officer && (
            <div style={{
              padding: '12px 16px', marginBottom: 10,
              background: 'rgba(255,255,255,0.05)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{officer.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tertiary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: 3 }}>
                {officer.role} · {officer.badge_no}
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, flexDirection: collapsed ? 'column' : 'row', alignItems: 'center' }}>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                flex: collapsed ? 'none' : 1,
                padding: '11px 14px',
                background: 'rgba(220,38,38,0.14)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: 'var(--radius-pill)',
                color: '#fca5a5', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', transition: 'all var(--t-fast) var(--ease)',
              }}
            >{collapsed ? '⏻' : '⏻ Logout'}</button>
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand' : 'Collapse'}
              style={{
                padding: '11px 13px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-muted)', fontSize: 12,
                cursor: 'pointer',
              }}
            >{collapsed ? '»' : '«'}</button>
          </div>
        </div>
      </aside>
    </div>
  );
}
