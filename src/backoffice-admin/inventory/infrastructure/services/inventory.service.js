import { BaseApi } from '../../../../shared/infrastructure/base-api.js';

export class InventoryService {
  async getAllProducts() {
    try {
      const response = await BaseApi.get('/products');
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  async getLowStockProducts() {
    try {
      const response = await BaseApi.get('/products/low-stock');
      return response.data;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  }

  async createProduct(data) {
    try {
      const response = await BaseApi.post('/products', data);
      return response.data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  async registerLot(id, lotData) {
    try {
      const response = await BaseApi.post(`/products/${id}/lots`, lotData);
      return response.data;
    } catch (error) {
      console.error(`Error registering lot for product ${id}:`, error);
      throw error;
    }
  }

  async deductStock(id, quantity) {
    try {
      const response = await BaseApi.post(`/products/${id}/deduct`, { quantity });
      return response.data;
    } catch (error) {
      console.error(`Error deducting stock for product ${id}:`, error);
      throw error;
    }
  }
}
