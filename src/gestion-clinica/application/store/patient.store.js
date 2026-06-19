import { defineStore } from 'pinia';
import { PatientService } from '../../infrastructure/services/patient.service';
import { hasFreshCache } from '@/shared/application/cache.utils.js';

const patientService = new PatientService();

export const usePatientStore = defineStore('patient', {
  state: () => ({
    patients: [],
    loading: false,
    error: null,
    lastFetchedAt: null
  }),
  getters: {
    hasCachedPatients: (state) =>
      hasFreshCache(state.lastFetchedAt, state.patients.length)
  },
  actions: {
    async fetchPatients({ force = false } = {}) {
      if (!force && this.hasCachedPatients) {
        return this.patients;
      }

      this.loading = true;
      this.error = null;
      try {
        this.patients = await patientService.getAllPatients();
        this.lastFetchedAt = Date.now();
        return this.patients;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async createPatient(payload) {
      const newPatient = await patientService.createPatient(payload);
      this.patients.push(newPatient);
      return newPatient;
    },
    async updatePatient(id, payload) {
      const updated = await patientService.updatePatient(id, payload);
      const index = this.patients.findIndex((patient) => patient.id === id);
      if (index !== -1) {
        this.patients[index] = updated;
      }
      return updated;
    },
    async deletePatient(id) {
      await patientService.deletePatient(id);
      this.patients = this.patients.filter((patient) => patient.id !== id);
    },
    invalidate() {
      this.lastFetchedAt = null;
    }
  }
});
