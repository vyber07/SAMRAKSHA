import React, { useState } from 'react';
import { Settings, Users, Shield, Clock, Plus, Edit, Trash2, Search, Eye, FileText, Camera, LogIn, Download } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { usePublishedPage } from '../hooks/usePublishedPage';
import { PublishedPageRenderer } from '../editor/PublishedPageRenderer';

const ROLES = [
  { name: 'Admin', color: '#EF4444', permissions: ['All Access', 'User Management', 'Audit Logs', 'System Settings'] },
  { name: 'Investigation Officer', color: '#F59E0B', permissions: ['FIR Management', 'Case Details', 'Document Studio', 'AI Assistant', 'Map'] },
  { name: 'Desk Officer', color: '#3B82F6', permissions: ['FIR Registration', 'Case View', 'Dashboard', 'CCTV View'] },
  { name: 'Constable', color: '#10B981', permissions: ['Dashboard', 'Patrol View', 'Map View'] },
];

const USERS = [
  { id: 'USR-001', badge: 'ADMIN', name: 'Superintendent of Police', role: 'Admin', station: 'ACP HQ Ahmedabad', status: 'Active', lastLogin: '2024-08-08 09:15', rank: 'SP' },
  { id: 'USR-002', badge: 'IO001', name: 'Inspector Ravi Sharma', role: 'Investigation Officer', station: 'Satellite PS', status: 'Active', lastLogin: '2024-08-08 08:30', rank: 'Inspector' },
  { id: 'USR-003', badge: 'IO002', name: 'Inspector Priya Patel', role: 'Investigation Officer', station: 'Naranpura PS', status: 'Active', lastLogin: '2024-08-07 22:00', rank: 'Inspector' },
  { id: 'USR-004', badge: 'DESK01', name: 'ASI Kiran Bhatt', role: 'Desk Officer', station: 'Naranpura PS', status: 'Active', lastLogin: '2024-08-08 07:00', rank: 'ASI' },
  { id: 'USR-005', badge: 'DESK02', name: 'ASI Suresh Jain', role: 'Desk Officer', station: 'Maninagar PS', status: 'Suspended', lastLogin: '2024-08-01 10:00', rank: 'ASI' },
  { id: 'USR-006', badge: 'CON001', name: 'HC Devraj Desai', role: 'Constable', station: 'Nikol PS', status: 'Active', lastLogin: '2024-08-08 06:00', rank: 'Head Constable' },
  { id: 'USR-007', badge: 'CON002', name: 'HC Rekha Modi', role: 'Constable', station: 'Bodakdev PS', status: 'Active', lastLogin: '2024-08-07 18:00', rank: 'Head Constable' },
];

const AUDIT_LOGS = [
  { id: 'AUD-001', time: '2024-08-08 09:15', badge: 'ADMIN', action: 'Login', detail: 'System login from 192.168.1.10', type: 'login', icon: LogIn },
  { id: 'AUD-002', time: '2024-08-08 09:20', badge: 'ADMIN', action: 'User Modified', detail: 'Badge DESK02 — Status changed to Suspended', type: 'edit', icon: Edit },
  { id: 'AUD-003', time: '2024-08-08 08:30', badge: 'IO001', action: 'FIR Edit', detail: 'FIR-2024/SB/1187 — Added evidence entry EV-002', type: 'fir', icon: FileText },
  { id: 'AUD-004', time: '2024-08-08 08:35', badge: 'IO001', action: 'Document Export', detail: 'Chargesheet for FIR-2024/SB/1187 exported', type: 'export', icon: Download },
  { id: 'AUD-005', time: '2024-08-08 07:55', badge: 'DESK01', action: 'CCTV Access', detail: 'Accessed CCTV feed CAM-002 (Naranpura)', type: 'cctv', icon: Camera },
  { id: 'AUD-006', time: '2024-08-08 07:00', badge: 'CON001', action: 'Login', detail: 'System login from Mobile App', type: 'login', icon: LogIn },
  { id: 'AUD-007', time: '2024-08-07 22:10', badge: 'IO002', action: 'Case View', detail: 'Viewed FIR-2024/NR/0923 case detail', type: 'view', icon: Eye },
  { id: 'AUD-008', time: '2024-08-07 21:45', badge: 'IO002', action: 'AI Query', detail: 'CrimeGPT query: BNS section equivalence', type: 'ai', icon: Shield },
];

