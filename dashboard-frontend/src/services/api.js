import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const rtuApi = axios.create({
  baseURL: '/rtu-api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Alarms API
export const alarmsAPI = {
  getAll: (params) => api.get('/alarms', { params }),
  getActive: () => api.get('/alarms/active'),
  getById: (id) => api.get(`/alarms/${id}`),
  getByRoute: (routeId) => api.get(`/alarms/route/${routeId}`),
  acknowledge: (id, data) => api.post(`/alarms/${id}/acknowledge`, data),
  resolve: (id, data) => api.post(`/alarms/${id}/resolve`, data),
  getStatistics: () => api.get('/alarms/statistics')
};

// KPIs API
export const kpisAPI = {
  getNetworkHealth: () => api.get('/kpis/network-health'),
  getLatest: (kpiType) => api.get(`/kpis/latest/${kpiType}`),
  getHistory: (params) => api.get('/kpis/history', { params }),
  triggerCalculation: () => api.post('/kpis/calculate')
};

// Routes API (you can add this when Routes controller is created)
export const routesAPI = {
  getAll: () => api.get('/routes'),
  getById: (id) => api.get(`/routes/${id}`),
  getByRtu: (rtuId) => api.get(`/routes/rtu/${rtuId}`)
};

export const otdrAPI = {
  getRecent: (limit = 20, routeId) =>
    api.get('/otdr-tests/recent', { params: { limit, routeId } })
};

// RTUs API
export const rtusAPI = {
  getStatus: () => rtuApi.get('/api/rtu/status'),
  getRoutes: () => rtuApi.get('/api/rtu/routes'),
  startMonitoring: () => rtuApi.post('/api/rtu/start'),
  stopMonitoring: () => rtuApi.post('/api/rtu/stop')
};

export default api;
