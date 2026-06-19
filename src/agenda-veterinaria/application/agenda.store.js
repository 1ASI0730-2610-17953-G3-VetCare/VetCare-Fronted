import { defineStore } from 'pinia';
import { AgendaApi } from '../infrastructure/agenda-api.js';
import { CitaAssembler } from '../infrastructure/cita.assembler.js';
import {
  isUpcomingActiveCita
} from '../infrastructure/appointment.mapper.js';
import { hasFreshCache } from '@/shared/application/cache.utils.js';

const STATUS_PRIORITY = {
  Pendiente: 0,
  Confirmada: 1,
  Completada: 2,
  Cancelada: 3
};

const sortCitas = (citas) => [...citas].sort((a, b) => {
  if (a.date !== b.date) return a.date.localeCompare(b.date);

  const priorityA = STATUS_PRIORITY[a.status] ?? 9;
  const priorityB = STATUS_PRIORITY[b.status] ?? 9;
  if (priorityA !== priorityB) return priorityA - priorityB;

  return a.timeStart.localeCompare(b.timeStart);
});

export const useAgendaStore = defineStore('agenda', {
  state: () => ({
    citas: [],
    loading: false,
    error: null,
    lastFetchedAt: null
  }),

  getters: {
    hasCachedCitas: (state) =>
      hasFreshCache(state.lastFetchedAt, state.citas.length),

    getCitasPendientes: (state) => state.citas.filter((cita) => cita.status === 'Pendiente'),
    getCitasConfirmadas: (state) => state.citas.filter((cita) => cita.status === 'Confirmada'),

    upcomingCitas(state) {
      return sortCitas(state.citas.filter(isUpcomingActiveCita));
    },

    sidebarCitas() {
      return this.upcomingCitas.slice(0, 6);
    },

    calendarCitas() {
      return this.upcomingCitas;
    }
  },

  actions: {
    async fetchCitas({ force = false } = {}) {
      if (!force && this.hasCachedCitas) {
        return this.citas;
      }

      this.loading = true;
      this.error = null;
      try {
        const api = new AgendaApi();
        const response = await api.getAll();
        this.citas = CitaAssembler.toEntitiesFromResources(response.data);
        this.lastFetchedAt = Date.now();
        return this.citas;
      } catch (err) {
        this.error = err.message || 'Error al obtener citas';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async refreshAfterCreate() {
      await this.fetchCitas({ force: true });
    },

    invalidate() {
      this.lastFetchedAt = null;
    }
  }
});
