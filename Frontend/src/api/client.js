import axios from 'axios';

// Create a centralized API client instance
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request Interceptor: Attach JWT token if available
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studyhub_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Parse response and handle common errors
apiClient.interceptors.response.use(
  (response) => {
    // Return data directly to simplify usage in queries
    return response.data;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        console.warn('Unauthorized. Token might be expired.');
      }
      const apiError = new Error(
        error.response.data?.detail || 
        error.response.data?.message || 
        'An error occurred while communicating with the server.'
      );
      apiError.status = error.response.status;
      apiError.data = error.response.data;
      return Promise.reject(apiError);
    } else if (error.request) {
      return Promise.reject(new Error('Network error. No response received from server.'));
    } else {
      return Promise.reject(error);
    }
  }
);

export default apiClient;
