import { defineStore } from 'pinia';
import { ProcurementApi } from '../infrastructure/procurement-api.js';
import { Supplier } from '../domain/model/supplier.entity.js';

export const useProcurementStore = defineStore('procurement', {
  state: () => ({
    suppliers: [],
    isLoading: false,
    error: null
  }),
  actions: {
    async fetchSuppliers() {
      this.isLoading = true;
      try {
        const data = await ProcurementApi.getSuppliers();
        this.suppliers = data.map(s => new Supplier(s));
      } catch (err) {
        this.error = err;
      } finally {
        this.isLoading = false;
      }
    },
    async createOrder(orderData) {
      try {
        await ProcurementApi.createOrder(orderData);
      } catch (err) {
        this.error = err;
        throw err;
      }
    },
    async createSupplier(supplierData) {
      try {
        const data = await ProcurementApi.createSupplier(supplierData);
        this.suppliers.push(new Supplier(data));
        return true;
      } catch (err) {
        this.error = err;
        return false;
      }
    }
  }
});
