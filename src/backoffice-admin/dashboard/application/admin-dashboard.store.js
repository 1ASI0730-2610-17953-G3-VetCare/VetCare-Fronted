import { defineStore } from 'pinia';
import { AdminDashboardApi } from '../infrastructure/admin-dashboard-api.js';

export const useAdminDashboardStore = defineStore('adminDashboard', {
  state: () => ({
    summary: null,
    revenueChart: [],
    topProducts: [],
    expiringLots: [],
    loading: false,
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
    }
  }
});