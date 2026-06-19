<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useCurrencyStore } from '@/shared/application/currency.store.js'

const { t } = useI18n()
const currencyStore = useCurrencyStore()
const { currency, displayCode, usdToPenRate } = storeToRefs(currencyStore)

const switchTitle = computed(() =>
  currency.value === 'USD'
    ? t('layout.currency.switchTitleUsd', { rate: usdToPenRate.value })
    : t('layout.currency.switchTitlePen', { rate: usdToPenRate.value })
)
</script>

<template>
  <button
    type="button"
    class="currency-switcher"
    :title="switchTitle"
    :aria-label="t('layout.currency.ariaLabel')"
    @click="currencyStore.toggle()"
  >
    <span class="currency-switcher-label">{{ t('layout.currency.label') }}</span>
    <span class="currency-switcher-value">{{ displayCode }}</span>
  </button>
</template>

<style scoped>
.currency-switcher {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 8px 14px;
  border: 1px solid var(--bi-border, #e2e8f0);
  border-radius: 10px;
  background: var(--bi-paper, #ffffff);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  font-family: inherit;
  text-align: right;
}

.currency-switcher:hover {
  border-color: color-mix(in srgb, var(--bi-teal, #0f766e) 35%, var(--bi-border, #e2e8f0));
  background: var(--bi-bg, #eef2f6);
}

.currency-switcher:focus-visible {
  outline: 2px solid var(--bi-teal, #0f766e);
  outline-offset: 2px;
}

.currency-switcher-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--bi-muted, #64748b);
}

.currency-switcher-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--bi-ink, #0f172a);
}
</style>
