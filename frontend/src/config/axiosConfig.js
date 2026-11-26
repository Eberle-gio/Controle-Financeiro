import axios from 'axios';
import { attachAccessToken, clearAuthTokens, getRefreshToken, saveAuthTokens } from '../services/authTokenStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let refreshPromise = null;

const limparSessaoLocal = () => {
  sessionStorage.removeItem('current_session');
  clearAuthTokens();
};

const obterCsrfDoCookie = () => {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
};

const obterCsrfToken = async () => {
  const cookieToken = obterCsrfDoCookie();
  if (cookieToken) return cookieToken;

  try {
    const response = await api.get('/api/auth/csrf');
    return response.data?.token || obterCsrfDoCookie();
  } catch {
    return obterCsrfDoCookie();
  }
};

const rotaDeAutenticacao = url =>
  ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/csrf']
    .some(path => url?.endsWith(path));

api.interceptors.request.use(async config => {
  config.withCredentials = true;
  attachAccessToken(config);
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const token = await obterCsrfToken();
    if (token) config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

api.interceptors.response.use(response => response, async error => {
  const request = error.config;
  
  // Se for 401 na tela de login ou rota de auth, não tenta refresh token
  const estaNaTelaDeLogin = window.location.pathname === '/login' || window.location.pathname === '/';
  if (error.response?.status !== 401 || !request || request._retry || rotaDeAutenticacao(request.url) || estaNaTelaDeLogin) {
    return Promise.reject(error);
  }

  request._retry = true;
  try {
    if (!refreshPromise) {
      refreshPromise = api.post('/api/auth/refresh', { refreshToken: getRefreshToken() })
        .finally(() => { refreshPromise = null; });
    }
    const refreshed = await refreshPromise;
    saveAuthTokens(refreshed.data);
    if (refreshed.data?.user) {
      sessionStorage.setItem('current_session', JSON.stringify({ user: refreshed.data.user }));
    }
    return api.request(request);
  } catch {
    limparSessaoLocal();
    if (!estaNaTelaDeLogin) {
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
});

export default api;
