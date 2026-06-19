import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class InventoryApi {
  static async getProducts() {
    const response = await BaseApi.get('/products');
    return response.data;
  }

  static async updateProductStock(id, newStock) {
    // In our backend we probably don't have a PATCH for stock, let's assume we use deduct/add or an update endpoint.
    // Wait, earlier I created an `UpdateStockAsync` in `InventoryService` but did I expose it?
    // Let me check ProductsController. Ah, I only added Create, GetLowStock, RegisterLot, DeductStock.
    // I should probably use `RegisterLot` or `DeductStock` for adjusting inventory instead of arbitrary PATCH.
    // But since the frontend uses a direct stock update for now, I will modify ProductsController later or mock it.
    // Let's add an Update endpoint to ProductsController.
    const response = await BaseApi.put(`/products/${id}/stock`, { stock: newStock });
    return response.data;
  }

  static async createProduct(productData) {
    const response = await BaseApi.post('/products', productData);
    return response.data;
  }
}
