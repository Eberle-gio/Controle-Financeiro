import api from '../config/axiosConfig';

class CategoryService {
  // Lista categorias do usuário logado (filtro opcional por tipo)
  async listarCategorias(tipo) {
    try {
      const params = {};
      if (tipo) params.type = tipo;

      const response = await api.get('/api/v1/categories', { params });
      return response.data || [];
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao carregar categorias';
      throw new Error(mensagemErro);
    }
  }

  // Cria uma nova categoria
  async criarCategoria(dadosCategoria) {
    try {
      const response = await api.post('/api/v1/categories', dadosCategoria);
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao criar categoria';
      throw new Error(mensagemErro);
    }
  }

  // Atualiza uma categoria existente
  async atualizarCategoria(id, dadosCategoria) {
    try {
      const response = await api.put(`/api/v1/categories/${id}`, dadosCategoria);
      return response.data;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao atualizar categoria';
      throw new Error(mensagemErro);
    }
  }

  // Exclui uma categoria (lança erro 422 se tiver transações vinculadas)
  async excluirCategoria(id) {
    try {
      await api.delete(`/api/v1/categories/${id}`);
      return true;
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao excluir categoria';
      throw new Error(mensagemErro);
    }
  }
}

export const categoryService = new CategoryService();
