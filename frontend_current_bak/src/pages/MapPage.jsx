import React, { useState } from 'react';
import PageShell from './PageShell';
import MapComponent from '../components/MapComponent';
import { useDashboardStore } from '../lib/store';
import { Badge } from 'lucide-react';

const MOCK_WARDS = {
  "Navrangpura": { risk_score: 84, level: "HIGH", festival_flag: true, dot: "#EF4444", bg: "rgba(239,68,68,0.1)", color: "#EF4444" },
  "Maninagar":   { risk_score: 72, level: "ELEVATED", festival_flag: false, dot: "#F97316", bg: "rgba(249,115,22,0.1)", color: "#F97316" },
  "Satellite":   { risk_score: 45, level: "MEDIUM", festival_flag: false, dot: "#EAB308", bg: "rgba(234,179,8,0.1)", color: "#EAB308" },
  "Bopal":       { risk_score: 28, level: "LOW", festival_flag: false, dot: "#22C55E", bg: "rgba(34,197,94,0.1)", color: "#22C55E" },
  "Ellisbridge": { risk_score: 61, level: "MEDIUM", festival_flag: true, dot: "#EAB308", bg: "rgba(234,179,8,0.1)", color: "#EAB308" },
  "Vastrapur":   { risk_score: 35, level: "LOW", festival_flag: false, dot: "#22C55E", bg: "rgba(34,197,94,0.1)", color: "#22C55E" },
};

const MOCK_PATROL = [
  { id: "P-01", name: "Alpha-1", status: "active" },
  { id: "P-02", name: "Bravo-4", status: "responding" },
  { id: "P-03", name: "Charlie-2", status: "offline" },
];

