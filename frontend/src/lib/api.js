import axios from 'axios';

// Determine API URL based on environment
const getAPIUrl = () => {
  // In development, use explicit URL
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  // In production, use same host but port 8000
  const host = window.location.hostname;
  const port = 8000;
  return `http://${host}:${port}`;
};

const API_URL = import.meta.env.VITE_API_URL || getAPIUrl();

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const auth = {
  login: (badgeNo, password) =>
    api.post('/auth/login', { badge_no: badgeNo, password }),
  logout: () => localStorage.removeItem('token'),
};

export const cases = {
  list: (skip = 0, limit = 20) =>
    api.get('/cases', { params: { skip, limit } }),
  get: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  update: (id, data) => api.patch(`/cases/${id}`, data),
  delete: (id) => api.delete(`/cases/${id}`),
};

export const incidents = {
  list: (skip = 0, limit = 20) =>
    api.get('/incident', { params: { skip, limit } }),
  get: (id) => api.get(`/incident/${id}`),
  create: (data) => api.post('/incident', data),
  update: (id, data) => api.patch(`/incident/${id}`, data),
};

export const patrol = {
  list: () => api.get('/patrol'),
  getLocation: () => api.get('/patrol/location'),
  updateLocation: (data) => api.post('/patrol/location', data),
};

export const hotspot = {
  list: () => api.get('/map/hotspots'),
  analytics: () => api.get('/map/analytics'),
};

export const cctv = {
  list: () => api.get('/cctv'),
  get: (id) => api.get(`/cctv/${id}`),
  getFeed: (id) => api.get(`/cctv/${id}/feed`),
};

export const analytics = {
  dashboard: () => api.get('/analytics/dashboard'),
  incidents: () => api.get('/analytics/incidents'),
  cases: () => api.get('/analytics/cases'),
};

export default api;
