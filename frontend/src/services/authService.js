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
}

export const authService = new AuthService();
