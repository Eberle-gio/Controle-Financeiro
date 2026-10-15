import api from '../config/axiosConfig';

class TransactionService {
  // Lista transações paginadas de uma carteira
  async listarTransacoes(carteiraId, { pagina = 0, tamanho = 20, ordenacao = 'data,desc', dataInicio, dataFim, categoriaId, tipo } = {}) {
    try {
      const params = { page: pagina, size: tamanho, sort: ordenacao };
      if (dataInicio) params.startDate = dataInicio;
      if (dataFim) params.endDate = dataFim;
      if (categoriaId) params.categoryId = categoriaId;
      if (tipo) params.type = tipo;

      const response = await api.get(`/api/v1/wallets/${carteiraId}/transactions`, { params });
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao carregar transações';
      throw new Error(mensagemErro);
    }
  }

  // Cria uma nova transação
  async criarTransacao(carteiraId, dadosTransacao) {
    try {
      const response = await api.post(`/api/v1/wallets/${carteiraId}/transactions`, dadosTransacao);
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao criar transação';
      throw new Error(mensagemErro);
    }
  }

  // Atualiza uma transação existente
  async atualizarTransacao(carteiraId, id, dadosTransacao) {
    try {
      const response = await api.put(`/api/v1/wallets/${carteiraId}/transactions/${id}`, dadosTransacao);
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao atualizar transação';
      throw new Error(mensagemErro);
    }
  }

  // Exclui uma transação
  async excluirTransacao(carteiraId, id) {
    try {
      await api.delete(`/api/v1/wallets/${carteiraId}/transactions/${id}`);
      return true;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao excluir transação';
      throw new Error(mensagemErro);
    }
  }
}

export const transactionService = new TransactionService();
