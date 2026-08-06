import api from '../config/axiosConfig';

class CategoryService {
  // Lista categorias do usuário logado (filtro opcional por tipo)
  async getCategories(type) {
    try {
      const params = {};
      if (type) params.type = type;

      const response = await api.get('/api/v1/categories', { params });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar categorias';
      throw new Error(errorMessage);
    }
  }

  // Cria uma nova categoria
  async createCategory(categoryData) {
    try {
      const response = await api.post('/api/v1/categories', categoryData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao criar categoria';
      throw new Error(errorMessage);
    }
  }

  // Atualiza uma categoria existente
  async updateCategory(id, categoryData) {
    try {
      const response = await api.put(`/api/v1/categories/${id}`, categoryData);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar categoria';
      throw new Error(errorMessage);
    }
  }

  // Exclui uma categoria (lança erro 422 se tiver transações vinculadas)
  async deleteCategory(id) {
    try {
      await api.delete(`/api/v1/categories/${id}`);
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao excluir categoria';
      throw new Error(errorMessage);
    }
  }
}

export const categoryService = new CategoryService();
