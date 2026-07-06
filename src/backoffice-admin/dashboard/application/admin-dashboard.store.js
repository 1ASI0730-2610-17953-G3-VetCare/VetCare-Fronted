import { defineStore } from 'pinia';
import { AdminDashboardApi } from '../infrastructure/admin-dashboard-api.js';

export const useAdminDashboardStore = defineStore('adminDashboard', {
  state: () => ({
    summary: null,
    revenueChart: [],
    topProducts: [],
    expiringLots: [],
    cashClosing: null,
    salesReport: null,
    commissions: null,
    loading: false,
    reportsLoading: false,
    error: null,
  }),
  actions: {
    async fetchAll() {
      const isInitialLoad = !this.summary;
      if (isInitialLoad) this.loading = true;
      this.error = null;
      try {
        const [summary, revenueChart, topProducts, expiringLots] = await Promise.all([
          AdminDashboardApi.getSummary(),
          AdminDashboardApi.getRevenueChart(),
          AdminDashboardApi.getTopProducts(),
          AdminDashboardApi.getExpiringLots(),
        ]);
        this.summary = summary;
        this.revenueChart = revenueChart;
        this.topProducts = topProducts;
        this.expiringLots = expiringLots;
      } catch (error) {
        this.error = error.message || 'Error loading dashboard data';
        console.error('Failed to load admin dashboard data', error);
      } finally {
        if (isInitialLoad) this.loading = false;
      }
    },

    async fetchCashClosing(date) {
      this.reportsLoading = true;
      try {
        this.cashClosing = await AdminDashboardApi.getCashClosing(date);
      } catch (error) {
        console.error('Error fetching cash closing', error);
        throw error;
      } finally {
        this.reportsLoading = false;
      }
    },

    async fetchSalesReport(from, to) {
      this.reportsLoading = true;
      try {
        this.salesReport = await AdminDashboardApi.getSalesReport(from, to);
      } catch (error) {
        console.error('Error fetching sales report', error);
        throw error;
      } finally {
        this.reportsLoading = false;
      }
    },

    async fetchCommissions(doctorName, commissionRate) {
      this.reportsLoading = true;
      try {
        this.commissions = await AdminDashboardApi.getCommissions(doctorName, commissionRate);
      } catch (error) {
        console.error('Error fetching commissions', error);
        throw error;
      } finally {
        this.reportsLoading = false;
      }
    },
  }
});