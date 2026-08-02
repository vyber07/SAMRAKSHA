import React, { useEffect, useState } from 'react';
import { Gavel, Search, BookOpen, FileCheck, HelpCircle, Shield, Download } from 'lucide-react';
import { GlassCard, GlassPanel, Input, Select, Badge, Button } from '../ui';
import { legalApi } from '../../lib/api';
import { LegalSection } from '../../lib/types';

export const LegalReferenceView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sections, setSections] = useState<LegalSection[]>([]);
  useEffect(() => { legalApi.getBnsSections(searchQuery).then(setSections).catch(() => setSections([])); }, [searchQuery]);

  const filteredSections = sections.filter((sec) => {
    const matchesCategory = categoryFilter === 'all' || sec.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSearch =
      sec.bns_section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.bns_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.ipc_section.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold font-montserrat text-on-surface flex items-center gap-2">
          <Gavel className="text-primary" size={28} />
          BNS 2023 / IPC Legal Reference Database
        </h2>
        <p className="text-sm text-on-surface-variant font-inter mt-1">
          Comparative section mapping between Bharatiya Nyaya Sanhita (BNS) 2023 and Indian Penal Code (IPC 1860)
        </p>
      </div>

      <GlassPanel>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search BNS section, title, or IPC equivalent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </div>
          <div className="w-full md:w-64">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Categories' },
                { value: 'Offences Against Body', label: 'Offences Against Body' },
                { value: 'Offences Against Property', label: 'Offences Against Property' },
                { value: 'Cyber & Fraud', label: 'Cyber & Fraud' },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSections.map((sec) => (
            <GlassCard key={sec.id} variant="raised" className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge variant="primary" className="font-mono text-xs">
                  {sec.bns_section}
                </Badge>
                <span className="text-xs font-mono text-on-surface-variant bg-surface-variant/50 px-2 py-0.5 rounded-md">
                  IPC Equivalent: <strong className="text-primary">{sec.ipc_section}</strong>
                </span>
              </div>

              <div>
                <h4 className="font-montserrat font-bold text-base text-on-surface mb-1">{sec.bns_title}</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">{sec.description}</p>
              </div>

              <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between text-xs">
                <span className="text-on-surface-variant font-medium">Punishment: <strong className="text-on-surface">{sec.punishment}</strong></span>
                <Badge variant={sec.bailable ? 'success' : 'error'}>
                  {sec.bailable ? 'Bailable' : 'Non-Bailable'}
                </Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
};
