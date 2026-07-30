import BaseService from './BaseService';

class AuthService extends BaseService {
  constructor() {
    super('/auth');
  }

  async register(name, email, password) {
    try {
      const resposta = await this.api.post(`${this.endPoint}/register`, { name, email, password });
      return resposta.data;
    } catch (error) {
      const errorMessage = error.response?.data || 'Erro ao realizar cadastro';
      throw new Error(errorMessage);
    }
  }

  async login(email, password) {
    try {
      const resposta = await this.api.post(`${this.endPoint}/login`, { email, password });
      const session = resposta.data;

      // Salva a sessão no localStorage no mesmo formato que o mockService usava
      // para manter compatibilidade com o resto do frontend (Dashboard, PrivateRoute, etc.)
      localStorage.setItem('current_session', JSON.stringify(session));

      return session;
    } catch (error) {
      const errorMessage = error.response?.data || 'Credenciais inválidas';
      throw new Error(errorMessage);
    }
  }

  isAuthenticated() {
    const session = localStorage.getItem('current_session');
    if (!session) return false;
    const parsed = JSON.parse(session);
    return !!parsed?.token;
  }

  logout() {
    localStorage.removeItem('current_session');
  }
}

export const authService = new AuthService();
