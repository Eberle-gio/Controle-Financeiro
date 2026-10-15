import api from '../config/axiosConfig';
import { decodeJwt, tokenIsCurrent } from './sessionUtils';

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

      // Salva o token JWT principal no localStorage
      localStorage.setItem('accessToken', accessToken);

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
      localStorage.setItem('current_session', JSON.stringify(sessao));

      return sessao;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || error.response?.data || 'Credenciais inválidas';
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
    const sessao = localStorage.getItem('current_session');
    if (!sessao) return null;
    try {
      const parseado = JSON.parse(sessao);
      return parseado?.user || { name: 'Usuário', email: '' };
    } catch {
      return null;
    }
  }

  isAuthenticated() {
    return tokenIsCurrent(localStorage.getItem('accessToken'));
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('current_session');
  }
}

export const authService = new AuthService();
