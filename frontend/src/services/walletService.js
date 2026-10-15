import api from '../config/axiosConfig';
import { walletSelectionKey } from './walletSelection';

const initialLoads = new Map();

class WalletService {
  // Compartilha a carga inicial para nao criar duas carteiras em efeitos simultaneos.
  listarOuCriarCarteiraPadrao() {
    const key = walletSelectionKey();
    if (!initialLoads.has(key)) {
      const loading = (async () => {
        const wallets = await this.listarCarteiras();
        return wallets.length ? wallets : [await this.garantirCarteiraPadrao()];
      })().finally(() => initialLoads.delete(key));
      initialLoads.set(key, loading);
    }
    return initialLoads.get(key);
  }

  // Lista todas as carteiras onde o usuário é dono ou membro
  async garantirCarteiraPadrao() {
    const response = await api.put('/api/v1/wallets/default');
    return response.data;
  }

  async listarCarteiras() {
    const response = await api.get('/api/v1/wallets');
    return response.data;
  }

  // Cria uma nova carteira
  async criarCarteira(nome, descricao) {
    try {
      const response = await api.post('/api/v1/wallets', { nome, descricao });
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao criar carteira';
      throw new Error(mensagemErro);
    }
  }

  // Busca detalhes de uma carteira específica
  async buscarPorId(id) {
    try {
      const response = await api.get(`/api/v1/wallets/${id}`);
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao buscar carteira';
      throw new Error(mensagemErro);
    }
  }

  // Atualiza carteira existente
  async atualizarCarteira(id, nome, descricao) {
    try {
      const response = await api.put(`/api/v1/wallets/${id}`, { nome, descricao });
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao atualizar carteira';
      throw new Error(mensagemErro);
    }
  }

  // Exclui carteira (somente dono)
  async excluirCarteira(id) {
    try {
      await api.delete(`/api/v1/wallets/${id}`);
      return true;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao excluir carteira';
      throw new Error(mensagemErro);
    }
  }

  // Busca o resumo consolidado do Dashboard
  async obterResumo(carteiraId, dataInicio, dataFim) {
    try {
      const params = {};
      if (dataInicio) params.startDate = dataInicio;
      if (dataFim) params.endDate = dataFim;

      const response = await api.get(`/api/v1/wallets/${carteiraId}/summary`, { params });
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao buscar resumo financeiro';
      throw new Error(mensagemErro);
    }
  }

  // Membros
  async listarMembros(carteiraId) {
    try {
      const response = await api.get(`/api/v1/wallets/${carteiraId}/members`);
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao listar membros';
      throw new Error(mensagemErro);
    }
  }

  async adicionarMembro(carteiraId, email, papel) {
    try {
      const response = await api.post(`/api/v1/wallets/${carteiraId}/members`, { email, papel });
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao adicionar membro';
      throw new Error(mensagemErro);
    }
  }

  async removerMembro(carteiraId, usuarioId) {
    try {
      await api.delete(`/api/v1/wallets/${carteiraId}/members/${usuarioId}`);
      return true;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao remover membro';
      throw new Error(mensagemErro);
    }
  }
}

export const walletService = new WalletService();
