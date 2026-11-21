import api from '../config/axiosConfig';

class FinanceInsightsService {
  async gerar(walletId, startDate, endDate) {
    try {
      const response = await api.post(`/api/v1/wallets/${walletId}/insights`, { startDate, endDate });
      return response.data;
    } catch (error) {
      const data = error.response?.data;
      const message = typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : 'Não foi possível gerar a análise financeira agora.';
      throw new Error(message);
    }
  }
}

export const financeInsightsService = new FinanceInsightsService();
