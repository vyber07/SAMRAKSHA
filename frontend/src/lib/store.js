import { create } from 'zustand';

const ROLE_HIERARCHY = {
  admin: 3,
  sho: 3,
  dcp: 2,
  io: 1,
  constable: 0,
};

const ROLE_PERMISSIONS = {
  admin: {
    canViewAnalytics: true,
    canViewMap: true,
    canEditIncidents: true,
    canViewReports: true,
    canManageUsers: true,
  },
  sho: {
    canViewAnalytics: true,
    canViewMap: true,
    canEditIncidents: true,
    canViewReports: true,
    canManageUsers: false,
  },
  dcp: {
    canViewAnalytics: true,
    canViewMap: true,
    canEditIncidents: true,
    canViewReports: true,
    canManageUsers: false,
  },
  io: {
    canViewAnalytics: false,
    canViewMap: true,
    canEditIncidents: true,
    canViewReports: false,
    canManageUsers: false,
  },
  constable: {
    canViewAnalytics: false,
    canViewMap: true,
    canEditIncidents: false,
    canViewReports: false,
    canManageUsers: false,
  },
};

const isHighRankOfficer = (role) => {
  return role && ['admin', 'sho', 'dcp'].includes(role);
};

const isLowRankOfficer = (role) => {
  return role && ['io', 'constable'].includes(role);
};

const hasPermission = (role, permission) => {
  return ROLE_PERMISSIONS[role]?.[permission] || false;
};

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  userRole: localStorage.getItem('userRole') || null,

  setToken: (token) => {
    localStorage.setItem('token', token);
    set({ token });
  },

  setUser: (user) => {
    set({ user });
    if (user?.role) {
      localStorage.setItem('userRole', user.role);
      set({ userRole: user.role });
    }
  },

  setUserRole: (role) => {
    localStorage.setItem('userRole', role);
    set({ userRole: role });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    set({ token: null, user: null, userRole: null });
  },

  isHighRank: () => {
    const state = useAuthStore.getState();
    return isHighRankOfficer(state.userRole);
  },

  hasPermission: (permission) => {
    const state = useAuthStore.getState();
    return hasPermission(state.userRole, permission);
  },
}));

export const useDashboardStore = create((set) => ({
  incidents: [],
  cases: [],
  notifications: [],
  loading: false,
  setIncidents: (incidents) => set({ incidents }),
  setCases: (cases) => set({ cases }),
  setNotifications: (notifications) => set({ notifications }),
  setLoading: (loading) => set({ loading }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 10),
    })),
}));

export const useMapStore = create((set) => ({
  hotspots: [],
  patrols: [],
  selectedHotspot: null,
  setHotspots: (hotspots) => set({ hotspots }),
  setPatrols: (patrols) => set({ patrols }),
  setSelectedHotspot: (hotspot) => set({ selectedHotspot: hotspot }),
}));
