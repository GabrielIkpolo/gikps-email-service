import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('gikpsmail_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor to handle errors (e.g., 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('gikpsmail_token');
      // Redirect to login if not already there (simplified for now)
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