const AUDIT_COLORS: Record<string, string> = {
  login: '#10B981', edit: '#F59E0B', fir: '#3B82F6',
  export: '#8B5CF6', cctv: '#EF4444', view: '#6B7280', ai: '#EC4899',
};

const Admin: React.FC = () => {
  const publishedPage = usePublishedPage('admin');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [activeTab, setActiveTab] = useState<'rbac' | 'users' | 'audit'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const cardBg = isDark ? 'rgba(13,27,46,0.75)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';

  const filteredUsers = USERS.filter(u => {
    const q = userSearch.toLowerCase();
    return !q || u.name.toLowerCase().includes(q) || u.badge.toLowerCase().includes(q) || u.station.toLowerCase().includes(q);
  });

  const tabs = [
    { key: 'users', label: 'User Directory', icon: Users },
    { key: 'rbac', label: 'Role Permissions', icon: Shield },
    { key: 'audit', label: 'Audit Logs', icon: Clock },
  ] as const;

  // ── Published override ───────────────────────────────────────────────────
  if (publishedPage) return <PublishedPageRenderer snapshot={publishedPage} />;

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: 'var(--bg-primary)', color: textPrimary }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Settings size={22} style={{ color: isDark ? '#A8CAFF' : '#004B87' }} />
          <div>
            <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '22px', color: textPrimary }}>Admin & User Management</h1>
            <p style={{ fontSize: '13px', color: textMuted }}>{USERS.length} officers · {ROLES.length} roles defined</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px',
            background: '#004B87', color: 'white', border: 'none', borderRadius: '9px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,75,135,0.3)',
          }}
        >
          <Plus size={15} /> Add Officer
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,75,135,0.04)', borderRadius: '10px', padding: '4px', width: 'fit-content' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              background: activeTab === tab.key ? '#004B87' : 'transparent',
              color: activeTab === tab.key ? 'white' : textMuted,
              border: 'none', transition: 'all 0.15s',
            }}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* USER DIRECTORY */}
      {activeTab === 'users' && (
        <div>
          {/* Search */}
          <div style={{ marginBottom: '16px', position: 'relative', maxWidth: '360px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search officers..."
              style={{
                width: '100%', padding: '9px 12px 9px 36px',
                background: cardBg, backdropFilter: 'blur(12px)',
                border: `1px solid ${cardBorder}`, borderRadius: '8px',
                color: textPrimary, fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          <div style={{
            background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
            borderRadius: '12px', overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: isDark ? 'rgba(168,202,255,0.05)' : 'rgba(0,75,135,0.05)', borderBottom: `1px solid ${cardBorder}` }}>
                  {['Badge', 'Officer Name', 'Rank', 'Role', 'Station', 'Status', 'Last Login', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, idx) => {
                  const roleColor = ROLES.find(r => r.name === user.role)?.color || '#6B7280';
                  return (
                    <tr
                      key={user.id}
                      style={{
                        borderBottom: `1px solid ${cardBorder}`,
                        background: idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,75,135,0.01)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,75,135,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,75,135,0.01)')}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '12px', color: isDark ? '#A8CAFF' : '#004B87' }}>{user.badge}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: textPrimary }}>{user.name}</td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: textMuted }}>{user.rank}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: `${roleColor}18`, color: roleColor, border: `1px solid ${roleColor}30` }}>
                          {user.role.split(' ')[0]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: textMuted }}>{user.station}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
                          background: user.status === 'Active' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                          color: user.status === 'Active' ? '#10B981' : '#EF4444',
                        }}>
                          {user.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '11px', fontFamily: 'JetBrains Mono', color: textMuted }}>{user.lastLogin}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            title="Edit"
                            style={{
                              width: '28px', height: '28px', borderRadius: '6px', border: `1px solid ${cardBorder}`,
                              background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: isDark ? '#A8CAFF' : '#004B87',
                            }}
                          ><Edit size={13} /></button>
                          {user.badge !== 'ADMIN' && (
                            <button
                              title="Remove"
                              style={{
                                width: '28px', height: '28px', borderRadius: '6px', border: '1px solid rgba(239,68,68,0.25)',
                                background: 'rgba(239,68,68,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#EF4444',
                              }}
                            ><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RBAC */}
      {activeTab === 'rbac' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {ROLES.map(role => (
            <div key={role.name} style={{
              background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
              borderRadius: '14px', padding: '20px',
              borderTop: `3px solid ${role.color}`,
              boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(0,75,135,0.08)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${role.color}18`, border: `1px solid ${role.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={18} style={{ color: role.color }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: textPrimary }}>{role.name}</div>
                  <div style={{ fontSize: '11px', color: textMuted }}>
                    {USERS.filter(u => u.role === role.name).length} officer(s)
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {role.permissions.map(perm => (
                  <div key={perm} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: textPrimary }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: role.color, flexShrink: 0 }} />
                    {perm}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div style={{
          background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
          borderRadius: '12px', overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'livePulse 1.5s infinite' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: textPrimary }}>IMMUTABLE AUDIT LOG</span>
            </div>
            <span style={{ fontSize: '11px', color: textMuted }}>{AUDIT_LOGS.length} entries (last 24h)</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: isDark ? 'rgba(168,202,255,0.05)' : 'rgba(0,75,135,0.05)' }}>
                {['Timestamp', 'Badge', 'Action', 'Detail', 'Type'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {AUDIT_LOGS.map((log, idx) => {
                const color = AUDIT_COLORS[log.type] || '#6B7280';
                return (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: `1px solid ${cardBorder}`,
                      background: idx % 2 === 0 ? 'transparent' : isDark ? 'rgba(255,255,255,0.015)' : 'rgba(0,75,135,0.01)',
                    }}
                  >
                    <td style={{ padding: '11px 16px', fontFamily: 'JetBrains Mono', fontSize: '11px', color: textMuted, whiteSpace: 'nowrap' }}>{log.time}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '12px', color: isDark ? '#A8CAFF' : '#004B87' }}>{log.badge}</span>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <log.icon size={13} style={{ color }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: textPrimary }}>{log.action}</span>
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px', fontSize: '12px', color: textMuted, maxWidth: '320px' }}>{log.detail}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: `${color}15`, color, border: `1px solid ${color}30` }}>
                        {log.type.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }} onClick={() => setShowAddUser(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: isDark ? '#0d1b2e' : '#fff', borderRadius: '16px',
              border: `1px solid ${cardBorder}`, padding: '28px', width: '440px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
            }}
          >
            <h3 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '18px', color: textPrimary, marginBottom: '20px' }}>Add New Officer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {['Badge Number', 'Full Name', 'Rank'].map(field => (
                <div key={field}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>{field}</label>
                  <input
                    style={{ width: '100%', padding: '10px 14px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)', border: `1px solid ${cardBorder}`, borderRadius: '8px', color: textPrimary, fontSize: '13px', outline: 'none' }}
                    placeholder={`Enter ${field.toLowerCase()}...`}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: '5px' }}>Role</label>
                <select style={{ width: '100%', padding: '10px 14px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)', border: `1px solid ${cardBorder}`, borderRadius: '8px', color: textPrimary, fontSize: '13px', outline: 'none' }}>
                  {ROLES.map(r => <option key={r.name}>{r.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => setShowAddUser(false)}
                  style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid ${cardBorder}`, borderRadius: '9px', color: textMuted, fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowAddUser(false)}
                  style={{ flex: 1, padding: '11px', background: '#004B87', border: 'none', borderRadius: '9px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Add Officer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
