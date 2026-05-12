import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class ProcurementApi {
  static async getSuppliers() {
    const response = await BaseApi.get('/procurement_suppliers');
    return response.data;
  }

  static async createOrder(orderData) {
    const response = await BaseApi.post('/procurement_orders', orderData);
    return response.data;
  }

  static async createSupplier(supplierData) {
    const response = await BaseApi.post('/procurement_suppliers', supplierData);
    return response.data;
  }
}
