import { defineStore } from 'pinia';
import { HospitalizationService } from '../../infrastructure/services/hospitalization.service.js';
import { pendingTasksState } from '../../infrastructure/hospitalization-task.utils.js';
import { hasFreshCache } from '@/shared/application/cache.utils.js';

const hospitalizationService = new HospitalizationService();

export const useHospitalizationStore = defineStore('hospitalization', {
  state: () => ({
    admissions: [],
    loading: false,
    error: null,
    lastFetchedAt: null
  }),
  getters: {
    hasCachedOverview: (state) =>
      hasFreshCache(state.lastFetchedAt, state.admissions.length || pendingTasksState.value.length)
  },
  actions: {
    async fetchOverview({ force = false } = {}) {
      if (!force && this.hasCachedOverview) {
        return { admissions: this.admissions, tasks: pendingTasksState.value };
      }

      this.loading = true;
      this.error = null;
      try {
        const overview = await hospitalizationService.fetchOverview();
        this.admissions = overview.admissions;
        pendingTasksState.value = overview.tasks;
        this.lastFetchedAt = Date.now();
        return overview;
      } catch (error) {
        this.error = error.message || 'Error fetching hospitalization overview';
        this.admissions = [];
        pendingTasksState.value = [];
        throw error;
      } finally {
        this.loading = false;
      }
    },
    invalidate() {
      this.lastFetchedAt = null;
    }
  }
});
