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
import { useApp, Officer, Case, CCTVAlert, PatrolUnit, CaseStatus, Role, DiaryEntry, Button, Card, Input, Select, Modal, Badge, Chip, QuickViewModal, CrimeGPTDocumentStudio, STATUS_CONFIG, RISK_CONFIG, ROLE_CONFIG, PREDICTIVE_HEATMAP_ZONES, downloadCasesCSV, AppCtx, cn, WS_COLOR, CreatedDocument, NAV_ITEMS, CAMERA_FEEDS, RolePermission, formatDateTime, SegmentedChartCard, HoverTooltip, CRIME_TYPE_DATA, WSMessage, GenerateDocumentModalProps, PageHeader, Page, createGoogleTeardropPin, ChatMsg, ALERT_COLOR, AdminUser, CCTV_LOCATIONS, LiveCameraGrid, ScenarioSimulationControlDeck, AHMEDABAD_WARD_LOCATIONS, StatCard, TRANSLATIONS, Ctx, Sidebar, WEEKLY_DATA, RealAhmedabadOpenStreetMap, TopBar, BottomNav, VoiceInputWidget, IAMPolicy, CHART_COLORS, PatrolUnitFull, AICoPilotWidget, NavItem, AHMEDABAD_WARDS, formatTime, formatDate, HOURLY_DATA, GenerateDocumentModal, MONTHLY_DATA, PatrolRouteFull, AppShell, INITIAL_ADMIN_USERS, INITIAL_AUDIT_LOGS, INITIAL_PERMISSIONS, INITIAL_IAM_POLICIES, AuditLog, timeAgo } from '../App';
export default function ProfilePage() {
  const { officer, cases } = useApp();
  const [editMode, setEditMode] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const roleConf = ROLE_CONFIG[officer!.role];
  const initials = officer!.name.split(" ").map((n) => n[0]).join("").slice(0, 2);

  const [form, setForm] = useState({
    firstName: officer!.name.split(" ")[0] || "",
    lastName: officer!.name.split(" ").slice(1).join(" ") || "",
    email: `${officer!.badge_no.toLowerCase()}@ahmedabadpolice.gov.in`,
    phone: "+91 98765 43210",
    bio: `Serving with the Ahmedabad City Police since 2018. Assigned to ${officer!.ps_id} Police Station. Committed to upholding law and public safety.`,
    password: "",
    confirmPassword: "",
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  const glassCard = {
    background: "var(--popover)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 20,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
  } as React.CSSProperties;

  const inputStyle = {
    backgroundColor: "var(--input)",
    border: "1px solid var(--border)",
    borderRadius: 10,
    color: "var(--foreground)",
    padding: "10px 14px",
    width: "100%",
    fontSize: 14,
    outline: "none",
    transition: "border-color 150ms",
  } as React.CSSProperties;

  return (
    <div className="max-w-2xl mx-auto py-6 px-2 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>
            {editMode ? "Edit Profile" : "My Profile"}
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {editMode ? "Update your personal information" : "View your account details"}
          </p>
        </div>
      </div>

      {/* Avatar + identity card */}
      <div style={glassCard} className="p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${roleConf.color}44 0%, ${roleConf.color}22 100%)`, border: `2px solid ${roleConf.color}55` }}
          >
            {avatarPreview
              ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
              : <span style={{ color: roleConf.color }}>{initials}</span>
            }
          </div>
          {/* Glassy ring */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{ boxShadow: `0 0 0 3px rgba(59,130,246,0.15), 0 0 20px ${roleConf.color}33` }}
          />
          {editMode && (
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "rgba(59,130,246,0.9)", backdropFilter: "blur(8px)", border: "2px solid rgba(13,17,23,0.8)" }}
            >
              <Upload size={13} color="#fff" />
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* Identity */}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{officer!.name}</h2>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${roleConf.color}22`, color: roleConf.color, border: `1px solid ${roleConf.color}44` }}
            >
              {roleConf.label}
            </span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Badge #{officer!.badge_no}</span>
          </div>
          <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{form.bio}</p>

          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(59,130,246,0.15)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(59,130,246,0.3)",
                color: "#93C5FD",
              }}
            >
              <Edit2 size={14} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* View Mode: contact details */}
      {!editMode && (
        <div style={glassCard} className="p-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
            Contact &amp; Assignment
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Email", value: form.email, icon: <Globe size={14} /> },
              { label: "Phone", value: form.phone, icon: <Phone size={14} /> },
              { label: "Police Station", value: officer!.ps_id, icon: <Building size={14} /> },
              { label: "Officer ID", value: officer!.id, icon: <BadgeCheck size={14} /> },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span style={{ color: "#3B82F6", marginTop: 2 }}>{icon}</span>
                <div>
                  <p className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{label}</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted-foreground)" }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Mode: form */}
      {editMode && (
        <div style={glassCard} className="p-6 flex flex-col gap-5">
          <h3 className="text-sm font-semibold" style={{ color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>First Name</label>
              <input
                style={inputStyle}
                value={form.firstName}
                onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))}
                onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Last Name</label>
              <input
                style={inputStyle}
                value={form.lastName}
                onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))}
                onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
                onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Email Address</label>
            <input
              style={inputStyle}
              type="email"
              value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Phone Number</label>
            <input
              style={inputStyle}
              type="tel"
              value={form.phone}
              onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Bio</label>
            <textarea
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
              value={form.bio}
              onChange={(e) => setForm(f => ({ ...f, bio: e.target.value }))}
              onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div
            className="pt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--muted-foreground)", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 11 }}>
              Change Password
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>New Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted-foreground)" }}>Confirm Password</label>
                <input
                  style={inputStyle}
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                  onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.6)")}
                  onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEditMode(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
                border: "1px solid var(--border)",
                color: "var(--muted-foreground)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.9) 0%, rgba(37,99,235,0.9) 100%)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(59,130,246,0.5)",
                color: "#fff",
                boxShadow: "0 4px 16px rgba(59,130,246,0.3)",
              }}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
