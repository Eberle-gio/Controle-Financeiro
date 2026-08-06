import api from '../config/axiosConfig';

class WalletService {
  // Lista todas as carteiras onde o usuário é dono ou membro
  async getWallets() {
    try {
      const response = await api.get('/api/v1/wallets');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar carteiras';
      throw new Error(errorMessage);
    }
  }

  // Cria uma nova carteira
  async createWallet(nome, descricao) {
    try {
      const response = await api.post('/api/v1/wallets', { nome, descricao });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar carteira';
      throw new Error(errorMessage);
    }
  }

  // Busca detalhes de uma carteira específica
  async getWalletById(id) {
    try {
      const response = await api.get(`/api/v1/wallets/${id}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao buscar carteira';
      throw new Error(errorMessage);
    }
  }

  // Atualiza carteira existente
  async updateWallet(id, nome, descricao) {
    try {
      const response = await api.put(`/api/v1/wallets/${id}`, { nome, descricao });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar carteira';
      throw new Error(errorMessage);
    }
  }

  // Exclui carteira (somente dono)
  async deleteWallet(id) {
    try {
      await api.delete(`/api/v1/wallets/${id}`);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao excluir carteira';
      throw new Error(errorMessage);
    }
  }

  // Busca o resumo consolidado do Dashboard (saldos, gráficos e recentes)
  async getSummary(walletId, startDate, endDate) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/api/v1/wallets/${walletId}/summary`, { params });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar resumo da carteira';
      throw new Error(errorMessage);
    }
  }

  // Membros
  async getMembers(walletId) {
    try {
      const response = await api.get(`/api/v1/wallets/${walletId}/members`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao listar membros';
      throw new Error(errorMessage);
    }
  }

  async addMember(walletId, email, papel) {
    try {
      const response = await api.post(`/api/v1/wallets/${walletId}/members`, { email, papel });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao adicionar membro';
      throw new Error(errorMessage);
    }
  }

  async removeMember(walletId, userId) {
    try {
      await api.delete(`/api/v1/wallets/${walletId}/members/${userId}`);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao remover membro';
      throw new Error(errorMessage);
    }
  }
}

export const walletService = new WalletService();
