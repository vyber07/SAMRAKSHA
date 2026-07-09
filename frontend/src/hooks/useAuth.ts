import { create } from 'zustand'
import { api } from '../api/client'

interface Officer {
  id: string
  badge_no: string
  name: string
  role: 'constable'|'io'|'sho'|'dcp'|'admin'
  ps_id: string
}

interface AuthStore {
  officer: Officer | null
  token: string | null
  initialized: boolean
  login: (badge: string, password: string) => Promise<void>
  logout: () => void
  restoreSession: () => Promise<void>
}

export const useAuth = create<AuthStore>((set) => ({
  officer: null,
  token: localStorage.getItem('token'),
  initialized: false,

  login: async (badge_no: string, password: string) => {
    const res = await api.post('/auth/login', { badge_no, password })
    const { access_token, officer } = res.data
    localStorage.setItem('token', access_token)
    set({ token: access_token, officer, initialized: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    api.post('/auth/logout').catch(() => {})
    set({ token: null, officer: null, initialized: true })
  },

  restoreSession: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ officer: null, token: null, initialized: true })
      return
    }
    
    try {
      // Fetch currently logged in officer details (can call a health/me route or try search/health)
      // For simplicity, since there's no /me route, we query cases or health with token,
      // or we can decoded it or use the saved officer info in localStorage.
      const storedOfficer = localStorage.getItem('officer')
      if (storedOfficer) {
        set({ officer: JSON.parse(storedOfficer), token, initialized: true })
      } else {
        // Clear if not resolvable
        set({ officer: null, token: null, initialized: true })
      }
    } catch {
      localStorage.removeItem('token')
      set({ officer: null, token: null, initialized: true })
    }
  }
}))

// Wrap login to store officer locally as well for persistence across refreshes
const originalLogin = useAuth.getState().login;
useAuth.setState({
  login: async (badge, password) => {
    await originalLogin(badge, password);
    const officer = useAuth.getState().officer;
    if (officer) {
      localStorage.setItem('officer', JSON.stringify(officer));
    }
  }
});

const originalLogout = useAuth.getState().logout;
useAuth.setState({
  logout: () => {
    localStorage.removeItem('officer');
    originalLogout();
  }
});
