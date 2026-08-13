import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, FileText, AlertTriangle, BookOpen, Camera, CheckCircle2, Shield } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { CASES_DATA } from './Cases';

const CASE_TIMELINES: Record<string, { date: string; time: string; event: string; officer: string; type: 'registered' | 'investigation' | 'arrest' | 'evidence' | 'court' | 'closed' }[]> = {
  'FIR-2024/NR/0923': [
    { date: '2024-07-28', time: '14:15', event: 'FIR registered at Naranpura PS. Complainant: Priya Shah', officer: 'HC B. Patel', type: 'registered' },
    { date: '2024-07-28', time: '16:00', event: 'Scene of crime visited. Photographs taken. Witnesses identified.', officer: 'SI R. Sharma', type: 'investigation' },
    { date: '2024-07-29', time: '10:30', event: 'Accused Mahesh Gupta identified via CCTV footage from NODE-002', officer: 'SI R. Sharma', type: 'evidence' },
    { date: '2024-07-30', time: '09:15', event: 'Accused arrested from Naranpura area. Remanded in custody.', officer: 'SI R. Sharma', type: 'arrest' },
    { date: '2024-08-02', time: '11:00', event: 'Chargesheet filed u/s 193 BNSS in Ahmedabad Sessions Court', officer: 'IO R. Sharma + PP', type: 'court' },
  ],
  'FIR-2024/SB/1187': [
    { date: '2024-08-01', time: '08:32', event: 'FIR registered. Complainant reports theft of two-wheeler from Satellite area.', officer: 'ASI K. Modi', type: 'registered' },
    { date: '2024-08-01', time: '10:00', event: 'Spot inspection done. ANPR query placed for vehicle MH-04-XX-1234.', officer: 'SI A. Mehta', type: 'investigation' },
    { date: '2024-08-03', time: '14:45', event: 'ANPR hit at SG Highway Node 3. PCR-11 dispatched.', officer: 'Control Room', type: 'evidence' },
    { date: '2024-08-04', time: '08:00', event: 'Vehicle recovered. Suspect in custody. Investigation ongoing.', officer: 'SI A. Mehta', type: 'arrest' },
  ],
};

const EVIDENCE_DATA: Record<string, { id: string; type: string; description: string; collected: string; officer: string }[]> = {
  'FIR-2024/NR/0923': [
    { id: 'EV-001', type: 'CCTV Footage', description: 'CCTV recording from Node-002, 14:00-15:00 hrs', collected: '2024-07-29', officer: 'SI R. Sharma' },
    { id: 'EV-002', type: 'Witness Statement', description: 'Statement of eyewitness Suresh Kumar', collected: '2024-07-28', officer: 'HC B. Patel' },
    { id: 'EV-003', type: 'Medical Report', description: 'Injury certificate from VS Hospital', collected: '2024-07-28', officer: 'HC B. Patel' },
  ],
  'FIR-2024/SB/1187': [
    { id: 'EV-001', type: 'ANPR Log', description: 'ANPR hit record from SG Highway Node 3', collected: '2024-08-03', officer: 'Control Room' },
    { id: 'EV-002', type: 'Recovered Property', description: 'Two-wheeler TVS Apache, Engine No. TXP1234', collected: '2024-08-04', officer: 'SI A. Mehta' },
  ],
};

const TIMELINE_ICONS: Record<string, React.ReactNode> = {
  registered: <FileText size={14} color="#3B82F6" />,
  investigation: <AlertTriangle size={14} color="#F59E0B" />,
  arrest: <Shield size={14} color="#EF4444" />,
  evidence: <Camera size={14} color="#8B5CF6" />,
  court: <BookOpen size={14} color="#10B981" />,
  closed: <CheckCircle2 size={14} color="#10B981" />,
};

const TIMELINE_COLORS: Record<string, string> = {
  registered: '#3B82F6', investigation: '#F59E0B', arrest: '#EF4444',
  evidence: '#8B5CF6', court: '#10B981', closed: '#10B981',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Registered: { bg: 'rgba(59,130,246,0.15)', text: '#3B82F6' },
  Investigating: { bg: 'rgba(245,158,11,0.15)', text: '#F59E0B' },
  Chargesheeted: { bg: 'rgba(139,92,246,0.15)', text: '#8B5CF6' },
  Closed: { bg: 'rgba(16,185,129,0.15)', text: '#10B981' },
};

const CaseDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const caseId = id ? decodeURIComponent(id) : '';
  const caseData = CASES_DATA.find(c => c.id === caseId) || CASES_DATA[1];
  const timeline = CASE_TIMELINES[caseData.id] || CASE_TIMELINES['FIR-2024/NR/0923'];
  const evidence = EVIDENCE_DATA[caseData.id] || EVIDENCE_DATA['FIR-2024/NR/0923'];

  const cardBg = isDark ? 'rgba(13,27,46,0.75)' : 'rgba(255,255,255,0.75)';
  const cardBorder = isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)';
  const textPrimary = isDark ? '#e8f0fe' : '#0f172a';
  const textMuted = isDark ? '#7a9cc8' : '#64748b';
  const status = STATUS_COLORS[caseData.status] || { bg: 'rgba(107,114,128,0.15)', text: '#6B7280' };

  const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div style={{
      background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
      borderRadius: '12px', padding: '20px', marginBottom: '16px',
      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(0,75,135,0.08)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${cardBorder}` }}>
        {icon}
        <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: textPrimary }}>{title}</h3>
      </div>
      {children}
    </div>
  );

  return (
    <div style={{ padding: '24px', minHeight: '100vh', background: 'var(--bg-primary)', color: textPrimary }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/cases')}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px',
            background: cardBg, border: `1px solid ${cardBorder}`, borderRadius: '8px',
            color: textMuted, fontSize: '13px', cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}
        >
          <ArrowLeft size={14} /> Back to Registry
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, fontSize: '20px', color: isDark ? '#A8CAFF' : '#004B87' }}>{caseData.id}</h1>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '3px 12px', borderRadius: '20px', background: status.bg, color: status.text }}>{caseData.status}</span>
          </div>
          <p style={{ fontSize: '13px', color: textMuted }}>{caseData.type} · {caseData.station} · {caseData.date}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Case Overview */}
        <SectionCard title="Case Overview" icon={<FileText size={16} color="#3B82F6" />}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'FIR Number', value: caseData.id, mono: true },
              { label: 'Police Station', value: caseData.station, mono: false },
              { label: 'Date & Time', value: `${caseData.date} ${caseData.time}`, mono: true },
              { label: 'IO Assigned', value: caseData.io, mono: false },
              { label: 'Crime Type', value: caseData.type, mono: false },
              { label: 'Ward', value: caseData.ward, mono: false },
            ].map(item => (
              <div key={item.label}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, fontFamily: item.mono ? 'JetBrains Mono' : undefined }}>{item.value}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: '4px' }}>Victim</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>{caseData.victim}</div>
            </div>
            <div style={{ padding: '12px', background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', marginBottom: '4px' }}>Accused</div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: textPrimary }}>{caseData.accused}</div>
            </div>
          </div>
        </SectionCard>

        {/* Statutory Sections */}
        <SectionCard title="Statutory Law Sections" icon={<BookOpen size={16} color="#8B5CF6" />}>
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', color: textMuted, marginBottom: '12px' }}>Applicable sections under BNS / BNSS / BSA:</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {caseData.sections.map(section => (
                <span
                  key={section}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700,
                    fontFamily: 'JetBrains Mono',
                    background: 'rgba(139,92,246,0.12)', color: '#8B5CF6',
                    border: '1px solid rgba(139,92,246,0.25)',
                  }}
                >
                  {section}
                </span>
              ))}
            </div>
          </div>

          {/* Section descriptions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {[
              { code: 'BNS', full: 'Bharatiya Nyaya Sanhita, 2023', color: '#3B82F6' },
              { code: 'BNSS', full: 'Bharatiya Nagarik Suraksha Sanhita, 2023', color: '#10B981' },
              { code: 'BSA', full: 'Bharatiya Sakshya Adhiniyam, 2023', color: '#F59E0B' },
            ].map(law => (
              <div key={law.code} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: law.color, fontFamily: 'JetBrains Mono', minWidth: '40px' }}>{law.code}</span>
                <span style={{ fontSize: '11px', color: textMuted }}>{law.full}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Case Diary Timeline */}
      <div style={{
        background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
        borderRadius: '12px', padding: '20px', marginBottom: '16px',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(0,75,135,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${cardBorder}` }}>
          <Clock size={16} color="#F59E0B" />
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: textPrimary }}>Case Diary Timeline</h3>
        </div>
        <div style={{ position: 'relative', paddingLeft: '28px' }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: '7px', top: '8px',
            width: '2px', bottom: '8px',
            background: isDark ? 'rgba(168,202,255,0.1)' : 'rgba(0,75,135,0.1)',
          }} />
          {timeline.map((entry, idx) => (
            <div key={idx} style={{ position: 'relative', marginBottom: idx === timeline.length - 1 ? 0 : '20px' }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: '-25px', top: '3px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: TIMELINE_COLORS[entry.type],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 0 3px ${isDark ? '#0d1b2e' : '#fff'}, 0 0 0 4px ${TIMELINE_COLORS[entry.type]}30`,
              }}>
                {TIMELINE_ICONS[entry.type]}
              </div>
              <div style={{
                padding: '12px 16px', borderRadius: '10px',
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,75,135,0.03)',
                border: `1px solid ${isDark ? 'rgba(168,202,255,0.07)' : 'rgba(0,75,135,0.08)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: textMuted }}>{entry.date} {entry.time}</span>
                  <span style={{ fontSize: '11px', color: textMuted }}>— {entry.officer}</span>
                </div>
                <p style={{ fontSize: '13px', color: textPrimary, lineHeight: 1.5 }}>{entry.event}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence Log */}
      <div style={{
        background: cardBg, backdropFilter: 'blur(12px)', border: `1px solid ${cardBorder}`,
        borderRadius: '12px', padding: '20px',
        boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(0,75,135,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: `1px solid ${cardBorder}` }}>
          <Camera size={16} color="#3B82F6" />
          <h3 style={{ fontFamily: 'Montserrat', fontWeight: 700, fontSize: '14px', color: textPrimary }}>Evidence Log</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
          {evidence.map(ev => (
            <div key={ev.id} style={{
              padding: '14px', borderRadius: '10px',
              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,75,135,0.03)',
              border: `1px solid ${isDark ? 'rgba(168,202,255,0.08)' : 'rgba(0,75,135,0.08)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: 'JetBrains Mono', fontSize: '12px', fontWeight: 700, color: isDark ? '#A8CAFF' : '#004B87' }}>{ev.id}</span>
                <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(59,130,246,0.15)', color: '#3B82F6', fontWeight: 600 }}>{ev.type}</span>
              </div>
              <p style={{ fontSize: '12px', color: textPrimary, marginBottom: '8px', lineHeight: 1.4 }}>{ev.description}</p>
              <div style={{ fontSize: '11px', color: textMuted }}>Collected: {ev.collected} · {ev.officer}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
