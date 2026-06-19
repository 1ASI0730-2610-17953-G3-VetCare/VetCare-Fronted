import { defineStore } from 'pinia';
import { ConsultationService } from '../../infrastructure/services/consultation.service';
import { hasFreshCache } from '@/shared/application/cache.utils.js';

const consultationService = new ConsultationService();

export const useConsultationStore = defineStore('consultation', {
  state: () => ({
    consultations: [],
    loading: false,
    error: null,
    lastFetchedAt: null
  }),
  getters: {
    hasCachedConsultations: (state) =>
      hasFreshCache(state.lastFetchedAt, state.consultations.length)
  },
  actions: {
    async fetchConsultations({ force = false } = {}) {
      if (!force && this.hasCachedConsultations) {
        return this.consultations;
      }

      this.loading = true;
      this.error = null;
      try {
        this.consultations = await consultationService.getAllConsultations();
        this.lastFetchedAt = Date.now();
        return this.consultations;
      } catch (error) {
        this.error = error.message || 'Error fetching consultations';
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
