import { create } from 'zustand';

const getStoredOfficer = () => {
  try {
    const item = localStorage.getItem('samraksha_officer');
    return item ? JSON.parse(item) : null;
  } catch (e) {
    return null;
  }
};

const initialOfficer = getStoredOfficer();

// ─── Auth Store ────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  token: localStorage.getItem('samraksha_token') || null,
  officer: initialOfficer,
  role: initialOfficer?.role?.toLowerCase() || null,

  setAuth: (token, officer) => {
    localStorage.setItem('samraksha_token', token);
    localStorage.setItem('samraksha_officer', JSON.stringify(officer));
    set({ token, officer, role: officer?.role?.toLowerCase() || null });
  },

  logout: () => {
    localStorage.removeItem('samraksha_token');
    localStorage.removeItem('samraksha_officer');
    set({ token: null, officer: null, role: null });
  },

  getRole: () => get().officer?.role?.toLowerCase() || null,
}));

// ─── Dashboard Store ───────────────────────────────────
export const useDashboardStore = create((set) => ({
  summary: null,
  trends: null,
  caseList: [],
  incidentList: [],
  loading: false,

  setSummary: (summary) => set({ summary }),
  setTrends: (trends) => set({ trends }),
  setCaseList: (caseList) => set({ caseList }),
  setIncidentList: (incidentList) => set({ incidentList }),
  setLoading: (loading) => set({ loading }),
}));

// ─── Map Store ─────────────────────────────────────────
export const useMapStore = create((set) => ({
  hotspots: [],
  markers: [],
  selectedMarker: null,

  setHotspots: (hotspots) => set({ hotspots }),
  setMarkers: (markers) => set({ markers }),
  selectMarker: (selectedMarker) => set({ selectedMarker }),
}));

// ─── Role helpers ──────────────────────────────────────
export const isHighRank = (role) => ['admin', 'sho', 'dcp'].includes(role?.toLowerCase());
export const canViewAnalytics = (role) => ['admin', 'sho', 'dcp'].includes(role?.toLowerCase());
export const canViewMap = (role) => ['io', 'constable', 'sho', 'admin', 'dcp'].includes(role?.toLowerCase());
