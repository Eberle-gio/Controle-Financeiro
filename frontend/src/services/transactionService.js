import api from '../config/axiosConfig';

class TransactionService {
  // Lista transações paginadas de uma carteira
  async getTransactions(walletId, { page = 0, size = 20, sort = 'date,desc', startDate, endDate, categoryId, type } = {}) {
    try {
      const params = { page, size, sort };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (categoryId) params.categoryId = categoryId;
      if (type) params.type = type;

      const response = await api.get(`/api/v1/wallets/${walletId}/transactions`, { params });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar transações';
      throw new Error(errorMessage);
    }
  }

  // Cria uma nova transação
  async createTransaction(walletId, transactionData) {
    try {
      const response = await api.post(`/api/v1/wallets/${walletId}/transactions`, transactionData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar transação';
      throw new Error(errorMessage);
    }
  }

  // Atualiza uma transação existente
  async updateTransaction(walletId, id, transactionData) {
    try {
      const response = await api.put(`/api/v1/wallets/${walletId}/transactions/${id}`, transactionData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar transação';
      throw new Error(errorMessage);
    }
  }

  // Exclui uma transação
  async deleteTransaction(walletId, id) {
    try {
      await api.delete(`/api/v1/wallets/${walletId}/transactions/${id}`);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao excluir transação';
      throw new Error(errorMessage);
    }
  }
}

export const transactionService = new TransactionService();
