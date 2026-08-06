import api from '../config/axiosConfig';
import { INITIAL_MOCK_WALLETS, INITIAL_MOCK_SUMMARY } from '../config/mockData';

class WalletService {
  // Lista todas as carteiras onde o usuário é dono ou membro (com fallback para mock centralizado)
  async getWallets() {
    try {
      const response = await api.get('/api/v1/wallets');
      if (response.data && response.data.length > 0) {
        return response.data;
      }
      return INITIAL_MOCK_WALLETS;
    } catch (error) {
      return INITIAL_MOCK_WALLETS;
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

  // Busca o resumo consolidado do Dashboard (com fallback inteligente para o mock centralizado)
  async getSummary(walletId, startDate, endDate) {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get(`/api/v1/wallets/${walletId}/summary`, { params });
      const data = response.data;

      // Se o banco de dados retornar dados zerados (sem lançamentos), distribui os dados mockados atrativos
      if (data && (!data.recentTransactions || data.recentTransactions.length === 0) && data.totalIncome === 0 && data.totalExpense === 0) {
        return INITIAL_MOCK_SUMMARY;
      }
      return data;
    } catch (error) {
      return INITIAL_MOCK_SUMMARY;
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
