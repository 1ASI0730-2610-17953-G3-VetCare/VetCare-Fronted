import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class InventoryApi {
  static async getProducts() {
    const response = await BaseApi.get('/inventory_products');
    return response.data;
  }

  static async updateProductStock(id, newStock) {
    const response = await BaseApi.patch(`/inventory_products/${id}`, { stock: newStock });
    return response.data;
  }

  static async createProduct(productData) {
    const response = await BaseApi.post('/inventory_products', productData);
    return response.data;
  }
}
