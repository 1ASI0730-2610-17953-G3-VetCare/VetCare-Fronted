import { defineStore } from 'pinia';
import { PatientService } from '../../infrastructure/services/patient.service';

export const usePatientStore = defineStore('patient', {
  state: () => ({
    patients: [],
    loading: false,
    error: null
  }),
  actions: {
    async fetchPatients() {
      this.loading = true;
      this.error = null;
      try {
        const service = new PatientService();
        this.patients = await service.getAllPatients();
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
});