function ScenarioSimulationControlDeck() {
  const [activePreset, setActivePreset] = useState("standard");
  const [patrolMultiplier, setPatrolMultiplier] = useState(1.5);
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [autoReroute, setAutoReroute] = useState(true);

  const presets = [
    { id: "standard", label: "Standard Operations", icon: "shield", desc: "Default precinct patrol routes & CCTV surveillance" },
    { id: "festival", label: "Navratri/Diwali Surge", icon: "festival", desc: "AI predictive crowd control & traffic divergence" },
    { id: "curfew", label: "Section 144 Curfew", icon: "gavel", desc: "Strict movement restriction & high patrol density" },
    { id: "monsoon", label: "Monsoon Disaster Relief", icon: "water_drop", desc: "SDRF coordination & waterlogging alerts" },
  ];

  return (
    <div className="glass-card" style={{ marginTop: '16px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-rounded" style={{ color: 'var(--primary)' }}>science</span>
            Module 4: Predictive Scenario Simulation Control Deck
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Test deployment strategies and AI allocation models before executing in real-world.</p>
        </div>
        <div style={{ padding: '4px 12px', backgroundColor: 'var(--warning-container)', color: 'var(--warning)', borderRadius: '12px', fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
          SIMULATION MODE
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>AI Deployment Presets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {presets.map(p => (
              <button key={p.id} onClick={() => setActivePreset(p.id)} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '12px',
                backgroundColor: activePreset === p.id ? 'var(--primary-container)' : 'var(--surface-variant)',
                border: `1px solid ${activePreset === p.id ? 'var(--primary)' : 'var(--border)'}`,
                textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s'
              }}>
                <span className="material-symbols-rounded" style={{ color: activePreset === p.id ? 'var(--primary)' : 'var(--text-muted)', fontSize: '20px' }}>{p.icon}</span>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: activePreset === p.id ? 'var(--primary)' : 'var(--text)', margin: 0 }}>{p.label}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '16px', borderRadius: '12px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Simulation Variables</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Patrol Density Multiplier</span>
              <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{patrolMultiplier}x</span>
            </div>
            <input type="range" min="0.5" max="3" step="0.1" value={patrolMultiplier} onChange={(e) => setPatrolMultiplier(e.target.value)} style={{ width: '100%', accentColor: 'var(--primary)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>Low (0.5x)</span><span>High (3.0x)</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Auto-Dispatch Risk Threshold</span>
              <span style={{ color: 'var(--error)', fontWeight: 700 }}>{riskThreshold} / 100</span>
            </div>
            <input type="range" min="40" max="95" step="1" value={riskThreshold} onChange={(e) => setRiskThreshold(e.target.value)} style={{ width: '100%', accentColor: 'var(--error)' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
            <input type="checkbox" checked={autoReroute} onChange={(e) => setAutoReroute(e.target.checked)} style={{ width: '16px', height: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>AI Auto-Reroute Patrols</span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Dynamically shift units based on live CCTV and CAD calls</span>
            </div>
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', borderRadius: '12px', backgroundColor: 'var(--surface-variant)', border: '1px solid var(--border)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--info-container)', color: 'var(--info)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '32px' }}>psychology</span>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0', textAlign: 'center' }}>Ready to Run</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '24px' }}>Execute simulation to generate hypothetical outcomes and resource stress tests.</p>
          <button className="btn-primary" style={{ width: '100%', padding: '12px', justifyContent: 'center', fontSize: '14px' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>play_circle</span>
            Run AI Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MapPage() {
  const [selectedWard, setSelectedWard] = useState(null);
  const [filterDays, setFilterDays] = useState(7);
  const wards = Object.entries(MOCK_WARDS);

  return (
    <PageShell title="Command Center Map">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 8rem)' }}>
        
        <div style={{ display: 'flex', gap: '16px', flex: 1, minHeight: 0 }}>
          
          {/* Left panel */}
          <div style={{ width: '280px', flexShrink: 0, display: window.innerWidth > 1024 ? 'flex' : 'none', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
            
            {/* Ward Risk Scores */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>Ward Risk Scores</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {wards.map(([name, data], idx) => (
                  <button key={name} onClick={() => setSelectedWard(selectedWard === name ? null : name)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px',
                    borderBottom: idx < wards.length - 1 ? '1px solid var(--border)' : 'none',
                    backgroundColor: selectedWard === name ? 'var(--primary-container)' : 'transparent',
                    border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: data.dot }} />
                      <span style={{ fontSize: '13px', color: 'var(--text)' }}>{name}</span>
                      {data.festival_flag && <span title="Festival active">🎉</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: data.color }}>{data.risk_score}</span>
                      <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: data.bg, color: data.color, fontWeight: 700 }}>{data.level}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filters */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 12px 0' }}>Filters</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Days: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{filterDays}</span></label>
                  <input type="range" min="1" max="90" value={filterDays} onChange={(e) => setFilterDays(e.target.value)} style={{ width: '100%', accentColor: 'var(--primary)' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Crime Type</label>
                  <select className="input-glass">
                    <option value="">All Types</option>
                    {["Theft","Assault","Robbery","Cyber Crime","Stalking","Murder"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Patrol Units */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: '0 0 12px 0' }}>Patrol Units</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {MOCK_PATROL.map(unit => (
                  <div key={unit.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--surface-variant)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '16px', color: unit.status === 'active' ? 'var(--success)' : unit.status === 'responding' ? 'var(--error)' : 'var(--text-muted)' }}>local_police</span>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{unit.name}</span>
                    </div>
                    <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700,
                      backgroundColor: unit.status === 'active' ? 'var(--success-container)' : unit.status === 'responding' ? 'var(--error-container)' : 'var(--surface)',
                      color: unit.status === 'active' ? 'var(--success)' : unit.status === 'responding' ? 'var(--error)' : 'var(--text-muted)'
                    }}>{unit.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CCTV Alerts */}
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>CCTV Alerts</h3>
                <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: 'var(--warning-container)', color: 'var(--warning)', fontSize: '11px', fontWeight: 700 }}>3</span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Active camera alerts in the last 24 hours</p>
            </div>

          </div>

          {/* Map Area */}
          <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
            <MapComponent height="100%" filterSeverity="All" />
          </div>

        </div>

        {/* Scenario Simulator */}
        <ScenarioSimulationControlDeck />

      </div>
    </PageShell>
  );
}
