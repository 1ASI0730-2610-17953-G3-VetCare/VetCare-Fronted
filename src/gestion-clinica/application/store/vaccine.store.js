import { defineStore } from 'pinia';
import { VaccineService } from '../../infrastructure/services/vaccine.service.js';
import { vaccinesState } from '../../infrastructure/vaccine.utils.js';
import { hasFreshCache } from '@/shared/application/cache.utils.js';

const vaccineService = new VaccineService();

export const useVaccineStore = defineStore('vaccine', {
  state: () => ({
    loading: false,
    error: null,
    lastFetchedAt: null
  }),
  getters: {
    vaccines: () => vaccinesState.value,
    hasCachedVaccines: (state) =>
      hasFreshCache(state.lastFetchedAt, vaccinesState.value.length)
  },
  actions: {
    async fetchVaccines({ force = false } = {}) {
      if (!force && this.hasCachedVaccines) {
        return vaccinesState.value;
      }

      this.loading = true;
      this.error = null;
      try {
        const vaccines = await vaccineService.fetchAll();
        this.lastFetchedAt = Date.now();
        return vaccines;
      } catch (error) {
        this.error = error.message || 'Error fetching vaccines';
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
