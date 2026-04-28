import { defineStore } from 'pinia';
import { AgendaApi } from '../infrastructure/agenda-api.js';
import { CitaAssembler } from '../infrastructure/cita.assembler.js';

export const useAgendaStore = defineStore('agenda', {
  state: () => ({
    citas: [],
    loading: false,
    error: null,
  }),

  getters: {
    getCitasPendientes: (state) => state.citas.filter(cita => cita.status === 'Pendiente'),
    getCitasConfirmadas: (state) => state.citas.filter(cita => cita.status === 'Confirmada'),
  },

  actions: {
    async fetchCitas() {
      this.loading = true;
      try {
        const api = new AgendaApi();
        const response = await api.getAll();
        this.citas = CitaAssembler.toEntitiesFromResources(response.data);
      } catch (err) {
        this.error = err.message || 'Error al obtener citas';
      } finally {
        this.loading = false;
      }
    },
    
    async addCita(citaData) {
      this.loading = true;
      try {
        const api = new AgendaApi();
        const response = await api.create(citaData);
        const nuevaCita = CitaAssembler.toEntityFromResource(response.data);
        this.citas.push(nuevaCita);
      } catch (err) {
        this.error = err.message || 'Error al crear cita';
        throw err;
      } finally {
        this.loading = false;
      }
    }
  }
});
