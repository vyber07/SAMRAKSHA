import React, { useEffect, useState } from 'react';
import { cases } from '../lib/api';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import SearchBar from '../components/SearchBar';

export default function CasesPage() {
  const [casesList, setCasesList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const res = await cases.list(0, 50);
      setCasesList(res.data.items || []);
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = { open: '#64748b', investigating: '#f97316', closed: '#16a34a', pending: '#2563eb' };
    return colors[status?.toLowerCase()] || '#cbd5e1';
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TopBar onRefresh={loadCases} />
        <div style={{ flex: 1, overflow: 'auto', padding: '24px', background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 100%)' }}>
          <div style={{ marginBottom: '24px' }} className="fade-in">
            <h1 className="heading-md" style={{ marginBottom: '8px' }}>Cases Management</h1>
            <p className="body-md" style={{ color: 'var(--light-text-secondary)' }}>Track and manage all case investigations</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <SearchBar placeholder="Search cases by title, FIR number, or location..." />
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--light-text-secondary)' }}>
              <div className="pulse" style={{ display: 'inline-block' }}>Loading cases...</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {casesList.length === 0 ? (
                <div className="glass" style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: 'var(--light-text-secondary)',
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
                  <p className="body-lg">No cases found</p>
                  <p className="body-md">Create a new case or adjust your filters</p>
                </div>
              ) : (
                casesList.map((c, idx) => {
                  const statusColor = getStatusColor(c.status);
                  return (
                    <div
                      key={c.id}
                      className="glass slide-up"
                      style={{
                        padding: '20px',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        animationDelay: `${idx * 50}ms`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(6px) translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 12px 32px rgba(11, 102, 210, 0.15)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0) translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 className="heading-sm" style={{ margin: 0, marginBottom: '4px' }}>{c.case_title || `Case #${c.id}`}</h3>
                          <p className="body-md" style={{ color: 'var(--light-text-secondary)', margin: 0 }}>{c.description || 'No description'}</p>
                        </div>
                        <div
                          className="transition-short"
                          style={{
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-12)',
                            background: `${statusColor}20`,
                            color: statusColor,
                            fontSize: '12px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap',
                            border: `1px solid ${statusColor}40`,
                          }}
                        >
                          {c.status?.toUpperCase() || 'OPEN'}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', paddingTop: '12px', borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <div className="body-md" style={{ color: 'var(--light-text-secondary)' }}>
                          <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '4px' }}>FIR Number</div>
                          {c.fir_number || '—'}
                        </div>
                        <div className="body-md" style={{ color: 'var(--light-text-secondary)' }}>
                          <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '4px' }}>Location</div>
                          {c.location || 'Unknown'}
                        </div>
                        <div className="body-md" style={{ color: 'var(--light-text-secondary)' }}>
                          <div className="label-sm" style={{ color: 'var(--neutral-variant)', marginBottom: '4px' }}>Created</div>
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
