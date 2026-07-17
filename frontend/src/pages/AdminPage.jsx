import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');

  const tabs = [
    { id: 'users', label: '👥 Users', icon: '👥' },
    { id: 'roles', label: '🔐 Roles', icon: '🔐' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️' },
    { id: 'logs', label: '📋 Logs', icon: '📋' },
  ];

  const handleRefresh = () => {
    console.log('Refreshing admin data...');
  };

  const tabContent = {
    users: {
      title: 'User Management',
      description: 'Manage system users, roles, and permissions.',
    },
    roles: {
      title: 'Role Management',
      description: 'Configure roles and access control.',
    },
    settings: {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences.',
    },
    logs: {
      title: 'System Logs',
      description: 'View system activity and audit logs.',
    },
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onRefresh={handleRefresh} />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 100%)' }}>
          <div style={{ marginBottom: '24px' }} className="fade-in">
            <h1 className="heading-md" style={{ marginBottom: '8px' }}>Administration</h1>
            <p className="body-md" style={{ color: 'var(--light-text-secondary)' }}>System configuration and user management</p>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            paddingBottom: '12px',
            overflowX: 'auto',
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="transition-short"
                style={{
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-8)',
                  border: 'none',
                  background: activeTab === tab.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  color: activeTab === tab.id ? '#6366f1' : 'var(--light-text-secondary)',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  cursor: 'pointer',
                  borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = 'rgba(148, 163, 184, 0.05)';
                    e.target.style.color = 'var(--light-text)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.target.style.background = 'transparent';
                    e.target.style.color = 'var(--light-text-secondary)';
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="glass fade-in" style={{
            padding: '24px',
            minHeight: '400px',
          }}>
            <h2 className="heading-sm" style={{ marginBottom: '8px' }}>
              {tabContent[activeTab].title}
            </h2>
            <p className="body-md" style={{ color: 'var(--light-text-secondary)', marginBottom: '24px' }}>
              {tabContent[activeTab].description}
            </p>

            {/* Placeholder Content */}
            <div style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: 'rgba(99, 102, 241, 0.08)',
              borderRadius: 'var(--radius-16)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              color: 'var(--light-text-secondary)',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚀</div>
              <p className="body-lg" style={{ color: 'var(--light-text)', marginBottom: '4px' }}>
                Coming Soon
              </p>
              <p className="body-md">
                {activeTab === 'users' && 'User management interface is under development'}
                {activeTab === 'roles' && 'Role configuration interface is under development'}
                {activeTab === 'settings' && 'System settings interface is under development'}
                {activeTab === 'logs' && 'Audit logs viewer is under development'}
              </p>
            </div>

            {/* Info Grid */}
            {activeTab === 'users' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '24px',
              }}>
                {[
                  { label: 'Total Users', value: '24', color: '#6366f1' },
                  { label: 'Active Now', value: '8', color: '#10b981' },
                  { label: 'Pending', value: '3', color: '#f59e0b' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="glass transition-short"
                    style={{ padding: '16px', textAlign: 'center', borderTop: `2px solid ${stat.color}` }}
                  >
                    <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '8px' }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'roles' && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '24px',
              }}>
                {['Admin', 'SHO', 'DCP', 'IO', 'Constable'].map((role, i) => (
                  <div
                    key={i}
                    className="glass transition-short"
                    style={{ padding: '16px', cursor: 'pointer' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div className="body-lg" style={{ fontWeight: '600', marginBottom: '8px' }}>{role}</div>
                    <div className="body-md" style={{ color: 'var(--light-text-secondary)' }}>
                      {Math.floor(Math.random() * 10) + 1} users
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'logs' && (
              <div style={{ marginTop: '24px' }}>
                {[
                  { action: 'User Login', user: 'Admin User', time: '2 mins ago' },
                  { action: 'Case Updated', user: 'Officer ID: 105', time: '15 mins ago' },
                  { action: 'System Config', user: 'Admin User', time: '1 hour ago' },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="glass transition-short"
                    style={{
                      padding: '16px',
                      marginBottom: '12px',
                      borderLeft: '4px solid #6366f1',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div className="body-lg" style={{ fontWeight: '600', marginBottom: '4px' }}>{log.action}</div>
                      <div className="body-md" style={{ color: 'var(--light-text-secondary)' }}>{log.user}</div>
                    </div>
                    <div className="label-sm" style={{ color: 'var(--neutral-variant)' }}>{log.time}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
