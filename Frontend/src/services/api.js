import axios from 'axios';

const API_BASE = 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for Gamification badge unlocks
api.interceptors.response.use((response) => {
    if (response.data && response.data.badge_unlocked && response.data.badge) {
        window.dispatchEvent(new CustomEvent('badge-unlocked', { detail: response.data.badge }));
        window.dispatchEvent(new Event('refresh-gamification'));
    }
    return response;
});

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.map((callback) => callback(token));
  refreshSubscribers = [];
};

const onRefreshFailed = (error) => {
  refreshSubscribers.map((callback) => callback(null, error));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

// Automatically refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loop if the refresh endpoint itself returns 401
    if (originalRequest.url.includes('/auth/token/refresh/')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      
      if (!refresh) {
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((token, err) => {
            if (err) {
              reject(err);
            } else {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const res = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        const newToken = res.data.access;
        localStorage.setItem('access_token', newToken);
        isRefreshing = false;
        onRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        onRefreshFailed(refreshError);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
