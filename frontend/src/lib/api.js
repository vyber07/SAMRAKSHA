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
  listMap:     () => http.get('/map/incidents'),
  slaBreaches: () => http.get('/incident/sla_breaches'),
  report:      (data) => http.post('/incident/report', data),
};

// ─── Analytics ─────────────────────────────────────────
export const analytics = {
  summary:       () => http.get('/analytics/summary'),
  trends:        () => http.get('/analytics/trends'),
  resourceStatus:() => http.get('/analytics/resource_status'),
  hotspotSurge:  () => http.get('/analytics/hotspot_surge'),
  patternMatches:() => http.get('/analytics/pattern_matches'),
  simulate:      (event, crowd_size) => http.post('/analytics/simulate', { event, crowd_size }),
};

// ─── Map / Hotspots ────────────────────────────────────
export const hotspot = {
  hotspots: (days, crime_type) => http.get('/map/hotspots', { params: { days, crime_type } }),
  wards:    () => http.get('/map/wards'),
  incidents:(params) => http.get('/map/incidents', { params }),
  alerts:   (limit) => http.get('/map/alerts', { params: { limit } }),
  cybercrime:(days) => http.get('/map/cybercrime', { params: { days } }),
};

// ─── Patrol ────────────────────────────────────────────
export const patrol = {
  routes:     () => http.get('/patrol/routes'),
  list:       () => http.get('/patrol/routes'),
  createUnit: (data) => http.post('/patrol/units', data),
  updateUnit: (unit_id, data) => http.patch(`/patrol/units/${unit_id}`, data),
  deleteUnit: (unit_id) => http.delete(`/patrol/units/${unit_id}`),
};

// ─── CCTV ──────────────────────────────────────────────
export const cctv = {
  list:      () => http.get('/cctv'),
  cameras:   () => http.get('/cctv/cameras'),
  anomalies: () => http.get('/cctv/anomalies'),
  sendAlert: (data) => http.post('/cctv/alert', data),
};

// ─── Smart Assistant ──────────────────────────────────────
// FIXED: payload must be { mode, question, case_id } — not { query, scope }
export const assistant = {
  query: (question, mode = 'all_cases', case_id = null) =>
    http.post('/assistant/query', { mode, question, case_id }),

  voiceQuery: (audioBlob, mode = 'all_cases', caseId = null) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    let url = `/assistant/voice-query?mode=${mode}`;
    if (caseId) url += `&case_id=${caseId}`;
    return http.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// ─── Admin ─────────────────────────────────────────────
export const admin = {
  officers:          () => http.get('/admin/officers'),
  createOfficer:     (data) => http.post('/admin/officers', data),
  updateOfficer:     (badge_no, data) => http.patch(`/admin/officers/${badge_no}`, data),
  auditLogs:         (params) => http.get('/admin/audit', { params }),
  health:            () => http.get('/admin/health'),
  getPermissions:    () => http.get('/admin/permissions'),
  getOfficerPerms:   (badge_no) => http.get(`/admin/officers/${badge_no}/permissions`),
  setOfficerPerms:   (badge_no, overrides) => http.put(`/admin/officers/${badge_no}/permissions`, overrides),
};

// ─── Documents ─────────────────────────────────────────
export const documents = {
  list:     (case_id) => http.get('/docs', { params: { case_id } }),
  generate: (case_id, doc_type, language = 'en') =>
    http.post('/docs/generate', { case_id, doc_type, language }, { responseType: 'blob' }),
};

export default http;
