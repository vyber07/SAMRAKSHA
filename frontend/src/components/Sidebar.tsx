import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Map, FolderOpen, Camera,
  Truck, Bot, FileText, Settings, LogOut,
  ChevronLeft, ChevronRight, Sun, Moon, Activity, Pencil
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Command Dashboard' },
  { path: '/map', icon: Map, label: 'Crime & Patrol Map' },
  { path: '/cases', icon: FolderOpen, label: 'FIR & Cases' },
  { path: '/cctv', icon: Camera, label: 'CCTV Surveillance' },
  { path: '/patrol', icon: Truck, label: 'Patrol Fleet' },
  { path: '/ai-assistant', icon: Bot, label: 'CrimeGPT AI' },
  { path: '/document-studio', icon: FileText, label: 'Document Studio' },
  { path: '/admin', icon: Settings, label: 'Admin & Users' },
  { path: '/admin/editor', icon: Pencil, label: 'Visual Editor' },
];


const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="glass-sidebar flex flex-col h-screen sticky top-0 z-40 transition-all duration-300"
      style={{ width: collapsed ? '72px' : '256px', minWidth: collapsed ? '72px' : '256px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: 'var(--border-glass)' }}>
        <div
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, #004B87, #0063B2)',
            boxShadow: '0 4px 15px rgba(0,75,135,0.4)'
          }}
        >
          <Shield size={22} color="white" />
        </div>
        {!collapsed && (
          <div>
            <div style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '15px', color: 'white', lineHeight: 1.1 }}>
              SAMRAKSHA
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-sidebar)', opacity: 0.7, letterSpacing: '0.08em' }}>
              AHMEDABAD CITY POLICE
            </div>
          </div>
        )}
      </div>

      {/* Live Status Bar */}
      {!collapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg flex items-center gap-2"
          style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>COMMAND LIVE</span>
          <Activity size={11} color="#10B981" className="ml-auto" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2" style={{ scrollbarWidth: 'none' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all duration-200 group ${
                isActive
                  ? 'nav-active'
                  : 'nav-inactive'
              }`
            }
            style={({ isActive }) => ({
              background: isActive ? 'rgba(168,202,255,0.15)' : 'transparent',
              color: isActive ? (theme === 'dark' ? '#A8CAFF' : 'white') : 'var(--text-sidebar)',
              borderLeft: isActive ? '3px solid ' + (theme === 'dark' ? '#A8CAFF' : '#7AAEE8') : '3px solid transparent',
            })}
          >
            <item.icon size={18} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ fontSize: '13px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Controls */}
      <div className="px-2 pb-4 space-y-1 border-t pt-3" style={{ borderColor: 'var(--border-glass)' }}>
        {/* User info */}
        {!collapsed && user && (
          <div className="px-3 py-2 mb-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'white' }}>{user.name}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{user.badge} · {user.role}</div>
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle theme"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
          style={{ color: 'var(--text-sidebar)', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
          style={{ color: '#EF4444', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={18} />
          {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>Sign Out</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          {!collapsed && <span style={{ fontSize: '12px' }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
