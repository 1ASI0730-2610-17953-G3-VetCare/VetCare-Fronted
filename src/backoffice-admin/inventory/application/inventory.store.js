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
      const isInitialLoad = this.products.length === 0;
      if (isInitialLoad) this.isLoading = true;
      try {
        const data = await InventoryApi.getProducts();
        this.products = data.map(p => new Product(p));
      } catch (err) {
        this.error = err;
      } finally {
        if (isInitialLoad) this.isLoading = false;
      }
    },
    async updateStock(id, newStock) {
      const stock = Number(newStock);
      try {
        await InventoryApi.updateProductStock(id, stock);
        const product = this.products.find(p => p.id === id);
        if (product) {
          product.stock = stock;
        }
      } catch (err) {
        this.error = err;
      }
    },
    async createProduct(productData) {
      try {
        await InventoryApi.createProduct(productData);
        await this.fetchProducts();
        return true;
      } catch (err) {
        this.error = err;
        return false;
      }
    }
  }
});
