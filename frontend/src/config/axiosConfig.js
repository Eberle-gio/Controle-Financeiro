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
    const token = sessionStorage.getItem('accessToken');
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
    const token = sessionStorage.getItem('accessToken');
    if (error.response?.status === 401 && token
        && error.config?.headers?.Authorization === `Bearer ${token}`) {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('current_session');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
