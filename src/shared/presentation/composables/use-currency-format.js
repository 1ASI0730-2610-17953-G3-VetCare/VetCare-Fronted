import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCurrencyStore } from '@/shared/application/currency.store.js'

export function useCurrencyFormat() {
  const currencyStore = useCurrencyStore()
  const { currency, symbol } = storeToRefs(currencyStore)

  const formatMoneyParts = (amountUsd) => {
    const converted = currencyStore.convertFromUsd(amountUsd)
    const parts = converted.toFixed(2).split('.')
    return {
      int: parseInt(parts[0], 10).toLocaleString('en-US'),
      dec: `.${parts[1]}`
    }
  }

  const formatCurrency = (amountUsd) => {
    const converted = currencyStore.convertFromUsd(amountUsd)
    const locale = currency.value === 'PEN' ? 'es-PE' : 'en-US'
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.value,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(converted)
  }

  const formatSignedAmount = (type, amountUsd) => {
    const sign = type === 'Ingreso' ? '+' : '-'
    const parts = formatMoneyParts(amountUsd)
    return `${sign}${symbol.value}${parts.int}${parts.dec}`
  }

  const formatPlainAmount = (amountUsd) => {
    const parts = formatMoneyParts(amountUsd)
    return `${symbol.value}${parts.int}${parts.dec}`
  }

  const axisPrefix = computed(() => `${symbol.value} `)

  return {
    currency,
    symbol,
    formatMoneyParts,
    formatCurrency,
    formatSignedAmount,
    formatPlainAmount,
    axisPrefix
  }
}
