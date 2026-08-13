import React, { createContext, useContext, useState } from 'react';

interface User {
  badge: string;
  name: string;
  role: string;
  station: string;
}

interface AuthContextType {
  user: User | null;
  login: (badge: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => false,
  logout: () => {},
  isAuthenticated: false,
});

const DEMO_CREDENTIALS = [
  { badge: 'ADMIN', password: 'admin', name: 'Superintendent of Police', role: 'Admin', station: 'ACP HQ Ahmedabad' },
  { badge: 'IO001', password: 'io001', name: 'Inspector Ravi Sharma', role: 'Investigation Officer', station: 'Satellite PS' },
  { badge: 'DESK01', password: 'desk01', name: 'ASI Priya Patel', role: 'Desk Officer', station: 'Naranpura PS' },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = sessionStorage.getItem('samraksha-user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (badge: string, password: string): boolean => {
    const cred = DEMO_CREDENTIALS.find(
      c => c.badge.toLowerCase() === badge.toLowerCase() && c.password === password
    );
    if (cred) {
      const u: User = { badge: cred.badge, name: cred.name, role: cred.role, station: cred.station };
      setUser(u);
      sessionStorage.setItem('samraksha-user', JSON.stringify(u));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('samraksha-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
