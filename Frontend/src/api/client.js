import api from '../services/api';

/**
 * Thin wrapper around the canonical services/api client.
 * This preserves the legacy behavior of returning response.data directly
 * for consumers like React Query hooks, while using the unified auth/refresh logic.
 */
const apiClient = {
  get: async (url, config) => {
    const response = await api.get(url, config);
    return response.data;
  },
  post: async (url, data, config) => {
    const response = await api.post(url, data, config);
    return response.data;
  },
  put: async (url, data, config) => {
    const response = await api.put(url, data, config);
    return response.data;
  },
  patch: async (url, data, config) => {
    const response = await api.patch(url, data, config);
    return response.data;
  },
  delete: async (url, config) => {
    const response = await api.delete(url, config);
    return response.data;
  }
};

export default apiClient;
