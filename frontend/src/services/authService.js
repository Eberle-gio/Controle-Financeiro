import api from '../config/axiosConfig';

class AuthService {
  async register(name, email, password) {
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || 'Erro ao realizar cadastro';
      throw new Error(errorMessage);
    }
  }

  async login(email, password) {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      const { accessToken, tokenType, expiresIn } = response.data;

      // Salva o token JWT principal no localStorage
      localStorage.setItem('accessToken', accessToken);

      let userObj = { email, name: email.split('@')[0] };
      try {
        const payloadBase64 = accessToken.split('.')[1];
        const decodedJson = atob(payloadBase64);
        const payload = JSON.parse(decodedJson);
        userObj = {
          id: payload.sub,
          email: payload.email || email,
          name: payload.name || email.split('@')[0]
        };
      } catch (e) {
        // Fallback se não conseguir decodificar
      }
      
      const session = {
        token: accessToken,
        accessToken,
        tokenType,
        expiresIn,
        user: userObj
      };
      localStorage.setItem('current_session', JSON.stringify(session));

      return session;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || 'Credenciais inválidas';
      throw new Error(errorMessage);
    }
  }

  async forgotPassword(email) {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao solicitar recuperação de senha';
      throw new Error(errorMessage);
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await api.post('/api/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Token inválido ou expirado';
      throw new Error(errorMessage);
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await api.patch('/api/v1/users/me/password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao alterar senha';
      throw new Error(errorMessage);
    }
  }

  async getProfile() {
    try {
      const response = await api.get('/api/v1/users/me');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar perfil do usuário';
      throw new Error(errorMessage);
    }
  }

  getCurrentUser() {
    const session = localStorage.getItem('current_session');
    if (!session) return null;
    try {
      const parsed = JSON.parse(session);
      return parsed?.user || { name: 'Usuário', email: '' };
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    const token = localStorage.getItem('accessToken');
    if (token) return true;

    const session = localStorage.getItem('current_session');
    if (!session) return false;
    try {
      const parsed = JSON.parse(session);
      return !!(parsed?.accessToken || parsed?.token);
    } catch {
      return false;
    }
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('current_session');
  }
}

export const authService = new AuthService();
