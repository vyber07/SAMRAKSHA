import React, { createContext, useContext, useState, useEffect } from 'react';
import { Officer, OfficerRole } from '../lib/types';
import { authApi } from '../lib/api';
import { mockOfficers } from '../lib/mockData';

export interface AuthContextType {
  user: Officer | null;
  token: string | null;
  isAuthenticated: boolean;
  role: OfficerRole;
  login: (badge_no: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: OfficerRole) => void;
  updateProfile: (data: Partial<Officer>) => void;
}

const STORAGE_KEY_TOKEN = 'samraksha_auth_token';
const STORAGE_KEY_ROLE = 'samraksha_officer_role';

const getStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  }
};

const removeStorageItem = (key: string): void => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(key);
  }
};

// Map default officers for each of the 5 roles to enable seamless role preview
const ROLE_OFFICER_MAP: Record<OfficerRole, Officer> = {
  sho: mockOfficers.find(o => o.role === 'sho') || {
    id: 'OFF-002',
    badge_no: 'GJ-AMD-1002',
    name: 'Inspector Vikram Jadeja',
    role: 'sho',
    ps_id: 'PS-NAV-01',
    ps_name: 'Navrangpura Police Station',
    email: 'v.jadeja@gujaratpolice.gov.in',
    phone: '+91 98765 43210',
    status: 'on_duty',
    rank: 'Senior Police Inspector (SHO)'
  },
  io: mockOfficers.find(o => o.role === 'io') || {
    id: 'OFF-004',
    badge_no: 'GJ-AMD-2041',
    name: 'Sub-Inspector Anita Roy',
    role: 'io',
    ps_id: 'PS-NAV-01',
    ps_name: 'Navrangpura Police Station',
    email: 'a.roy@gujaratpolice.gov.in',
    phone: '+91 98765 43211',
    status: 'on_duty',
    rank: 'Sub-Inspector (IO)'
  },
  constable: mockOfficers.find(o => o.role === 'constable') || {
    id: 'OFF-006',
    badge_no: 'GJ-AMD-5012',
    name: 'Constable Rahul Verma',
    role: 'constable',
    ps_id: 'PS-NAV-01',
    ps_name: 'Navrangpura Police Station',
    email: 'r.verma@gujaratpolice.gov.in',
    phone: '+91 98765 43212',
    status: 'on_duty',
    rank: 'Head Constable'
  },
  dcp: mockOfficers.find(o => o.role === 'dcp') || {
    id: 'OFF-001',
    badge_no: 'GJ-AMD-0010',
    name: 'DCP Vikramaditya Sharma',
    role: 'dcp',
    ps_id: 'PS-HQ-01',
    ps_name: 'Ahmedabad City Police HQ',
    email: 'dcp.zone1@gujaratpolice.gov.in',
    phone: '+91 98765 43200',
    status: 'on_duty',
    rank: 'Deputy Commissioner of Police'
  },
  admin: mockOfficers.find(o => o.role === 'admin') || {
    id: 'OFF-009',
    badge_no: 'GJ-AMD-9999',
    name: 'Priya Desai (Systems Admin)',
    role: 'admin',
    ps_id: 'PS-HQ-01',
    ps_name: 'Command & Control Center',
    email: 'admin.samraksha@gujaratpolice.gov.in',
    phone: '+91 98765 43999',
    status: 'active',
    rank: 'Senior System Administrator'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return getStorageItem(STORAGE_KEY_TOKEN);
  });

  const [role, setRoleState] = useState<OfficerRole>(() => {
    const savedRole = getStorageItem(STORAGE_KEY_ROLE) as OfficerRole;
    return savedRole && ROLE_OFFICER_MAP[savedRole] ? savedRole : 'sho';
  });

  const [user, setUser] = useState<Officer | null>(() => {
    const savedRole = getStorageItem(STORAGE_KEY_ROLE) as OfficerRole;
    return savedRole && ROLE_OFFICER_MAP[savedRole] ? ROLE_OFFICER_MAP[savedRole] : null;
  });

  const isAuthenticated = Boolean(token && user);

  useEffect(() => {
    if (token) {
      setStorageItem(STORAGE_KEY_TOKEN, token);
    } else {
      removeStorageItem(STORAGE_KEY_TOKEN);
    }
  }, [token]);

  useEffect(() => {
    setStorageItem(STORAGE_KEY_ROLE, role);
  }, [role]);

  const login = async (badge_no: string, password: string): Promise<boolean> => {
    const result = await authApi.login(badge_no, password);
    setToken(result.token);
    setRoleState(result.user.role);
    setUser(result.user);
    return true;
  };

  const logout = () => {
    void authApi.logout().catch(() => undefined);
    setToken(null);
    setUser(null);
    setRoleState('constable');
    removeStorageItem(STORAGE_KEY_TOKEN);
    removeStorageItem(STORAGE_KEY_ROLE);
  };

  const switchRole = (newRole: OfficerRole) => {
    setRoleState(newRole);
    const newOfficer = ROLE_OFFICER_MAP[newRole] || ROLE_OFFICER_MAP.sho;
    setUser(newOfficer);
    setStorageItem(STORAGE_KEY_ROLE, newRole);
  };

  const updateProfile = (data: Partial<Officer>) => {
    setUser(prev => (prev ? { ...prev, ...data } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        role,
        login,
        logout,
        switchRole,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
