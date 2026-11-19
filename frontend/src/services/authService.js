import api from '../config/axiosConfig';
import { decodeJwt, tokenIsCurrent } from './sessionUtils';

// Remove a sessao persistente salva por versoes anteriores do aplicativo.
localStorage.removeItem('accessToken');
localStorage.removeItem('current_session');

const mensagemDeErro = (error, fallback) => {
  const status = error.response?.status;
  const data = error.response?.data;
  if (status >= 500) return 'O servidor falhou ao processar o login. Tente novamente mais tarde.';
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
      const mensagemErro = error.response?.data?.message || error.response?.data || 'Erro ao realizar cadastro';
      throw new Error(mensagemErro);
    }
  }

  async login(email, senha) {
    try {
      const response = await api.post('/api/auth/login', { email, password: senha });
      const { accessToken, tokenType, expiresIn } = response.data;

      // Mantém a autenticação apenas nesta aba; ao fechá-la, a sessão termina.
      sessionStorage.setItem('accessToken', accessToken);

      let objetoUsuario = { email, name: email.split('@')[0] };
      try {
        const payload = decodeJwt(accessToken);
        objetoUsuario = {
          id: payload.sub,
          email: payload.email || email,
          name: payload.name || email.split('@')[0]
        };
      } catch { /* Usa o e-mail como identificacao se o payload nao puder ser decodificado. */ }
      
      const sessao = {
        token: accessToken,
        accessToken,
        tokenType,
        expiresIn,
        user: objetoUsuario
      };
      sessionStorage.setItem('current_session', JSON.stringify(sessao));

      return sessao;
    } catch (error) {
      const mensagemErro = mensagemDeErro(error, 'Nao foi possivel entrar. Confira seus dados e tente novamente.');
      throw new Error(mensagemErro);
    }
  }

  async solicitarRecuperacaoSenha(email) {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao solicitar recuperação de senha';
      throw new Error(mensagemErro);
    }
  }

  async redefinirSenha(token, novaSenha) {
    try {
      const response = await api.post('/api/auth/reset-password', { token, newPassword: novaSenha });
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Token inválido ou expirado';
      throw new Error(mensagemErro);
    }
  }

  async alterarSenha(senhaAtual, novaSenha) {
    try {
      const response = await api.patch('/api/v1/users/me/password', { currentPassword: senhaAtual, newPassword: novaSenha });
      this.logout();
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao alterar senha';
      throw new Error(mensagemErro);
    }
  }

  async obterPerfil() {
    try {
      const response = await api.get('/api/v1/users/me');
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao carregar perfil do usuário';
      throw new Error(mensagemErro);
    }
  }

  obterUsuarioAtual() {
    const sessao = sessionStorage.getItem('current_session');
    if (!sessao) return null;
    try {
      const parseado = JSON.parse(sessao);
      return parseado?.user || { name: 'Usuário', email: '' };
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    return tokenIsCurrent(sessionStorage.getItem('accessToken'));
  }

  logout() {
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('current_session');
  }
}

export const authService = new AuthService();
