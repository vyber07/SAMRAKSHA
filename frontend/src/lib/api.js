import axios from 'axios';

// Dynamic API base URL — uses current hostname so it works on localhost and LAN
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const host = window.location.hostname;
  return `http://${host}:8000`;
};

const http = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('samraksha_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('samraksha_token');
      localStorage.removeItem('samraksha_officer');
      if (window.location.pathname !== '/login') window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────────
export const auth = {
  login: (badge_no, password) => http.post('/auth/login', { badge_no, password }),
  logout: () => http.post('/auth/logout'),
};

// ─── Cases ─────────────────────────────────────────────
export const cases = {
  list: (page = 1, limit = 20) => http.get('/cases', { params: { page, limit } }),
  get: (id) => http.get(`/cases/${id}`),
  search: (q) => http.get('/cases/search', { params: { q } }),
  create: (data) => http.post('/cases/create', data),
};

// ─── Incidents ─────────────────────────────────────────
export const incidents = {
  listMap: () => http.get('/map/incidents'),
};

// ─── Analytics ─────────────────────────────────────────
export const analytics = {
  summary: () => http.get('/analytics/summary'),
  trends: () => http.get('/analytics/trends'),
};

// ─── Map / Hotspots ────────────────────────────────────
export const hotspot = {
  hotspots: () => http.get('/map/hotspots'),
  wards: () => http.get('/map/wards'),
  incidents: () => http.get('/map/incidents'),
  alerts: () => http.get('/map/alerts'),
};

// ─── Patrol ────────────────────────────────────────────
export const patrol = {
  list: () => http.get('/patrol'),
};

// ─── CCTV ──────────────────────────────────────────────
export const cctv = {
  list: () => http.get('/cctv'),
};

// ─── Smart Assistant ──────────────────────────────────────
export const assistant = {
  query: (query, scope = 'all') => http.post('/assistant/query', { query, scope }),
  voiceQuery: (audioBlob, mode = 'all_cases', caseId = null) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    let url = `/assistant/voice-query?mode=${mode}`;
    if (caseId) url += `&case_id=${caseId}`;
    return http.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// ─── Admin ─────────────────────────────────────────────
export const admin = {
  officers: () => http.get('/admin/officers'),
};

export default http;
