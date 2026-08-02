import React, { useState } from 'react';
import { ShieldCheck, Users, Key, Activity, Settings, UserPlus, Trash2, Edit2, Lock, ShieldAlert } from 'lucide-react';
import { GlassCard, GlassPanel, Button, Badge, Input, Select } from '../ui';
import { mockOfficers, mockAuditLogs, mockStationSettings } from '../../lib/mockData';

export const AdminConsoleView: React.FC = () => {
  const [officers, setOfficers] = useState(mockOfficers);
  const [auditLogs] = useState(mockAuditLogs);
  const [activeTab, setActiveTab] = useState<'roster' | 'audit' | 'settings'>('roster');

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold font-montserrat text-on-surface flex items-center gap-2">
          <ShieldCheck className="text-primary" size={28} />
          Admin Console & Station Control
        </h2>
        <p className="text-sm text-on-surface-variant font-inter mt-1">
          Officer roster management, audit trail logging, and system security controls
        </p>
      </div>

      <div className="flex gap-3 border-b border-outline-variant/30 pb-3">
        <Button
          variant={activeTab === 'roster' ? 'primary' : 'glass'}
          onClick={() => setActiveTab('roster')}
        >
          <Users size={16} /> Officer Roster ({officers.length})
        </Button>
        <Button
          variant={activeTab === 'audit' ? 'primary' : 'glass'}
          onClick={() => setActiveTab('audit')}
        >
          <Activity size={16} /> Security Audit Logs
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'primary' : 'glass'}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} /> Station System Settings
        </Button>
      </div>

      {activeTab === 'roster' && (
        <GlassPanel title="Officer Roster & Role Access" subtitle="Manage station personnel authorization">
          <div className="flex flex-col gap-3">
            {officers.map((officer) => (
              <div
                key={officer.id}
                className="p-4 rounded-xl bg-surface-variant/30 border border-outline-variant/40 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center font-mono">
                    {officer.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">{officer.name}</h4>
                    <p className="text-xs text-on-surface-variant font-mono">
                      Badge: {officer.badge_no} · Station: {officer.ps_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={officer.role === 'admin' || officer.role === 'sho' ? 'primary' : 'secondary'}>
                    {officer.role.toUpperCase()}
                  </Badge>
                  <Button variant="glass" className="py-1 px-3 text-xs">
                    <Edit2 size={12} /> Edit Role
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {activeTab === 'audit' && (
        <GlassPanel title="Security & Access Audit Trail" subtitle="Cryptographically logged platform activity">
          <div className="flex flex-col gap-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-surface-variant/30 border border-outline-variant/40 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <Activity size={16} className="text-primary" />
                  <div>
                    <p className="font-bold text-on-surface">{log.action}</p>
                    <p className="text-on-surface-variant">
                      Officer: <span className="font-mono text-on-surface">{log.officer_name}</span> · Details: {log.details}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-on-surface-variant">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {activeTab === 'settings' && (
        <GlassPanel title="Police Station Global Configuration">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Station Name" value={mockStationSettings.stationName} onChange={() => {}} />
            <Input label="Jurisdiction Code" value={mockStationSettings.stationCode} onChange={() => {}} isMonospace />
            <Input label="Command Helpline Contact" value="+91 79 2563 0100" onChange={() => {}} />
            <Input label="Data Retention Policy" value="90 Days (Mandatory Audit)" onChange={() => {}} />
          </div>
        </GlassPanel>
      )}
    </div>
  );
};
