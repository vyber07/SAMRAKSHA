import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, Eye, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { usePublishedPage } from '../hooks/usePublishedPage';
import { PublishedPageRenderer } from '../editor/PublishedPageRenderer';

export const CASES_DATA = [
  { id: 'FIR-2024/SB/1187', station: 'Satellite PS', date: '2024-08-01', time: '08:32', type: 'Theft', status: 'Investigating', victim: 'Ramesh Patel', io: 'SI A. Mehta', accused: 'Unknown', ward: 'Satellite', sections: ['BNS §303', 'BNS §304'] },
  { id: 'FIR-2024/NR/0923', station: 'Naranpura PS', date: '2024-07-28', time: '14:15', type: 'Assault', status: 'Chargesheeted', victim: 'Priya Shah', io: 'SI R. Sharma', accused: 'Mahesh Gupta', ward: 'Naranpura', sections: ['BNS §115', 'BNS §118'] },
  { id: 'FIR-2024/MN/0441', station: 'Maninagar PS', date: '2024-07-22', time: '22:05', type: 'Robbery', status: 'Registered', victim: 'Sunil Verma', io: 'SI P. Joshi', accused: 'Unknown', ward: 'Maninagar', sections: ['BNS §309', 'BNS §310'] },
  { id: 'FIR-2024/NK/0312', station: 'Nikol PS', date: '2024-08-03', time: '11:20', type: 'Cyber Crime', status: 'Investigating', victim: 'Ankita Modi', io: 'SI S. Kulkarni', accused: 'Unknown IP', ward: 'Nikol', sections: ['IT Act §66C', 'BNS §318'] },
  { id: 'FIR-2024/VP/0178', station: 'Vastrapur PS', date: '2024-07-30', time: '03:40', type: 'NDPS', status: 'Chargesheeted', victim: 'State', io: 'SI V. Rana', accused: 'Aslam Khan', ward: 'Vastrapur', sections: ['NDPS §20', 'NDPS §29'] },
  { id: 'FIR-2024/GL/0229', station: 'Ghatlodia PS', date: '2024-08-02', time: '17:55', type: 'Theft', status: 'Closed', victim: 'Hetal Desai', io: 'HC R. Dave', accused: 'Rajesh Nayak', ward: 'Ghatlodia', sections: ['BNS §303'] },
  { id: 'FIR-2024/BD/0567', station: 'Bodakdev PS', date: '2024-08-04', time: '09:10', type: 'Fraud', status: 'Investigating', victim: 'Kiran Bhatt', io: 'SI M. Patel', accused: 'Unknown', ward: 'Bodakdev', sections: ['BNS §316', 'BNS §318'] },
  { id: 'FIR-2024/SB/1100', station: 'Satellite PS', date: '2024-07-25', time: '20:30', type: 'Assault', status: 'Closed', victim: 'Dhruv Trivedi', io: 'SI A. Mehta', accused: 'Dinesh Lal', ward: 'Satellite', sections: ['BNS §115'] },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Registered: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  Investigating: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  Chargesheeted: { bg: 'rgba(139,92,246,0.15)', text: '#8B5CF6' },
  Closed: { bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
};

const CRIME_TYPES = ['All', 'Theft', 'Assault', 'Robbery', 'Cyber Crime', 'NDPS', 'Fraud'];
const STATUSES = ['All', 'Registered', 'Investigating', 'Chargesheeted', 'Closed'];

const Cases: React.FC = () => {
  const publishedPage = usePublishedPage('cases');
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [crimeType, setCrimeType] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const cardBg = isDark ? 'rgba(13,27,46,0.75)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';
  const tableRowBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,75,135,0.02)';
  const tableRowHover = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,75,135,0.05)';

  const filtered = useMemo(() => {
    return CASES_DATA.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q || c.id.toLowerCase().includes(q) || c.victim.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
      const matchType = crimeType === 'All' || c.type === crimeType;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [search, crimeType, statusFilter]);

  const exportCSV = () => {
    const header = ['FIR No.', 'Station', 'Date', 'Type', 'Status', 'Victim', 'IO', 'Ward'];
    const rows = filtered.map(c => [c.id, c.station, c.date, c.type, c.status, c.victim, c.io, c.ward]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'fir_list.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Published override ───────────────────────────────────────────────────
  if (publishedPage) return <PublishedPageRenderer snapshot={publishedPage} />;

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: 'var(--bg-primary)', color: textPrimary }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FolderOpen size={22} style={{ color: 'var(--accent-color, #004B87)' }} />
          <div>
            <h1 style={{ fontFamily: 'Montserrat', fontWeight: 800, fontSize: '22px', color: textPrimary }}>FIR & Case Registry</h1>
            <p style={{ fontSize: '13px', color: textMuted }}>{filtered.length} cases shown</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 18px',
            background: '#004B87', color: 'white', border: 'none', borderRadius: '9px',
            fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,75,135,0.3)',
          }}
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
        borderRadius: '12px', padding: '16px', marginBottom: '16px',
        display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search FIR no., victim, crime type..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)',
              border: `1px solid ${cardBorder}`, borderRadius: '8px',
              color: textPrimary, fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        {/* Crime type */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} style={{ color: textMuted }} />
          <select
            value={crimeType}
            onChange={e => setCrimeType(e.target.value)}
            style={{
              padding: '9px 12px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)',
              border: `1px solid ${cardBorder}`, borderRadius: '8px',
              color: textPrimary, fontSize: '13px', outline: 'none',
            }}
          >
            {CRIME_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            padding: '9px 12px', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,75,135,0.04)',
            border: `1px solid ${cardBorder}`, borderRadius: '8px',
            color: textPrimary, fontSize: '13px', outline: 'none',
          }}
        >
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{
        background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
        borderRadius: '12px', overflow: 'hidden',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 4px 24px rgba(0,75,135,0.1)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: isDark ? 'rgba(168,202,255,0.05)' : 'rgba(0,75,135,0.06)', borderBottom: `1px solid ${cardBorder}` }}>
              {['FIR Number', 'Date', 'Type', 'Status', 'Victim', 'IO Assigned', 'Ward', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: textMuted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, idx) => {
              const status = STATUS_COLORS[c.status] || { bg: 'rgba(107,114,128,0.15)', text: '#6B7280' };
              return (
                <tr
                  key={c.id}
                  style={{
                    borderBottom: `1px solid ${cardBorder}`,
                    background: idx % 2 === 0 ? 'transparent' : tableRowBg,
                    transition: 'background 0.15s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = tableRowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : tableRowBg)}
                >
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '12px', color: isDark ? '#A8CAFF' : '#004B87' }}>{c.id}</span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: textMuted }}>{c.date} <span style={{ fontSize: '11px' }}>{c.time}</span></td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: textPrimary }}>{c.type}</span>
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: status.bg, color: status.text }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: textPrimary }}>{c.victim}</td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: textMuted }}>{c.io}</td>
                  <td style={{ padding: '13px 16px', fontSize: '12px', color: textMuted }}>{c.ward}</td>
                  <td style={{ padding: '13px 16px' }}>
                    <button
                      onClick={() => navigate(`/case-detail/${encodeURIComponent(c.id)}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px',
                        background: 'rgba(0,75,135,0.15)', color: isDark ? '#A8CAFF' : '#004B87',
                        border: `1px solid ${isDark ? 'rgba(168,202,255,0.2)' : 'rgba(0,75,135,0.2)'}`,
                        borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Eye size={12} /> View
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: textMuted }}>
            <FolderOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>No cases found matching the filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cases;
