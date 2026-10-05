import api from './api';

const GOV_BASE = '/api/ai/admin';

export const aiManagementApi = {
  // Universities
  getUniversities: () => api.get(`${GOV_BASE}/universities/`),
  createUniversity: (data) => api.post(`${GOV_BASE}/universities/`, data),
  updateUniversity: (id, data) => api.put(`${GOV_BASE}/universities/${id}/`, data),
  deleteUniversity: (id) => api.delete(`${GOV_BASE}/universities/${id}/`),

  // Providers
  getProviders: () => api.get(`${GOV_BASE}/providers/`),
  createProvider: (data) => api.post(`${GOV_BASE}/providers/`, data),
  updateProvider: (id, data) => api.put(`${GOV_BASE}/providers/${id}/`, data),
  deleteProvider: (id) => api.delete(`${GOV_BASE}/providers/${id}/`),

  // Models
  getModels: (providerId = '') => api.get(`${GOV_BASE}/models/${providerId ? `?provider=${providerId}` : ''}`),
  createModel: (data) => api.post(`${GOV_BASE}/models/`, data),
  updateModel: (id, data) => api.put(`${GOV_BASE}/models/${id}/`, data),
  deleteModel: (id) => api.delete(`${GOV_BASE}/models/${id}/`),

  // Quotas
  getQuotas: (role = '') => api.get(`${GOV_BASE}/quotas/${role ? `?role=${role}` : ''}`),
  createQuota: (data) => api.post(`${GOV_BASE}/quotas/`, data),
  updateQuota: (id, data) => api.put(`${GOV_BASE}/quotas/${id}/`, data),
  deleteQuota: (id) => api.delete(`${GOV_BASE}/quotas/${id}/`),
  resetUserQuota: (userId) => api.post(`${GOV_BASE}/quotas/reset/${userId}/`),

  // User Quota Overrides
  getUserQuotas: () => api.get(`${GOV_BASE}/user-quotas/`),
  createUserQuota: (data) => api.post(`${GOV_BASE}/user-quotas/`, data),
  updateUserQuota: (id, data) => api.put(`${GOV_BASE}/user-quotas/${id}/`, data),
  deleteUserQuota: (id) => api.delete(`${GOV_BASE}/user-quotas/${id}/`),

  // Feature Flags
  getFeatureFlags: () => api.get(`${GOV_BASE}/feature-flags/`),
  createFeatureFlag: (data) => api.post(`${GOV_BASE}/feature-flags/`, data),
  updateFeatureFlag: (id, data) => api.put(`${GOV_BASE}/feature-flags/${id}/`, data),
  deleteFeatureFlag: (id) => api.delete(`${GOV_BASE}/feature-flags/${id}/`),

  // Usage & Logs
  getUsageOverview: () => api.get(`${GOV_BASE}/usage/`),
  getUserUsage: (userId) => api.get(`${GOV_BASE}/usage/${userId}/`),
  getLogs: (params) => api.get(`${GOV_BASE}/logs/`, { params }),
  getAuditLogs: (params) => api.get(`${GOV_BASE}/audit-logs/`, { params }),
  getDashboardStats: () => api.get(`${GOV_BASE}/analytics/dashboard/`),

  // Export
  getExportUrl: (type, start, end) => {
    return `${api.defaults.baseURL}${GOV_BASE}/reports/export/?report_type=${type}&start_date=${start}&end_date=${end}`;
  }
};
