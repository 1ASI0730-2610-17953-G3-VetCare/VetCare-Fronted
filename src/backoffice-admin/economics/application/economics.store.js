import { defineStore } from 'pinia';
import { EconomicsApi } from '../infrastructure/economics-api.js';
import { Entry } from '../domain/model/entry.entity.js';

export const useEconomicsStore = defineStore('economics', {
  state: () => ({
    entries: [],
    isLoading: false,
    error: null
  }),
  getters: {
    totalIncome: (state) => {
      return state.entries
        .filter(e => e.type === 'Ingreso')
        .reduce((sum, e) => sum + e.amount, 0);
    },
    totalExpense: (state) => {
      return state.entries
        .filter(e => e.type === 'Egreso')
        .reduce((sum, e) => sum + e.amount, 0);
    },
    balance: (state) => {
      return state.totalIncome - state.totalExpense;
    }
  },
  actions: {
    async fetchEntries() {
      this.isLoading = true;
      try {
        const data = await EconomicsApi.getEntries();
        this.entries = data.map(e => new Entry(e));
      } catch (err) {
        this.error = err;
      } finally {
        this.isLoading = false;
      }
    },
    async addEntry(entryData) {
      try {
        await EconomicsApi.createEntry(entryData);
        await this.fetchEntries();
      } catch (err) {
        this.error = err;
        throw err;
      }
    }
  }
});
