import { defineStore } from 'pinia'

const STORAGE_KEY = 'vetcare-admin-currency'
const USD_TO_PEN_RATE = 3.45

export const useCurrencyStore = defineStore('currency', {
  state: () => ({
    currency: localStorage.getItem(STORAGE_KEY) || 'USD',
    usdToPenRate: USD_TO_PEN_RATE
  }),

  getters: {
    symbol: (state) => (state.currency === 'PEN' ? 'S/' : '$'),
    displayCode: (state) => (state.currency === 'PEN' ? 'PEN (S/)' : 'USD ($)')
  },

  actions: {
    toggle() {
      this.currency = this.currency === 'USD' ? 'PEN' : 'USD'
      localStorage.setItem(STORAGE_KEY, this.currency)
    },

    convertFromUsd(amountUsd) {
      const value = Number(amountUsd) || 0
      return this.currency === 'PEN' ? value * this.usdToPenRate : value
    }
  }
})
