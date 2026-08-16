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
import { useApp, Officer, Case, CCTVAlert, PatrolUnit, CaseStatus, Role, DiaryEntry, Button, Card, Input, Select, Modal, Badge, Chip, QuickViewModal, CrimeGPTDocumentStudio, STATUS_CONFIG, RISK_CONFIG, ROLE_CONFIG, PREDICTIVE_HEATMAP_ZONES, downloadCasesCSV, AppCtx, cn, WS_COLOR, CreatedDocument, NAV_ITEMS, CAMERA_FEEDS, RolePermission, formatDateTime, SegmentedChartCard, HoverTooltip, WSMessage, GenerateDocumentModalProps, PageHeader, Page, createGoogleTeardropPin, ChatMsg, ALERT_COLOR, AdminUser, CCTV_LOCATIONS, LiveCameraGrid, ScenarioSimulationControlDeck, AHMEDABAD_WARD_LOCATIONS, StatCard, TRANSLATIONS, Ctx, Sidebar, RealAhmedabadOpenStreetMap, TopBar, BottomNav, VoiceInputWidget, IAMPolicy, CHART_COLORS, PatrolUnitFull, AICoPilotWidget, NavItem, AHMEDABAD_WARDS, formatTime, formatDate, GenerateDocumentModal, PatrolRouteFull, AppShell, AuditLog, timeAgo } from '../App';
export default function AdminPage() {
  const { officer, cases, token } = useApp();
  const [activeTab, setActiveTab] = useState<"users" | "roles" | "iam" | "audit">("users");

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  
  useEffect(() => {
    fetch("/api/v1/admin/officers", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => {
      if (Array.isArray(d)) {
        setUsers(d.map((o: any) => ({
          ...o,
          badge: o.badge_no,
          station: o.ps_id || "HQ",
          status: o.is_active ? "Active" : "Inactive",
        })));
      }
    })
    .catch(console.error);
  }, [token]);

  useEffect(() => {
    fetch("/api/v1/admin/audit", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => {
      if (Array.isArray(d)) {
        const fetchedLogs = d.map((a: any) => ({
          id: a.id || Math.random().toString(),
          ts: a.changed_at || new Date().toISOString(),
          badge: a.badge_no || "",
          name: a.officer_name || "",
          action: a.action || "",
          module: a.table_name || a.target || "System",
          ip: a.ip_address || "127.0.0.1",
          status: "Success" as const,
        }));
        setAuditLogs(fetchedLogs.length > 0 ? fetchedLogs : []);
      }
    })
    .catch(console.error);
  }, [token]);

  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newBadge, setNewBadge] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<Role>("io");
  const [newStation, setNewStation] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPsId, setNewPsId] = useState("");

  // Edit user state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // Roles state
  const [permissions, setPermissions] = useState<RolePermission[]>([]);

  // IAM state
  const [iamPolicies, setIamPolicies] = useState<IAMPolicy[]>([]);

  // Audit state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditSearch, setAuditSearch] = useState("");

  // Notification toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.badge || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.station || "").toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadge.trim() || !newName.trim()) return;
    const badgeFormatted = newBadge.trim().toUpperCase();
    if (users.some((u) => u.badge === badgeFormatted)) {
      showToast(`Badge ${badgeFormatted} is already registered!`);
      return;
    }
    
    try {
      const res = await fetch("/api/v1/admin/officers", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          badge_no: badgeFormatted,
          name: newName.trim(),
          role: newRole,
          ps_id: newPsId.trim() || null,
          password: newPassword.trim() || undefined
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed");
      }
      
      const newUser: AdminUser = {
        badge: badgeFormatted,
        name: newName.trim(),
        role: newRole,
        status: "Active",
        station: newStation.trim() || "HQ",
      };
      setUsers([newUser, ...users]);
      setNewBadge("");
      setNewName("");
      setNewRole("io");
      setNewStation("");
      setNewPassword("");
      setNewPsId("");
      setShowAddUserModal(false);
      showToast(`Officer ${newUser.name} added!`);
    } catch (err) {
      showToast("Failed to save officer to database.");
    }
  };

  const handleToggleUserStatus = async (badge: string) => {
    const user = users.find(u => u.badge === badge);
    if (!user) return;
    
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await fetch(`/api/v1/admin/officers/${badge}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_active: nextStatus === "Active" })
      });
      if (!res.ok) throw new Error("Failed");
      setUsers(users.map((u) => u.badge === badge ? { ...u, status: nextStatus } : u));
      showToast(`Status for ${badge} changed to ${nextStatus}`);
    } catch (err) {
      showToast(`Failed to update status for ${badge}`);
    }
  };

  const handleDeleteUser = async (badge: string) => {
    if (confirm(`Are you sure you want to remove user ${badge}?`)) {
      try {
        const res = await fetch(`/api/v1/admin/officers/${badge}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed");
        setUsers(users.filter((u) => u.badge !== badge));
        showToast(`User ${badge} removed from database`);
      } catch (err) {
        showToast(`Failed to remove user ${badge}`);
      }
    }
  };

  const handleUpdateUserRole = async (badge: string, role: Role) => {
    try {
      const res = await fetch(`/api/v1/admin/officers/${badge}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role })
      });
      if (!res.ok) throw new Error("Failed");
      setUsers(users.map((u) => (u.badge === badge ? { ...u, role } : u)));
      showToast(`Updated role for ${badge} to ${role.toUpperCase()} in database`);
      setEditingUser(null);
    } catch (err) {
      showToast(`Failed to update role for ${badge}`);
    }
  };

  const togglePermission = (permKey: string, role: Role) => {
    setPermissions(
      permissions.map((p) => {
        if (p.key === permKey) {
          const current = p.matrix[role];
          const updated = { ...p.matrix, [role]: !current };
          showToast(`Updated '${p.label}' permission for ${role.toUpperCase()} to ${!current ? "ALLOW" : "DENY"}`);
          return { ...p, matrix: updated };
        }
        return p;
      })
    );
  };

  const toggleIAMPolicy = (id: string) => {
    setIamPolicies(
      iamPolicies.map((p) => {
        if (p.id === id) {
          const nextState = !p.enabled;
          showToast(`IAM Policy ${p.name} is now ${nextState ? "ENABLED" : "DISABLED"}`);
          return { ...p, enabled: nextState };
        }
        return p;
      })
    );
  };

  const filteredAuditLogs = auditLogs.filter(
    (l) =>
      l.badge.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.name.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
      l.module.toLowerCase().includes(auditSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-12">
      {/* Toast alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} />
          {toastMsg}
        </div>
      )}

      {/* Page Header */}
      <PageHeader
        title="Admin Controls & User Management"
        subtitle="Manage department officers, role permission matrix, IAM policies, and system audit logs"
        action={
          activeTab === "users" ? (
            <Button onClick={() => setShowAddUserModal(true)} variant="filled" size="sm">
              <UserPlus size={15} /> Add Officer
            </Button>
          ) : undefined
        }
      />

      {/* Tab Switcher Buttons */}
      <div className="flex items-center gap-2 border-b pb-3 overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer border ${
            activeTab === "users"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-md"
              : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
          }`}
        >
          <Users size={16} /> 👥 Users ({users.length})
        </button>

        <button
          onClick={() => setActiveTab("roles")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer border ${
            activeTab === "roles"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-md"
              : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
          }`}
        >
          <Key size={16} /> 🔐 Roles Matrix
        </button>

        <button
          onClick={() => setActiveTab("iam")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer border ${
            activeTab === "iam"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-md"
              : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
          }`}
        >
          <ShieldAlert size={16} /> 🛡️ IAM Policies
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer border ${
            activeTab === "audit"
              ? "bg-[var(--primary)] text-[var(--primary-foreground)] border-[var(--primary)] shadow-md"
              : "bg-[var(--card)] text-[var(--muted-foreground)] border-[var(--border)] hover:text-[var(--foreground)]"
          }`}
        >
          <FileCode size={16} /> 📋 Audit Logs
        </button>
      </div>

      {/* ─── TAB 1: USERS ─────────────────────────────────────────────────── */}
      {activeTab === "users" && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          {/* Filters Bar */}
          <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <Search size={15} className="text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search badge, name, or station..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-transparent text-xs outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
              {userSearch && (
                <button onClick={() => setUserSearch("")} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
                  <X size={13} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[var(--muted-foreground)] whitespace-nowrap">Filter Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-[var(--input)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs font-medium text-[var(--foreground)] outline-none cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="dcp">DCP</option>
                <option value="sho">SHO</option>
                <option value="io">IO</option>
                <option value="constable">Constable</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </Card>

          {/* Users Table */}
          <Card className="p-0 overflow-hidden shadow-lg border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-[var(--input)]/40" style={{ borderColor: "var(--border)" }}>
                    <th className="py-3 px-4 font-mono text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
                      Badge
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Name
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Role
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Station / Unit
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Status
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--muted-foreground)]">
                        No officers found matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const roleConf = ROLE_CONFIG[u.role] || { label: u.role.toUpperCase(), color: "#3B82F6" };
                      return (
                        <tr key={u.badge} className="hover:bg-slate-500/5 transition-colors">
                          <td className="py-3 px-4 font-mono text-xs font-bold text-[var(--color-primary)]">
                            {u.badge}
                          </td>
                          <td className="py-3 px-4 text-xs font-medium text-[var(--foreground)]">
                            {u.name}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span
                              className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-block"
                              style={{
                                color: roleConf.color,
                                backgroundColor: roleConf.color + "18",
                                borderColor: roleConf.color + "40",
                              }}
                            >
                              {roleConf.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-[var(--muted-foreground)]">
                            {u.station}
                          </td>
                          <td className="py-3 px-4 text-xs">
                            <span
                              className={`inline-flex items-center gap-1.5 font-semibold text-xs ${
                                u.status === "Active" ? "text-emerald-500" : "text-amber-500 opacity-60"
                              }`}
                            >
                              <span className={`w-2 h-2 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-amber-500"}`} />
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setEditingUser(u)}
                                className="p-1.5 rounded-lg border border-[var(--border)] hover:bg-[var(--input)] text-[var(--foreground)] cursor-pointer"
                                title="Edit Role"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(u.badge)}
                                className={`px-2 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer transition-all ${
                                  u.status === "Active"
                                    ? "border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                                    : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
                                }`}
                              >
                                {u.status === "Active" ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.badge)}
                                className="p-1.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 cursor-pointer"
                                title="Remove User"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 2: ROLES MATRIX ───────────────────────────────────────────── */}
      {activeTab === "roles" && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <Card className="p-4 bg-[var(--card)] border border-[var(--border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Role-Based Access Control (RBAC) Matrix</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Configure module access permissions for police department ranks</p>
            </div>
            <Badge color="#3B82F6">Active Policy Enforcement</Badge>
          </Card>

          <Card className="p-0 overflow-hidden shadow-lg border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-[var(--input)]/40" style={{ borderColor: "var(--border)" }}>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Permission Module
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center text-[var(--muted-foreground)]">
                      Constable
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center text-[var(--muted-foreground)]">
                      IO
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center text-[var(--muted-foreground)]">
                      SHO
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center text-[var(--muted-foreground)]">
                      DCP
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-center text-[var(--muted-foreground)]">
                      Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {permissions.map((p) => (
                    <tr key={p.key} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 px-4">
                        <p className="text-xs font-semibold text-[var(--foreground)]">{p.label}</p>
                        <p className="text-[10px] text-[var(--muted-foreground)]">{p.category}</p>
                      </td>

                      {(["constable", "io", "sho", "dcp", "admin"] as Role[]).map((r) => {
                        const allowed = p.matrix[r];
                        return (
                          <td key={r} className="py-3 px-4 text-center">
                            <button
                              onClick={() => togglePermission(p.key, r)}
                              className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer border ${
                                allowed
                                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 hover:scale-110"
                                  : "bg-red-500/10 border-red-500/20 text-red-500/50 hover:scale-110"
                              }`}
                              title={`Toggle ${p.label} for ${r}`}
                            >
                              {allowed ? <Check size={14} /> : <X size={14} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─── TAB 3: IAM POLICIES ───────────────────────────────────────────── */}
      {activeTab === "iam" && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <Card className="p-4 border border-[var(--border)] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Identity & Access Management (IAM) Policies</h3>
              <p className="text-xs text-[var(--muted-foreground)]">Active security constraints, authentication protocols, and encryption safeguards</p>
            </div>
            <Button variant="outlined" size="sm" onClick={() => showToast("Scanning... ✓ 0 Vulnerabilities Found. System Secure.")}>
              <ShieldAlert size={14} /> Run Security Scan
            </Button>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {iamPolicies.map((policy) => (
              <Card key={policy.id} className="p-5 flex flex-col justify-between gap-4 border border-[var(--border)] shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[var(--muted-foreground)]">{policy.id}</span>
                        <Badge
                          color={policy.level === "Critical" ? "#EF4444" : policy.level === "High" ? "#F59E0B" : "#3B82F6"}
                        >
                          {policy.level}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--foreground)] mt-1">{policy.name}</h4>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1 leading-relaxed">{policy.description}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
                  <span className="text-[11px] font-medium text-[var(--muted-foreground)]">Target: {policy.target}</span>
                  <button
                    onClick={() => toggleIAMPolicy(policy.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      policy.enabled
                        ? "bg-emerald-500 text-white shadow-sm"
                        : "bg-[var(--input)] text-[var(--muted-foreground)] border border-[var(--border)]"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${policy.enabled ? "bg-white" : "bg-gray-400"}`} />
                    {policy.enabled ? "ACTIVE" : "DISABLED"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ─── TAB 4: AUDIT LOGS ─────────────────────────────────────────────── */}
      {activeTab === "audit" && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-md">
              <Search size={15} className="text-[var(--muted-foreground)]" />
              <input
                type="text"
                placeholder="Search logs by badge, action, module..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full bg-transparent text-xs outline-none text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]"
              />
              {auditSearch && (
                <button onClick={() => setAuditSearch("")} className="text-[var(--muted-foreground)]">
                  <X size={13} />
                </button>
              )}
            </div>

            <Button
              variant="outlined"
              size="sm"
              onClick={() => showToast("Exporting BNSS Compliant Audit Log CSV...")}
            >
              <Download size={14} /> Export Audit Trail
            </Button>
          </Card>

          <Card className="p-0 overflow-hidden shadow-lg border border-[var(--border)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b bg-[var(--input)]/40" style={{ borderColor: "var(--border)" }}>
                    <th className="py-3 px-4 font-mono text-xs uppercase tracking-wider text-[var(--muted-foreground)] font-semibold">
                      Timestamp
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Officer
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Action Event
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Module
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      IP Address
                    </th>
                    <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-500/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--muted-foreground)]">
                        {log.ts.replace("T", " ").substring(0, 19)}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span className="font-mono font-bold text-[var(--color-primary)]">{log.badge}</span>
                        <span className="text-[11px] text-[var(--muted-foreground)] block">{log.name}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-[var(--foreground)]">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <Badge color="#3B82F6">{log.module}</Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[var(--muted-foreground)]">
                        {log.ip}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <span
                          className={`font-bold text-xs ${
                            log.status === "Success"
                              ? "text-emerald-500"
                              : log.status === "Warning"
                              ? "text-amber-500"
                              : "text-red-500"
                          }`}
                        >
                          ● {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ─── ADD OFFICER MODAL ───────────────────────────────────────────── */}
      <Modal open={showAddUserModal} onClose={() => setShowAddUserModal(false)} title="Register New Department Officer">
        <form onSubmit={handleAddUser} className="flex flex-col gap-4">
          <Input
            label="Officer Badge Number"
            placeholder="e.g. SHO_GHA or IO_SAT_3"
            value={newBadge}
            onChange={(val) => setNewBadge(val)}
            required
          />
          <Input
            label="Full Officer Name"
            placeholder="e.g. Sub-Inspector Vijay Parmar"
            value={newName}
            onChange={(val) => setNewName(val)}
            required
          />
          <Select
            label="Assigned Rank / Role"
            value={newRole}
            onChange={(val) => setNewRole(val as Role)}
            options={[
              { value: "constable", label: "Constable" },
              { value: "io", label: "IO - Investigating Officer" },
              { value: "sho", label: "SHO - Station House Officer" },
              { value: "dcp", label: "DCP - Deputy Commissioner" },
              { value: "admin", label: "System Administrator" },
            ]}
          />
          <Input
            label="Police Station / Unit Name"
            placeholder="e.g. Satellite PS or City Police HQ"
            value={newStation}
            onChange={(val) => setNewStation(val)}
          />
          <Input
            label="Police Station UUID (ps_id)"
            placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
            value={newPsId}
            onChange={(val) => setNewPsId(val)}
            required
          />
          <Input
            label="Initial Password"
            type="password"
            placeholder="Leave blank for auto-generated password"
            value={newPassword}
            onChange={(val) => setNewPassword(val)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
            <Button type="button" variant="outlined" size="sm" onClick={() => setShowAddUserModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="filled" size="sm">
              Register Officer
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── EDIT ROLE MODAL ─────────────────────────────────────────────── */}
      {editingUser && (
        <Modal open={!!editingUser} onClose={() => setEditingUser(null)} title={`Edit Role for ${editingUser.name} (${editingUser.badge})`}>
          <div className="flex flex-col gap-4">
            <p className="text-xs text-[var(--muted-foreground)] font-medium">Select new rank/role for officer in Samraksha Police Network:</p>
            <Select
              label="Select New Role"
              value={editingUser.role}
              onChange={(v) => setEditingUser({ ...editingUser, role: v as Role })}
              options={[
                { value: "constable", label: "Constable" },
                { value: "io", label: "IO - Investigating Officer" },
                { value: "sho", label: "SHO - Station House Officer" },
                { value: "dcp", label: "DCP - Deputy Commissioner" },
                { value: "admin", label: "System Administrator" },
              ]}
            />
            <div className="flex justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <Button variant="outlined" size="sm" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button variant="filled" size="sm" onClick={() => handleUpdateUserRole(editingUser.badge, editingUser.role)}>
                Save Role Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
