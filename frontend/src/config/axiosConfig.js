import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para injetar o token JWT Bearer em todas as requisições autenticadas
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    const token = localStorage.getItem('accessToken');
    if (error.response?.status === 401 && token
        && error.config?.headers?.Authorization === `Bearer ${token}`) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('current_session');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
