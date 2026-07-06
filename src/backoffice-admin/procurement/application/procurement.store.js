import { defineStore } from 'pinia';
import { ProcurementApi } from '../infrastructure/procurement-api.js';
import { Supplier } from '../domain/model/supplier.entity.js';

export const useProcurementStore = defineStore('procurement', {
  state: () => ({
    suppliers: [],
    orders: [],
    isLoading: false,
    error: null
  }),
  getters: {
    completedOrders: (state) => state.orders.filter((o) => (o.status ?? o.Status) === 'Completada'),
    pendingOrders: (state) => state.orders.filter((o) => (o.status ?? o.Status) !== 'Completada'),
    totalSpent: (state) => state.orders.reduce((sum, o) => sum + Number(o.total ?? o.Total ?? 0), 0)
  },
  actions: {
    async fetchSuppliers() {
      const isInitialLoad = this.suppliers.length === 0;
      if (isInitialLoad) this.isLoading = true;
      this.error = null;
      try {
        const data = await ProcurementApi.getSuppliers();
        this.suppliers = data.map(s => new Supplier(s));
      } catch (err) {
        this.error = err;
      } finally {
        if (isInitialLoad) this.isLoading = false;
      }
    },
    async fetchOrders() {
      try {
        this.orders = await ProcurementApi.getOrders();
      } catch (err) {
        console.error('Error fetching orders', err);
      }
    },
    async createOrder(orderData) {
      try {
        const created = await ProcurementApi.createOrder(orderData);
        this.orders.unshift(created);
      } catch (err) {
        throw err;
      }
    },
    async createSupplier(supplierData) {
      try {
        const data = await ProcurementApi.createSupplier(supplierData);
        this.suppliers.push(new Supplier(data));
        return true;
      } catch (err) {
        console.error('Error creating supplier', err);
        return false;
      }
    }
  }
});
