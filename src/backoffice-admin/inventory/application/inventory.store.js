import { defineStore } from 'pinia';
import { InventoryApi } from '../infrastructure/inventory-api.js';
import { Product } from '../domain/model/product.entity.js';

export const useInventoryStore = defineStore('inventory', {
  state: () => ({
    products: [],
    isLoading: false,
    error: null
  }),
  actions: {
    async fetchProducts() {
      this.isLoading = true;
      try {
        const data = await InventoryApi.getProducts();
        this.products = data.map(p => new Product(p));
      } catch (err) {
        this.error = err;
      } finally {
        this.isLoading = false;
      }
    },
    async updateStock(id, newStock) {
      try {
        await InventoryApi.updateProductStock(id, newStock);
        await this.fetchProducts(); // Refresh
      } catch (err) {
        this.error = err;
      }
    },
    async createProduct(productData) {
      try {
        await InventoryApi.createProduct(productData);
        await this.fetchProducts(); // Refresh
        return true;
      } catch (err) {
        this.error = err;
        return false;
      }
    }
  }
});
