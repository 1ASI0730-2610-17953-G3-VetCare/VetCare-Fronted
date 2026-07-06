import { BaseApi } from '@/shared/infrastructure/base-api.js';

export const AdminDashboardApi = {
  getSummary:      () => BaseApi.get('/dashboard/admin-summary').then(r => r.data),
  getRevenueChart: () => BaseApi.get('/dashboard/revenue-chart').then(r => r.data),
  getTopProducts:  () => BaseApi.get('/dashboard/top-products').then(r => r.data),
  getExpiringLots: () => BaseApi.get('/dashboard/expiring-lots').then(r => r.data),
  getCashClosing:  (date) => BaseApi.get('/dashboard/cash-closing', { params: { date } }).then(r => r.data),
  getSalesReport:  (from, to) => BaseApi.get('/dashboard/sales-report', { params: { from, to } }).then(r => r.data),
  getCommissions:  (doctorName, commissionRate) => BaseApi.get('/dashboard/commissions', { params: { doctorName, commissionRate } }).then(r => r.data),
};
