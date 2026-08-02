import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Eye,
  FileText,
  MapPin,
  Calendar,
  User,
  Shield,
  Grid,
  List,
  RefreshCw,
  MessageSquare,
  Send,
  Lock,
  Tag,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { casesApi } from '../../lib/api';
import { CaseFIR, CaseStatus, CasePriority } from '../../lib/types';
import { GlassCard } from '../ui/GlassCard';
import { GlassPanel } from '../ui/GlassPanel';
import { GlassModal } from '../ui/GlassModal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Badge } from '../ui/Badge';
import { AlertCard } from '../ui/AlertCard';

// Municipal Ward Options for Ahmedabad City
const AHMEDABAD_WARDS = [
  'Navrangpura',
  'Kalupur (Walled City)',
  'Jamalpur',
  'Satellite',
  'Bodakdev',
  'Ellisbridge',
  'Paldi',
  'Maninagar',
  'Shahibaug',
  'Vastrapur',
  'Nikol',
  'Ghatlodiya',
  'Thaltej',
];

// Available Crime Categories
const CRIME_TYPES = [
  'Robbery Attempt',
  'Commercial Burglary',
  'Vehicle Theft',
  'Cyber Fraud',
  'Chain Snatching',
  'Armed Robbery',
  'Physical Assault',
  'Narcotics Possession',
  'Extortion Demand',
  'General Offence',
];

export interface CaseManagementViewProps {
  initialCaseId?: string;
  initialAction?: string;
  className?: string;
}

