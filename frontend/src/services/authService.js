import api from '../config/axiosConfig';
import { clearAuthTokens, saveAuthTokens } from './authTokenStorage';

// Limpa credenciais gravadas por versoes anteriores; tokens atuais sao HttpOnly.
localStorage.removeItem('accessToken');
localStorage.removeItem('current_session');
sessionStorage.removeItem('accessToken');

const mensagemDeErro = (error, fallback) => {
  const status = error.response?.status;
  const data = error.response?.data;
  if (status >= 500) return 'O servidor falhou ao processar a solicitação. Tente novamente mais tarde.';
  if (typeof data === 'string' && data.trim()) return data;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  if (typeof data?.error === 'string' && data.error.trim()) return data.error;
  return fallback;
};

class AuthService {
  async confirmarCadastro(token) {
    try {
      const response = await api.post('/api/auth/confirm-email', { token });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Não foi possível confirmar seu cadastro. Tente novamente.');
    }
  }

  async reenviarConfirmacao(email) {
    try {
      const response = await api.post('/api/auth/resend-confirmation', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Não foi possível reenviar a confirmação. Tente novamente.');
    }
  }

  async cadastrar(nome, email, senha) {
    try {
      const response = await api.post('/api/auth/register', { name: nome, email, password: senha });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao realizar cadastro');
    }
  }

  async login(email, senha) {
    try {
      const response = await api.post('/api/auth/login', { email, password: senha });
      saveAuthTokens(response.data);
      const sessao = { user: response.data.user };
      sessionStorage.setItem('current_session', JSON.stringify(sessao));
      return sessao;
    } catch (error) {
      throw new Error(mensagemDeErro(error, 'Não foi possível entrar. Confira seus dados e tente novamente.'));
    }
  }

  async solicitarRecuperacaoSenha(email) {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao solicitar recuperação de senha');
    }
  }

  async redefinirSenha(token, novaSenha) {
    try {
      const response = await api.post('/api/auth/reset-password', { token, newPassword: novaSenha });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Token inválido ou expirado');
    }
  }

  async alterarSenha(senhaAtual, novaSenha) {
    try {
      const response = await api.patch('/api/v1/users/me/password', { currentPassword: senhaAtual, newPassword: novaSenha });
      await this.logout();
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao alterar senha');
    }
  }

  async obterPerfil() {
    try {
      const response = await api.get('/api/v1/users/me');
      sessionStorage.setItem('current_session', JSON.stringify({ user: response.data }));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erro ao carregar perfil do usuário');
    }
  }

  async atualizarPerfil(nome) {
    try {
      const response = await api.put('/api/v1/users/me', { name: nome });
      sessionStorage.setItem('current_session', JSON.stringify({ user: response.data }));
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Não foi possível atualizar seu perfil.');
    }
  }

  async obterResumoExclusaoConta() {
    try {
      const response = await api.get('/api/v1/users/me/account-deletion-summary');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Não foi possível verificar suas carteiras.');
    }
  }

  async excluirConta(senhaAtual, confirmacao) {
    try {
      await api.delete('/api/v1/users/me', { data: { currentPassword: senhaAtual, confirmation: confirmacao } });
      sessionStorage.removeItem('current_session');
      sessionStorage.removeItem('accessToken');
      localStorage.removeItem('current_session');
      localStorage.removeItem('accessToken');
      clearAuthTokens();
      sessionStorage.setItem('account_deleted', 'true');
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Não foi possível excluir sua conta.');
    }
  }

  async validarSessao() {
    if (!sessionStorage.getItem('current_session')) {
      return null;
    }
    try {
      return await this.obterPerfil();
    } catch {
      sessionStorage.removeItem('current_session');
      return null;
    }
  }

  obterUsuarioAtual() {
    const sessao = sessionStorage.getItem('current_session');
    if (!sessao) return null;
    try {
      return JSON.parse(sessao)?.user || null;
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    return Boolean(this.obterUsuarioAtual());
  }

  async logout() {
    try {
      await api.post('/api/auth/logout', { refreshToken: sessionStorage.getItem('auth_refresh_token') });
    } catch {
      // Remove o estado local mesmo quando não for possível contatar o backend.
    } finally {
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('current_session');
      clearAuthTokens();
    }
  }
}

export const authService = new AuthService();
