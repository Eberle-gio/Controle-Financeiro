import api from '../config/axiosConfig';

export const invitationService = {
  async consultar(token) {
    try { return (await api.get(`/api/invitations/${token}`)).data; }
    catch (error) { throw new Error(error.response?.data?.message || 'Não foi possível carregar o convite.'); }
  },
  async aceitar(token) {
    try { return (await api.post('/api/v1/invitations/accept', { token })).data; }
    catch (error) { throw new Error(error.response?.data?.message || 'Não foi possível aceitar o convite.'); }
  },
};
