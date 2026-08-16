import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Shield, LayoutDashboard, Map, FolderOpen, Plus, Bot, Video,
  FileText, LogOut, Bell, Settings, Search, ChevronRight,
  AlertTriangle, Car, Camera, TrendingUp, TrendingDown,
  Eye, EyeOff, Send, RefreshCw, Download, Filter,
  Activity, Zap, Radio, CheckCircle, Clock, X, Menu,
  BarChart2, BadgeCheck, Phone, MapPin, Calendar, User,
  Gavel, Receipt, Building, ClipboardList, Scan, MessageCircle,
  ChevronLeft, Info, Globe, Wifi, WifiOff, Lock,
  ChevronDown, ChevronUp, Check, Layers, Cpu, Crosshair, AlertCircle,
  FlameKindling, UserCheck, Navigation, Siren, TriangleAlert, Edit2, Save, Upload, Trash2,
  Grid, List, FileDown, LayoutGrid, SlidersHorizontal, ExternalLink, PlayCircle, Pause,
  Maximize2, Signal, ZoomIn, Sun, Moon, ShieldCheck, Users, Key, ShieldAlert, FileCode, UserPlus
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';
import { useApp, Officer, Case, CCTVAlert, PatrolUnit, CaseStatus, Role, DiaryEntry, Button, Card, Input, Select, Modal, Badge, Chip, QuickViewModal, CrimeGPTDocumentStudio, STATUS_CONFIG, RISK_CONFIG, ROLE_CONFIG, PREDICTIVE_HEATMAP_ZONES, downloadCasesCSV, AppCtx, cn, WS_COLOR, CreatedDocument, NAV_ITEMS, CAMERA_FEEDS, RolePermission, formatDateTime, SegmentedChartCard, HoverTooltip, WSMessage, GenerateDocumentModalProps, PageHeader, Page, createGoogleTeardropPin, ChatMsg, ALERT_COLOR, AdminUser, CCTV_LOCATIONS, LiveCameraGrid, ScenarioSimulationControlDeck, AHMEDABAD_WARD_LOCATIONS, StatCard, TRANSLATIONS, Ctx, Sidebar, RealAhmedabadOpenStreetMap, TopBar, BottomNav, VoiceInputWidget, IAMPolicy, CHART_COLORS, PatrolUnitFull, AICoPilotWidget, NavItem, AHMEDABAD_WARDS, formatTime, formatDate, GenerateDocumentModal, PatrolRouteFull, AppShell, INITIAL_ADMIN_USERS, INITIAL_AUDIT_LOGS, INITIAL_PERMISSIONS, INITIAL_IAM_POLICIES, AuditLog, timeAgo } from '../App';
export default function CasesPage() {
  const { navigate, officer, cases, patrols, cctvAlerts } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [crimeFilter, setCrimeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [quickCase, setQuickCase] = useState<Case | null>(null);

  const crimeTypes = Array.from(new Set(cases.map((c) => c.crime_type)));

  const filtered = cases.filter((c) => {
    const q = search.toLowerCase();
    const matchQ = !search || c.fir_no.toLowerCase().includes(q) || c.victim_name.toLowerCase().includes(q) || c.crime_type.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || c.case_status === statusFilter;
    const matchC = crimeFilter === "all" || c.crime_type === crimeFilter;
    return matchQ && matchS && matchC;
  });

  function exportCSV() {
    const header = ["FIR No", "Victim", "Crime Type", "Date", "Status", "IO", "Location"];
    const rows = filtered.map((c) => [c.fir_no, c.victim_name, c.crime_type, formatDate(c.crime_date), c.case_status, c.io_badge || "", c.crime_location]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "cases_export.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  if (officer?.role === "constable") {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 400 }}>
        <Lock size={32} color="#64748B" />
        <p className="mt-3 text-sm" style={{ color: "var(--muted-foreground)" }}>You do not have access to case management</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="FIR Directory"
        subtitle={`${filtered.length} cases found`}
        action={
          <div className="flex items-center gap-2">
            <HoverTooltip tip="Export as CSV">
              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium" style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22C55E", border: "1px solid rgba(34,197,94,0.2)" }}>
                <FileDown size={13} /> CSV
              </button>
            </HoverTooltip>
            <Button onClick={() => navigate("fir-entry")} size="sm">
              <Plus size={14} /> New FIR
            </Button>
          </div>
        }
      />

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-0 relative">
          <Search size={14} color="#64748B" className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by FIR, victim, crime type..."
            className="w-full rounded-2xl pl-9 pr-3 py-2.5 text-sm outline-none"
            style={{ backgroundColor: "var(--popover)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          />
        </div>

        {/* Advanced filters toggle */}
        <HoverTooltip tip="Advanced filters">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer"
            style={{
              backgroundColor: showFilters ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)",
              color: showFilters ? "#3B82F6" : "#CBD5E1",
              border: showFilters ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)"
            }}
          >
            <SlidersHorizontal size={15} /> Advanced Filters
          </button>
        </HoverTooltip>

        {/* View option toggle */}
        <div className="flex rounded-2xl overflow-hidden border border-white/10" style={{ backgroundColor: "var(--input)" }}>
          <HoverTooltip tip="List view">
            <button
              onClick={() => setViewMode("list")}
              className="p-2.5 transition-all cursor-pointer"
              style={{ backgroundColor: viewMode === "list" ? "#3B82F6" : "transparent", color: viewMode === "list" ? "#fff" : "#64748B" }}
            >
              <List size={15} />
            </button>
          </HoverTooltip>
          <HoverTooltip tip="Grid view">
            <button
              onClick={() => setViewMode("grid")}
              className="p-2.5 transition-all cursor-pointer"
              style={{ backgroundColor: viewMode === "grid" ? "#3B82F6" : "transparent", color: viewMode === "grid" ? "#fff" : "#64748B" }}
            >
              <LayoutGrid size={15} />
            </button>
          </HoverTooltip>
        </div>
      </div>

      {/* Advanced filter panel */}
      {showFilters && (
        <Card style={{ borderRadius: 20 }}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Status Filter:</span>
              <div className="flex gap-1 flex-wrap">
                {["all", "open", "arrested", "chargesheeted", "closed"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize cursor-pointer"
                    style={{
                      backgroundColor: statusFilter === s ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                      color: statusFilter === s ? "#60A5FA" : "#64748B",
                      border: statusFilter === s ? "1px solid rgba(59,130,246,0.4)" : "1px solid transparent",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap border-t border-white/5 pt-3">
              <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Crime Type:</span>
              <div className="flex gap-1 flex-wrap">
                {["all", ...crimeTypes].map((t) => (
                  <button
                    key={t}
                    onClick={() => setCrimeFilter(t)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium transition-all capitalize cursor-pointer"
                    style={{
                      backgroundColor: crimeFilter === t ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.04)",
                      color: crimeFilter === t ? "#A78BFA" : "#64748B",
                      border: crimeFilter === t ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
                    }}
                  >
                    {t === "all" ? "All Types" : t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <Card className="!p-0 overflow-hidden" style={{ borderRadius: 20 }}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  {["FIR No", "Victim", "Accused", "Crime Type", "Date", "Status", "IO", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const sc = STATUS_CONFIG[c.case_status];
                  return (
                    <tr
                      key={c.case_id}
                      className="border-b transition-all cursor-pointer hover:bg-white/[0.02]"
                      style={{ borderColor: "rgba(255,255,255,0.04)" }}
                      onClick={() => navigate("case-detail", { case_id: c.case_id })}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium" style={{ color: "#60A5FA", fontFamily: "JetBrains Mono, monospace" }}>{c.fir_no}</span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{c.victim_name}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{c.accused_name || "—"}</td>
                      <td className="px-4 py-3"><Badge color="#3B82F6">{c.crime_type}</Badge></td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{formatDate(c.crime_date)}</td>
                      <td className="px-4 py-3"><Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge></td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{c.io_badge || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <HoverTooltip tip="Quick view">
                            <button
                              className="p-1.5 rounded-xl transition-all"
                              style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA" }}
                              onClick={(e) => { e.stopPropagation(); setQuickCase(c); }}
                            >
                              <ZoomIn size={13} />
                            </button>
                          </HoverTooltip>
                          <HoverTooltip tip="Open detail">
                            <button
                              className="p-1.5 rounded-xl transition-all"
                              style={{ backgroundColor: "rgba(59,130,246,0.1)", color: "#3B82F6" }}
                              onClick={(e) => { e.stopPropagation(); navigate("case-detail", { case_id: c.case_id }); }}
                            >
                              <Eye size={13} />
                            </button>
                          </HoverTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
                <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No cases match your filters</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Grid view */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const sc = STATUS_CONFIG[c.case_status];
            return (
              <div
                key={c.case_id}
                className="flex flex-col gap-3 cursor-pointer transition-all hover:border-blue-500/30"
                style={{ borderRadius: 20 }}
                onClick={() => navigate("case-detail", { case_id: c.case_id })}
              >
                <div className="flex items-start justify-between">
                  <span className="text-sm font-bold" style={{ color: "#60A5FA", fontFamily: "JetBrains Mono, monospace" }}>{c.fir_no}</span>
                  <Badge color={sc.color} bg={sc.bg}>{sc.label}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{c.victim_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{c.crime_location}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge color="#3B82F6">{c.crime_type}</Badge>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{formatDate(c.crime_date)}</span>
                </div>
                <div className="flex items-center justify-between pt-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{c.io_badge || "Unassigned"}</span>
                  <button
                    className="p-1.5 rounded-xl"
                    style={{ backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA" }}
                    onClick={(e) => { e.stopPropagation(); setQuickCase(c); }}
                  >
                    <ZoomIn size={12} />
                  </button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12" style={{ color: "var(--muted-foreground)" }}>
              <FolderOpen size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No cases match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Quick View Modal */}
      {quickCase && (
        <Modal open={!!quickCase} onClose={() => setQuickCase(null)} title={`Quick View — ${quickCase.fir_no}`}>
          <div className="flex items-center gap-3 flex-wrap">
            <Badge color={STATUS_CONFIG[quickCase.case_status].color} bg={STATUS_CONFIG[quickCase.case_status].bg}>{STATUS_CONFIG[quickCase.case_status].label}</Badge>
            <Badge color="#3B82F6">{quickCase.crime_type}</Badge>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{formatDate(quickCase.crime_date)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Victim", value: quickCase.victim_name },
              { label: "Age", value: quickCase.victim_age ? `${quickCase.victim_age} years` : "—" },
              { label: "Phone", value: quickCase.victim_phone || "—" },
              { label: "Injury", value: quickCase.victim_injury ? "Yes" : "No" },
              { label: "Location", value: quickCase.crime_location },
              { label: "Accused", value: quickCase.accused_name || "Unknown" },
              { label: "IO", value: quickCase.io_name || "—" },
              { label: "Badge", value: quickCase.io_badge || "—" },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 rounded-2xl" style={{ backgroundColor: "var(--input)" }}>
                <p className="text-xs mb-0.5" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                <p style={{ color: label === "Injury" && quickCase.victim_injury ? "#EF4444" : "#CBD5E1" }}>{value}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-2xl" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
            <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Narrative</p>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{quickCase.crime_narrative}</p>
          </div>
          <button
            onClick={() => { navigate("case-detail", { case_id: quickCase.case_id }); setQuickCase(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium w-full justify-center"
            style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
          >
            <ExternalLink size={14} /> Open Full Detail
          </button>
        </Modal>
      )}
    </div>
  );
}
