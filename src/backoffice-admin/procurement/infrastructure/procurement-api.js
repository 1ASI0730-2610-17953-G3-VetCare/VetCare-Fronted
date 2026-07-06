import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class ProcurementApi {
  static async getSuppliers() {
    const response = await BaseApi.get('/suppliers');
    return response.data;
  }

  static async getOrders() {
    const response = await BaseApi.get('/procurement-orders');
    return response.data;
  }

  static async createOrder(orderData) {
    const response = await BaseApi.post('/procurement-orders', orderData);
    return response.data;
  }

  static async createSupplier(supplierData) {
    const response = await BaseApi.post('/suppliers', supplierData);
    return response.data;
  }
}
