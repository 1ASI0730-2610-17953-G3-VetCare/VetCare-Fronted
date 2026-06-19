import { defineStore } from 'pinia';
import { ClientService } from '../../infrastructure/services/client.service.js';
import { hasFreshCache } from '@/shared/application/cache.utils.js';

const clientService = new ClientService();

export const useClientStore = defineStore('client', {
  state: () => ({
    clients: [],
    loading: false,
    error: null,
    lastFetchedAt: null
  }),
  getters: {
    totalClients: (state) => state.clients.length,
    activeClients: (state) => state.clients.filter((c) => c.status === 'Activo').length,
    newClients: (state) => {
      return state.clients.filter((c) => c.status === 'Activo').length > 0 ? 1 : 0;
    },
    hasCachedClients: (state) =>
      hasFreshCache(state.lastFetchedAt, state.clients.length)
  },
  actions: {
    async fetchClients({ force = false } = {}) {
      if (!force && this.hasCachedClients) {
        return this.clients;
      }

      this.loading = true;
      this.error = null;
      try {
        this.clients = await clientService.getAllClients();
        this.lastFetchedAt = Date.now();
        return this.clients;
      } catch (err) {
        this.error = err.message || 'Error fetching clients';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async addClient(clientData) {
      this.loading = true;
      this.error = null;
      try {
        const newClient = await clientService.createClient(clientData);
        this.clients.push(newClient);
        return newClient;
      } catch (err) {
        this.error = err.message || 'Error creating client';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    invalidate() {
      this.lastFetchedAt = null;
    }
  }
});