export const CaseManagementView: React.FC<CaseManagementViewProps> = ({
  initialCaseId,
  initialAction,
  className = '',
}) => {
  const { user, role } = useAuth();

  // Data & Loading States
  const [cases, setCases] = useState<CaseFIR[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [crimeTypeFilter, setCrimeTypeFilter] = useState<string>('all');
  const [wardFilter, setWardFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal States
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(initialAction === 'create');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedCase, setSelectedCase] = useState<CaseFIR | null>(null);

  // Action States inside Modals
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [addingNote, setAddingNote] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [submittingFir, setSubmittingFir] = useState<boolean>(false);

  // New FIR Form Controlled State
  const [firForm, setFirForm] = useState({
    fir_no: `FIR/NAV/2026/${Math.floor(1000 + Math.random() * 9000)}`,
    ps_name: user?.ps_name || 'Navrangpura Police Station',
    crime_type: 'Robbery Attempt',
    bns_sections: 'Section 309, Section 311',
    ipc_sections: 'IPC Section 392, IPC Section 397',
    complainant_name: '',
    complainant_phone: '',
    incident_date: new Date().toISOString().slice(0, 16),
    address: '',
    ward: 'Navrangpura',
    lat: '23.0380',
    lng: '72.5640',
    description: '',
    io_name: user?.name || 'Sub-Inspector Anita Roy',
    priority: 'medium' as CasePriority,
  });

  // Role-Based Privileges (RBAC)
  const canRegisterFir = useMemo(() => ['io', 'sho', 'dcp', 'admin'].includes(role), [role]);
  const canUpdateStatus = useMemo(() => ['io', 'sho', 'dcp', 'admin'].includes(role), [role]);
  const canAddNotes = useMemo(() => ['io', 'sho', 'dcp', 'admin'].includes(role), [role]);

  // Load Cases Data
  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await casesApi.getCases();
      setCases(data);

      if (initialCaseId) {
        const found = data.find((c) => c.id === initialCaseId || c.fir_no === initialCaseId);
        if (found) {
          setSelectedCase(found);
          setIsDetailModalOpen(true);
        }
      }
    } catch (err: any) {
      console.error('[CaseManagementView] Error fetching cases:', err);
      setError('Could not load FIR cases from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [initialCaseId]);

  // Filtered Cases Logic
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          c.fir_no.toLowerCase().includes(q) ||
          c.crime_type.toLowerCase().includes(q) ||
          c.complainant_name.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.io_name.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q) ||
          c.bns_sections.some((s) => s.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }
      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }
      // Crime Type filter
      if (crimeTypeFilter !== 'all' && c.crime_type !== crimeTypeFilter) {
        return false;
      }
      // Ward filter
      if (wardFilter !== 'all' && !c.location.ward.toLowerCase().includes(wardFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [cases, searchQuery, statusFilter, crimeTypeFilter, wardFilter]);

  // KPI Metrics Summary Calculation
  const metrics = useMemo(() => {
    const total = cases.length;
    const pending = cases.filter((c) => c.status === 'pending').length;
    const active = cases.filter((c) => c.status === 'under_investigation').length;
    const chargesheeted = cases.filter((c) => c.status === 'chargesheeted').length;
    const closed = cases.filter((c) => c.status === 'closed').length;
    return { total, pending, active, chargesheeted, closed };
  }, [cases]);

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCrimeTypeFilter('all');
    setWardFilter('all');
  };

  // Open Case Detail Modal
  const handleOpenDetail = (c: CaseFIR) => {
    setSelectedCase(c);
    setIsDetailModalOpen(true);
  };

  // Status Badge Variant Helper
  const getStatusBadgeVariant = (status: CaseStatus) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'under_investigation':
        return 'info';
      case 'chargesheeted':
        return 'secondary';
      case 'closed':
        return 'success';
      default:
        return 'neutral';
    }
  };

  // Status Display Label Helper
  const formatStatusLabel = (status: CaseStatus) => {
    switch (status) {
      case 'pending':
        return 'Pending FIR';
      case 'under_investigation':
        return 'Under Investigation';
      case 'chargesheeted':
        return 'Chargesheeted';
      case 'closed':
        return 'Case Closed';
      default:
        return status;
    }
  };

  // Priority Badge Variant Helper
  const getPriorityBadgeVariant = (priority?: CasePriority) => {
    switch (priority) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'primary';
      case 'low':
        return 'glass';
      default:
        return 'neutral';
    }
  };

  // Submit New FIR Form
  const handleCreateFirSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canRegisterFir) {
      setFeedbackMsg({ type: 'error', text: 'Access Denied: Constables cannot register new FIRs.' });
      return;
    }

    if (!firForm.complainant_name || !firForm.complainant_phone || !firForm.description || !firForm.address) {
      setFeedbackMsg({ type: 'error', text: 'Please fill in all required fields marked with *.' });
      return;
    }

    try {
      setSubmittingFir(true);
      const bnsArray = firForm.bns_sections.split(',').map((s) => s.trim()).filter(Boolean);
      const ipcArray = firForm.ipc_sections.split(',').map((s) => s.trim()).filter(Boolean);

      const newCaseData: Partial<CaseFIR> = {
        fir_no: firForm.fir_no,
        ps_name: firForm.ps_name,
        crime_type: firForm.crime_type,
        bns_sections: bnsArray,
        ipc_sections: ipcArray,
        complainant_name: firForm.complainant_name,
        complainant_phone: firForm.complainant_phone,
        incident_date: new Date(firForm.incident_date).toISOString(),
        description: firForm.description,
        io_name: firForm.io_name,
        priority: firForm.priority,
        status: 'pending',
        location: {
          address: firForm.address,
          ward: firForm.ward,
          lat: parseFloat(firForm.lat) || 23.0380,
          lng: parseFloat(firForm.lng) || 72.5640,
        },
      };

      const created = await casesApi.createFIR(newCaseData);
      setCases((prev) => [created, ...prev]);
      setIsRegisterModalOpen(false);
      setFeedbackMsg({ type: 'success', text: `FIR ${created.fir_no} successfully registered!` });

      // Reset form draft
      setFirForm({
        fir_no: `FIR/NAV/2026/${Math.floor(1000 + Math.random() * 9000)}`,
        ps_name: user?.ps_name || 'Navrangpura Police Station',
        crime_type: 'Robbery Attempt',
        bns_sections: 'Section 309, Section 311',
        ipc_sections: 'IPC Section 392, IPC Section 397',
        complainant_name: '',
        complainant_phone: '',
        incident_date: new Date().toISOString().slice(0, 16),
        address: '',
        ward: 'Navrangpura',
        lat: '23.0380',
        lng: '72.5640',
        description: '',
        io_name: user?.name || 'Sub-Inspector Anita Roy',
        priority: 'medium',
      });
    } catch (err) {
      console.error('[CaseManagementView] Failed to register FIR:', err);
      setFeedbackMsg({ type: 'error', text: 'Failed to record FIR registration.' });
    } finally {
      setSubmittingFir(false);
    }
  };

  // Update Case Investigation Status
  const handleUpdateStatus = async (newStatus: CaseStatus) => {
    if (!selectedCase || !canUpdateStatus) return;
    try {
      setUpdatingStatus(true);
      const updated = await casesApi.updateCaseStatus(selectedCase.id, newStatus);
      setSelectedCase(updated);
      setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setFeedbackMsg({ type: 'success', text: `Case status updated to ${formatStatusLabel(newStatus)}.` });
    } catch (err) {
      console.error('[CaseManagementView] Error updating status:', err);
      setFeedbackMsg({ type: 'error', text: 'Failed to update case status.' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Add Digital Diary Note
  const handleAddDiaryNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newNoteText.trim() || !canAddNotes) return;
    try {
      setAddingNote(true);
      const authorName = user ? `${user.name} (${user.role.toUpperCase()})` : 'Authorized Officer';
      const updated = await casesApi.addDiaryNote(selectedCase.id, newNoteText.trim(), authorName);
      setSelectedCase(updated);
      setCases((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setNewNoteText('');
      setFeedbackMsg({ type: 'success', text: 'Digital diary note logged.' });
    } catch (err) {
      console.error('[CaseManagementView] Failed to add note:', err);
      setFeedbackMsg({ type: 'error', text: 'Failed to record diary entry.' });
    } finally {
      setAddingNote(false);
    }
  };

  return (
    <div className={`space-y-6 pb-12 ${className}`}>
      {/* 1. Header & Action Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-montserrat font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight">
              FIR & Case Management
            </h1>
            <Badge variant="primary" size="md" icon={<BookOpen className="w-3.5 h-3.5" />}>
              CCTNS Integrated
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-inter mt-1">
            First Information Reports, BNS 2023 legal section tagging, and digital case diary for Ahmedabad Police
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#004B87] text-[#004B87] dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-[#004B87] text-[#004B87] dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          {/* Refresh Data */}
          <Button variant="glass" size="md" onClick={fetchCases} isLoading={loading} title="Reload Cases">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Register New FIR Button (RBAC Controlled) */}
          <Button
            variant="primary"
            size="md"
            leftIcon={canRegisterFir ? Plus : Lock}
            onClick={() => setIsRegisterModalOpen(true)}
            disabled={!canRegisterFir}
            title={canRegisterFir ? 'Register New FIR' : 'Constables cannot register FIRs'}
          >
            Register New FIR
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <AlertCard
          variant={feedbackMsg.type === 'success' ? 'success' : 'error'}
          title={feedbackMsg.type === 'success' ? 'Operation Completed' : 'System Notice'}
          onClose={() => setFeedbackMsg(null)}
        >
          {feedbackMsg.text}
        </AlertCard>
      )}

      {/* 2. Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-[#004B87] dark:border-l-[#A8CAFF]">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">Total Cases</div>
          <div className="text-2xl font-montserrat font-bold text-slate-900 dark:text-white mt-1">{metrics.total}</div>
          <div className="text-[10px] text-slate-400 font-inter mt-1">Logged across all wards</div>
        </GlassCard>

        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-[#F57C00] dark:border-l-[#FFB74D]">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">Pending FIRs</div>
          <div className="text-2xl font-montserrat font-bold text-amber-600 dark:text-amber-400 mt-1">{metrics.pending}</div>
          <div className="text-[10px] text-slate-400 font-inter mt-1">Awaiting IO review</div>
        </GlassCard>

        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-[#0288D1] dark:border-l-[#64B5F6]">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">Under Investigation</div>
          <div className="text-2xl font-montserrat font-bold text-sky-600 dark:text-sky-400 mt-1">{metrics.active}</div>
          <div className="text-[10px] text-slate-400 font-inter mt-1">Active evidence gathering</div>
        </GlassCard>

        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-[#006B5E] dark:border-l-[#80F7EB]">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">Chargesheeted</div>
          <div className="text-2xl font-montserrat font-bold text-teal-600 dark:text-teal-400 mt-1">{metrics.chargesheeted}</div>
          <div className="text-[10px] text-slate-400 font-inter mt-1">Submitted to Magistrate</div>
        </GlassCard>

        <GlassCard variant="raised" padding="sm" className="border-l-4 border-l-[#2E7D32] dark:border-l-[#81C784]">
          <div className="text-xs font-montserrat font-medium text-slate-500 dark:text-slate-400">Cases Closed</div>
          <div className="text-2xl font-montserrat font-bold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.closed}</div>
          <div className="text-[10px] text-slate-400 font-inter mt-1">Resolved or acquitted</div>
        </GlassCard>
      </div>

      {/* 3. Filter & Search Toolbar */}
      <GlassPanel variant="subtle" padding="md" className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <Input
            placeholder="Search FIR No., BNS Section, Complainant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            leftIcon={Search}
            inputSize="md"
            variant="field"
          />

          {/* Status Dropdown Filter */}
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            selectSize="md"
            variant="field"
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'pending', label: 'Pending FIR' },
              { value: 'under_investigation', label: 'Under Investigation' },
              { value: 'chargesheeted', label: 'Chargesheeted' },
              { value: 'closed', label: 'Closed' },
            ]}
          />

          {/* Crime Category Filter */}
          <Select
            value={crimeTypeFilter}
            onChange={(e) => setCrimeTypeFilter(e.target.value)}
            selectSize="md"
            variant="field"
            options={[
              { value: 'all', label: 'All Crime Categories' },
              ...CRIME_TYPES.map((t) => ({ value: t, label: t })),
            ]}
          />

          {/* Ward Filter */}
          <Select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            selectSize="md"
            variant="field"
            options={[
              { value: 'all', label: 'All Municipal Wards' },
              ...AHMEDABAD_WARDS.map((w) => ({ value: w, label: w })),
            ]}
          />
        </div>

        {/* Active Filter Pills Status Bar */}
        {(searchQuery || statusFilter !== 'all' || crimeTypeFilter !== 'all' || wardFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 flex-wrap font-inter">
              <span className="text-slate-500">Active Filters:</span>
              {searchQuery && <Badge variant="primary" size="sm">Search: "{searchQuery}"</Badge>}
              {statusFilter !== 'all' && <Badge variant="info" size="sm">Status: {formatStatusLabel(statusFilter as CaseStatus)}</Badge>}
              {crimeTypeFilter !== 'all' && <Badge variant="secondary" size="sm">Category: {crimeTypeFilter}</Badge>}
              {wardFilter !== 'all' && <Badge variant="warning" size="sm">Ward: {wardFilter}</Badge>}
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#004B87] dark:text-[#A8CAFF] hover:underline font-semibold text-xs shrink-0"
            >
              Reset Filters
            </button>
          </div>
        )}
      </GlassPanel>

      {/* 4. Main Content Display (Data Table vs Card Grid) */}
      {loading ? (
        <div className="py-16 text-center space-y-3 font-inter">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#004B87] dark:text-[#A8CAFF]" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Fetching FIR database records...</p>
        </div>
      ) : filteredCases.length === 0 ? (
        <GlassCard variant="flat" className="py-16 text-center space-y-4 font-inter">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-montserrat font-bold text-slate-900 dark:text-white">No FIR Cases Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              No FIR records match your active search filters. Try adjusting your query or reset filters.
            </p>
          </div>
          <Button variant="glass" size="sm" onClick={handleResetFilters}>
            Reset Filters
          </Button>
        </GlassCard>
      ) : viewMode === 'table' ? (
        /* DATA TABLE VIEW */
        <GlassPanel variant="default" padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700 text-xs font-montserrat font-semibold text-slate-700 dark:text-slate-300">
                  <th className="py-3.5 px-4">FIR Number</th>
                  <th className="py-3.5 px-4">Crime Category</th>
                  <th className="py-3.5 px-4">Location & Ward</th>
                  <th className="py-3.5 px-4">BNS Sections</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">IO Assigned</th>
                  <th className="py-3.5 px-4">Reported Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60 text-xs font-inter">
                {filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    onClick={() => handleOpenDetail(c)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-[#004B87] dark:text-[#A8CAFF]">
                      {c.fir_no}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                      {c.crime_type}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]" title={c.location.address}>
                          {c.location.ward}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1 flex-wrap">
                        {c.bns_sections.slice(0, 2).map((s, idx) => (
                          <Badge key={idx} variant="glass" size="sm">
                            {s}
                          </Badge>
                        ))}
                        {c.bns_sections.length > 2 && (
                          <span className="text-[10px] text-slate-400">+{c.bns_sections.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getStatusBadgeVariant(c.status)} size="sm" dot>
                        {formatStatusLabel(c.status)}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {c.io_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(c.reported_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="glass"
                        size="sm"
                        leftIcon={Eye}
                        onClick={() => handleOpenDetail(c)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map((c) => (
            <GlassCard
              key={c.id}
              variant="raised"
              clickable
              onClick={() => handleOpenDetail(c)}
              borderAccent={
                c.status === 'pending'
                  ? 'warning'
                  : c.status === 'under_investigation'
                  ? 'info'
                  : c.status === 'chargesheeted'
                  ? 'primary'
                  : 'success'
              }
              className="flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#004B87] dark:text-[#A8CAFF]">
                      {c.fir_no}
                    </span>
                    <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white mt-0.5">
                      {c.crime_type}
                    </h3>
                  </div>
                  <Badge variant={getStatusBadgeVariant(c.status)} size="sm">
                    {formatStatusLabel(c.status)}
                  </Badge>
                </div>

                {/* Meta Information */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-300 font-inter">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={c.location.address}>
                      {c.location.address} ({c.location.ward})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>IO: {c.io_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      Reported: {new Date(c.reported_date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* BNS Sections Pills */}
                <div className="mt-3 flex items-center gap-1 flex-wrap">
                  {c.bns_sections.map((s, idx) => (
                    <Badge key={idx} variant="glass" size="sm">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
                <Badge variant={getPriorityBadgeVariant(c.priority)} size="sm">
                  {c.priority ? `${c.priority.toUpperCase()} PRIORITY` : 'MEDIUM'}
                </Badge>
                <span className="text-xs font-semibold text-[#004B87] dark:text-[#A8CAFF] flex items-center gap-1">
                  Inspect <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* 5. MODAL 1: REGISTER NEW FIR DIALOG */}
      <GlassModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register New First Information Report (FIR)"
        subtitle="CCTNS Form 1 - Electronic Registration under Bharatiya Nagarik Suraksha Sanhita (BNSS)"
        size="xl"
      >
        <form onSubmit={handleCreateFirSubmit} className="space-y-6 font-inter">
          {/* Section 1: Metadata */}
          <div className="space-y-3">
            <h3 className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. FIR Registration Metadata
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="FIR Number (Auto Draft)"
                value={firForm.fir_no}
                onChange={(e) => setFirForm({ ...firForm, fir_no: e.target.value })}
                isMonospace
                required
              />
              <Input
                label="Police Station"
                value={firForm.ps_name}
                onChange={(e) => setFirForm({ ...firForm, ps_name: e.target.value })}
                required
              />
              <Input
                label="Incident Date & Time"
                type="datetime-local"
                value={firForm.incident_date}
                onChange={(e) => setFirForm({ ...firForm, incident_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Section 2: Statutory Classification */}
          <div className="space-y-3">
            <h3 className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              2. Crime & Statutory Provisions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Crime Category"
                value={firForm.crime_type}
                onChange={(e) => setFirForm({ ...firForm, crime_type: e.target.value })}
                options={CRIME_TYPES.map((t) => ({ value: t, label: t }))}
              />
              <Input
                label="BNS 2023 Sections"
                placeholder="e.g. Section 303(2), Section 309"
                value={firForm.bns_sections}
                onChange={(e) => setFirForm({ ...firForm, bns_sections: e.target.value })}
                helperText="Comma separated BNS sections"
                required
              />
              <Input
                label="IPC Sections (Equivalent)"
                placeholder="e.g. IPC Section 379, 392"
                value={firForm.ipc_sections}
                onChange={(e) => setFirForm({ ...firForm, ipc_sections: e.target.value })}
                helperText="Legacy IPC reference cross-walk"
              />
            </div>
          </div>

          {/* Section 3: Complainant Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              3. Complainant Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Complainant Full Name *"
                placeholder="Enter full legal name"
                value={firForm.complainant_name}
                onChange={(e) => setFirForm({ ...firForm, complainant_name: e.target.value })}
                required
              />
              <Input
                label="Contact Phone Number *"
                placeholder="+91 98000 00000"
                value={firForm.complainant_phone}
                onChange={(e) => setFirForm({ ...firForm, complainant_phone: e.target.value })}
                required
              />
              <Select
                label="Priority Severity"
                value={firForm.priority}
                onChange={(e) => setFirForm({ ...firForm, priority: e.target.value as CasePriority })}
                options={[
                  { value: 'low', label: 'Low Priority' },
                  { value: 'medium', label: 'Medium Priority' },
                  { value: 'high', label: 'High Priority' },
                  { value: 'critical', label: 'Critical Emergency' },
                ]}
              />
            </div>
          </div>

          {/* Section 4: Incident Location */}
          <div className="space-y-3">
            <h3 className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              4. Geographic Incident Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Input
                  label="Incident Address / Landmark *"
                  placeholder="e.g. Near Swastik Cross Roads, C.G. Road"
                  value={firForm.address}
                  onChange={(e) => setFirForm({ ...firForm, address: e.target.value })}
                  required
                />
              </div>
              <Select
                label="Municipal Ward *"
                value={firForm.ward}
                onChange={(e) => setFirForm({ ...firForm, ward: e.target.value })}
                options={AHMEDABAD_WARDS.map((w) => ({ value: w, label: w }))}
              />
            </div>
          </div>

          {/* Section 5: Narrative Statement */}
          <div className="space-y-3">
            <h3 className="text-xs font-montserrat font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              5. Incident Statement & Narrative Description *
            </h3>
            <Textarea
              placeholder="Provide complete details of the alleged offence, sequence of events, suspect description..."
              value={firForm.description}
              onChange={(e) => setFirForm({ ...firForm, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* Section 6: IO Assignment & Submit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <Input
              label="Assigned Investigating Officer (IO)"
              value={firForm.io_name}
              onChange={(e) => setFirForm({ ...firForm, io_name: e.target.value })}
              required
            />
            <div className="flex items-end justify-end gap-3 pt-2">
              <Button type="button" variant="glass" onClick={() => setIsRegisterModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={submittingFir}>
                Log & Register FIR
              </Button>
            </div>
          </div>
        </form>
      </GlassModal>

      {/* 6. MODAL 2: CASE DETAIL & DIGITAL DIARY VIEWER */}
      {selectedCase && (
        <GlassModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg font-bold text-[#004B87] dark:text-[#A8CAFF]">
                {selectedCase.fir_no}
              </span>
              <Badge variant={getStatusBadgeVariant(selectedCase.status)}>
                {formatStatusLabel(selectedCase.status)}
              </Badge>
            </div>
          }
          subtitle={`Logged at ${selectedCase.ps_name}`}
          size="xl"
        >
          <div className="space-y-6 font-inter">
            {/* Top Quick Status Update Action Bar (RBAC Protected) */}
            {canUpdateStatus && (
              <div className="p-3 bg-slate-100/70 dark:bg-slate-800/70 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-montserrat font-bold text-slate-700 dark:text-slate-300">
                  Update Investigation Status:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {(['pending', 'under_investigation', 'chargesheeted', 'closed'] as CaseStatus[]).map((st) => (
                    <Button
                      key={st}
                      variant={selectedCase.status === st ? 'primary' : 'glass'}
                      size="sm"
                      isLoading={updatingStatus && selectedCase.status === st}
                      onClick={() => handleUpdateStatus(st)}
                    >
                      {formatStatusLabel(st)}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Overview Metadata Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Case Metadata */}
              <GlassPanel variant="subtle" padding="md" className="space-y-3">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#004B87] dark:text-[#A8CAFF]" />
                  Case & Crime Metadata
                </h3>
                <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Crime Category:</span>
                    <span className="font-semibold">{selectedCase.crime_type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Incident Time:</span>
                    <span>{new Date(selectedCase.incident_date).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Reported Time:</span>
                    <span>{new Date(selectedCase.reported_date).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Investigating Officer:</span>
                    <span className="font-semibold">{selectedCase.io_name}</span>
                  </div>
                </div>
              </GlassPanel>

              {/* Complainant & Location */}
              <GlassPanel variant="subtle" padding="md" className="space-y-3">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  Complainant & Location
                </h3>
                <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Complainant:</span>
                    <span className="font-semibold">{selectedCase.complainant_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Contact Number:</span>
                    <span>{selectedCase.complainant_phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/50 dark:border-slate-800/50 pb-1.5">
                    <span className="text-slate-500">Municipal Ward:</span>
                    <span className="font-semibold">{selectedCase.location.ward}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Address:</span>
                    <span className="text-right max-w-[200px] truncate" title={selectedCase.location.address}>
                      {selectedCase.location.address}
                    </span>
                  </div>
                </div>
              </GlassPanel>
            </div>

            {/* BNS Statutory Provisions Breakdown */}
            <div className="space-y-2">
              <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" />
                Bharatiya Nyaya Sanhita (BNS) Legal Provisions
              </h3>
              <div className="flex flex-wrap gap-2">
                {selectedCase.bns_sections.map((bns, idx) => (
                  <GlassPanel key={idx} variant="subtle" padding="sm" className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">{bns}</span>
                    {selectedCase.ipc_sections[idx] && (
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 border-l border-slate-300 dark:border-slate-700 pl-2">
                        IPC Equiv: {selectedCase.ipc_sections[idx]}
                      </span>
                    )}
                  </GlassPanel>
                ))}
              </div>
            </div>

            {/* Narrative Statement */}
            <div className="space-y-2">
              <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white">
                Complainant Narrative Statement
              </h3>
              <GlassPanel variant="subtle" padding="md" className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedCase.description}
              </GlassPanel>
            </div>

            {/* Digital Case Diary Timeline Section */}
            <div className="space-y-4 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
              <div className="flex items-center justify-between">
                <h3 className="font-montserrat font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#004B87] dark:text-[#A8CAFF]" />
                  Official Digital Diary Timeline ({selectedCase.diary_notes?.length || 0} entries)
                </h3>
              </div>

              {/* Diary Entries List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {selectedCase.diary_notes && selectedCase.diary_notes.length > 0 ? (
                  selectedCase.diary_notes.map((note) => (
                    <GlassPanel key={note.id} variant="subtle" padding="sm" className="space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-slate-200">{note.author}</span>
                        <span className="text-[10px]">{new Date(note.timestamp).toLocaleString('en-IN')}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{note.note}</p>
                    </GlassPanel>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">No digital diary entries logged yet.</p>
                )}
              </div>

              {/* Add New Diary Entry Form */}
              {canAddNotes ? (
                <form onSubmit={handleAddDiaryNote} className="space-y-2 pt-2">
                  <Textarea
                    placeholder="Enter official investigation progress note or case update..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      leftIcon={Send}
                      isLoading={addingNote}
                      disabled={!newNoteText.trim()}
                    >
                      Record Diary Note
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>Constable Role Read-Only: Only assigned IO, SHO, DCP, or Admin can record official diary entries.</span>
                </div>
              )}
            </div>
          </div>
        </GlassModal>
      )}
    </div>
  );
};

export default CaseManagementView;
