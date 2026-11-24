import api from '../config/axiosConfig';

class FinanceInsightsService {
  async gerar(walletId, startDate, endDate) {
    try {
      const response = await api.post(`/api/v1/wallets/${walletId}/insights`, { startDate, endDate });
      return response.data;
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      console.error('[FinanceInsights] Falha ao gerar análise financeira', {
        status,
        backendMessage: data?.message || data?.error,
        error: error.message
      });

      const messages = {
        401: 'Sua sessão expirou. Entre novamente para gerar a análise.',
        403: 'Você não tem permissão para gerar esta análise.',
        429: 'Muitas solicitações de análise. Aguarde um pouco e tente novamente.',
        503: 'A análise por IA está temporariamente indisponível. Tente novamente mais tarde.'
      };
      const message = messages[status]
        || (status >= 500
          ? 'Não foi possível gerar a análise neste momento. Tente novamente mais tarde.'
          : 'Não foi possível gerar a análise financeira. Tente novamente.');
      throw new Error(message);
    }
  }
}

export const financeInsightsService = new FinanceInsightsService();
