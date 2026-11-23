import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let csrfToken = null;
let csrfPromise = null;
let refreshPromise = null;

const limparSessaoLocal = () => sessionStorage.removeItem('current_session');

const obterCsrfToken = async () => {
  if (csrfToken) return csrfToken;
  if (!csrfPromise) {
    csrfPromise = api.get('/api/auth/csrf')
      .then(response => {
        csrfToken = response.data?.token || null;
        return csrfToken;
      })
      .finally(() => { csrfPromise = null; });
  }
  return csrfPromise;
};

const rotaDeAutenticacao = url =>
  ['/api/auth/login', '/api/auth/refresh', '/api/auth/logout', '/api/auth/csrf']
    .some(path => url?.endsWith(path));

api.interceptors.request.use(async config => {
  config.withCredentials = true;
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method)) {
    const token = await obterCsrfToken();
    if (token) config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

api.interceptors.response.use(response => response, async error => {
  const request = error.config;
  if (error.response?.status !== 401 || !request || request._retry || rotaDeAutenticacao(request.url)) {
    return Promise.reject(error);
  }

  request._retry = true;
  try {
    if (!refreshPromise) {
      refreshPromise = api.post('/api/auth/refresh').finally(() => { refreshPromise = null; });
    }
    const refreshed = await refreshPromise;
    if (refreshed.data?.user) {
      sessionStorage.setItem('current_session', JSON.stringify({ user: refreshed.data.user }));
    }
    return api.request(request);
  } catch {
    limparSessaoLocal();
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
});

export default api;
