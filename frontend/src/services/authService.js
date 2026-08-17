import api from '../config/axiosConfig';

class AuthService {
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
        const payloadBase64 = accessToken.split('.')[1];
        const jsonDecodificado = atob(payloadBase64);
        const payload = JSON.parse(jsonDecodificado);
        objetoUsuario = {
          id: payload.sub,
          email: payload.email || email,
          name: payload.name || email.split('@')[0]
        };
      } catch (e) {
        
      }
      
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
    const token = localStorage.getItem('accessToken');
    if (token) return true;

    const sessao = localStorage.getItem('current_session');
    if (!sessao) return false;
    try {
      const parseado = JSON.parse(sessao);
      return !!(parseado?.accessToken || parseado?.token);
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
