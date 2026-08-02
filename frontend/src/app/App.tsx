import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Map,
  FolderOpen,
  BarChart2,
  Video,
  Siren,
  Bot,
  Gavel,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  Globe,
  User,
  Plus,
  FileText,
  Shield,
  Menu,
  X,
  ChevronRight,
  LogOut
} from 'lucide-react';
import {
  ExecutiveDashboard,
  CaseManagementView,
  PredictiveAnalyticsView,
  CctvSurveillanceView,
  PatrolManagementView,
  CrimeGptAssistantView,
  LegalReferenceView,
  AdminConsoleView
} from '../components/views';
import { LeafletMap } from '../components/map/LeafletMap';
import { useAuth } from '../context/AuthContext';
import { GlassCard, GlassPanel, Button, Toggle, Badge } from '../components/ui';

type NavPage =
  | 'dashboard'
  | 'map'
  | 'cases'
  | 'analytics'
  | 'cctv'
  | 'patrol'
  | 'assistant'
  | 'legal'
  | 'admin'
  | 'fir-entry';

type Role = 'sho' | 'io' | 'constable' | 'dcp' | 'admin';
type Language = 'en' | 'hi' | 'gu';

export default function App() {
  const { user, isAuthenticated, login, logout, role, switchRole } = useAuth();
  const [loginBadge, setLoginBadge] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activePage, setActivePage] = useState<NavPage>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const userRole = role as Role;
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen glass-background bg-background text-on-surface flex items-center justify-center p-6">
        <GlassCard className="w-full max-w-md p-8">
          <div className="flex items-center gap-3 mb-8"><div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-on-primary"><Shield size={22} /></div><div><h1 className="font-montserrat text-xl font-bold text-primary">SAMRAKSHA</h1><p className="text-xs text-on-surface-variant">Ahmedabad City Police Command</p></div></div>
          <form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); setLoginError(''); try { await login(loginBadge, loginPassword); } catch (error: any) { setLoginError(error?.response?.data?.detail || 'Unable to authenticate with the API'); } }}>
            <label className="block text-sm font-semibold">Badge number<input required value={loginBadge} onChange={(event) => setLoginBadge(event.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary" placeholder="ADMIN001" /></label>
            <label className="block text-sm font-semibold">Password<input required type="password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary" /></label>
            {loginError && <p className="text-sm text-error">{loginError}</p>}<Button type="submit" className="w-full">Sign in to command center</Button>
          </form>
        </GlassCard>
      </div>
    );
  }

  // Synchronize Dark Mode CSS Tokens
  const toggleTheme = (dark: boolean) => {
    setIsDarkMode(dark);
    if (dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'map', label: 'Crime Map', icon: Map },
    { id: 'cases', label: 'Cases', icon: FolderOpen },
    { id: 'fir-entry', label: 'New FIR', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'cctv', label: 'CCTV', icon: Video },
    { id: 'patrol', label: 'Patrolling Units', icon: Siren },
    { id: 'assistant', label: 'AI Assistant', icon: Bot },
    { id: 'legal', label: 'Legal Reference', icon: Gavel },
    { id: 'admin', label: 'Admin Controls', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen glass-background bg-background text-on-surface flex flex-col font-inter transition-colors duration-300">
      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-outline-variant/30 px-6 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-surface-variant text-on-surface-variant transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-md">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold font-montserrat tracking-tight text-primary leading-none">
                SAMRAKSHA
              </h1>
              <p className="text-[10px] font-mono text-on-surface-variant tracking-wider uppercase mt-0.5">
                Ahmedabad City Police Command
              </p>
            </div>
          </div>
        </div>

        {/* Controls & Quick Actions */}
        <div className="flex items-center gap-4">
          {/* Role Switcher */}
          <div className="hidden md:flex items-center gap-2 bg-surface-variant/40 px-3 py-1.5 rounded-xl border border-outline-variant/30">
            <User size={14} className="text-primary" />
            <select
              value={userRole}
              onChange={(e) => switchRole(e.target.value as Role)}
              className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
            >
              <option value="sho" className="bg-surface text-on-surface">SHO (Navrangpura)</option>
              <option value="io" className="bg-surface text-on-surface">IO (Inspector)</option>
              <option value="constable" className="bg-surface text-on-surface">Constable (PCR)</option>
              <option value="dcp" className="bg-surface text-on-surface">DCP (Zone 1)</option>
              <option value="admin" className="bg-surface text-on-surface">System Admin</option>
            </select>
          </div>

          {/* Multilingual i18n Selector */}
          <div className="flex items-center gap-1.5 bg-surface-variant/40 px-2.5 py-1.5 rounded-xl border border-outline-variant/30">
            <Globe size={14} className="text-secondary" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-xs font-medium text-on-surface outline-none cursor-pointer"
            >
              <option value="en" className="bg-surface text-on-surface">English</option>
              <option value="hi" className="bg-surface text-on-surface">हिन्दी</option>
              <option value="gu" className="bg-surface text-on-surface">ગુજરાતી</option>
            </select>
          </div>

          {/* Theme Toggle Switch */}
          <Toggle
            checked={isDarkMode}
            onChange={toggleTheme}
            label={isDarkMode ? 'Dark' : 'Light'}
          />

          <button className="relative p-2 rounded-xl hover:bg-surface-variant text-on-surface-variant transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-ping" />
          </button>
        </div>
      </header>

      {/* Main Body Content Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-0 md:w-20'
          } bg-surface/60 backdrop-blur-lg border-r border-outline-variant/30 transition-all duration-300 flex flex-col justify-between p-3 overflow-hidden flex-shrink-0`}
        >
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id as NavPage)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary shadow-md'
                      : 'text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                  }`}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </div>

          {sidebarOpen && (
            <div className="p-3 rounded-2xl bg-surface-variant/40 border border-outline-variant/30 text-xs flex flex-col gap-1.5">
              <p className="font-bold text-on-surface">Ahmedabad Control</p>
              <p className="text-on-surface-variant font-mono text-[10px]">Connected to API :8000</p>
              <Badge variant="success" dot className="mt-1">
                System Healthy
              </Badge>
            </div>
          )}
        </aside>

        {/* View Component Rendering Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activePage === 'dashboard' && <ExecutiveDashboard />}
          {activePage === 'map' && (
            <div className="flex flex-col gap-4 h-[calc(100vh-140px)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold font-montserrat text-on-surface">
                    Ahmedabad GIS Crime Map
                  </h2>
                  <p className="text-xs text-on-surface-variant">
                    Full-bleed interactive OpenStreetMap corridor with wards, CCTV nodes, and PCR beats
                  </p>
                </div>
              </div>
              <GlassCard className="flex-1 p-2 overflow-hidden">
                <LeafletMap showWards showCctv showPatrols showRoutes showHeatmaps />
              </GlassCard>
            </div>
          )}
          {activePage === 'cases' && <CaseManagementView />}
          {activePage === 'fir-entry' && <CaseManagementView initialAction="create" />}
          {activePage === 'analytics' && <PredictiveAnalyticsView />}
          {activePage === 'cctv' && <CctvSurveillanceView />}
          {activePage === 'patrol' && <PatrolManagementView />}
          {activePage === 'assistant' && <CrimeGptAssistantView />}
          {activePage === 'legal' && <LegalReferenceView />}
          {activePage === 'admin' && <AdminConsoleView />}
        </main>
      </div>
    </div>
  );
}
