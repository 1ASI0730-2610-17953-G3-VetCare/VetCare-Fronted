<script setup>
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

const { locale } = useI18n()

const isSpanish = computed(() => locale.value === 'es')

function toggleLanguage() {
  locale.value = isSpanish.value ? 'en' : 'es'
  localStorage.setItem('vetcare-locale', locale.value)
}
</script>

<template>
  <button
    class="lang-switcher"
    :class="{ 'is-en': !isSpanish }"
    :title="isSpanish ? 'Switch to English' : 'Cambiar a Español'"
    @click="toggleLanguage"
    aria-label="Toggle language"
  >
        <span class="lang-track">
            <span class="lang-thumb"></span>

            <span class="lang-label lang-label--es" :class="{ 'is-active': isSpanish }">
        <span class="lang-text">ES</span>
      </span>
      <span class="lang-label lang-label--en" :class="{ 'is-active': !isSpanish }">
        <span class="lang-text">US</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
.lang-switcher {
  --switcher-h: 36px;
  --switcher-w: 88px;
  --thumb-w: 44px;
  --gap: 2px;
  --radius: 9999px;
  --transition: 0.28s cubic-bezier(0.4, 0, 0.2, 1);

  position: relative;
  width: var(--switcher-w);
  height: var(--switcher-h);
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  outline: none;
  flex-shrink: 0;
}

.lang-switcher:focus-visible .lang-track {
  box-shadow:
    0 0 0 3px rgba(0, 132, 199, 0.35),
    0 2px 8px rgba(0, 0, 0, 0.14);
}

.lang-track {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  border-radius: var(--radius);
  background: linear-gradient(135deg, #e8f4fc 0%, #dbeeff 100%);
  border: 1.5px solid #c5ddf4;
  overflow: hidden;
  box-shadow:
    0 2px 6px rgba(0, 132, 199, 0.12),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
  transition: background var(--transition), border-color var(--transition);
}

.is-en .lang-track {
  background: linear-gradient(135deg, #fff8e7 0%, #fff3cc 100%);
  border-color: #e8d48b;
  box-shadow:
    0 2px 6px rgba(200, 150, 0, 0.12),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.lang-thumb {
  position: absolute;
  top: var(--gap);
  left: var(--gap);
  width: calc(var(--thumb-w) - var(--gap) * 2);
  height: calc(var(--switcher-h) - var(--gap) * 2 - 3px);
  border-radius: var(--radius);
  background: linear-gradient(135deg, #0084C7 0%, #0099e6 100%);
  box-shadow:
    0 2px 8px rgba(0, 132, 199, 0.4),
    0 1px 2px rgba(0, 0, 0, 0.1);
  transition: transform var(--transition), background var(--transition), box-shadow var(--transition);
  z-index: 1;
  pointer-events: none;
}

.is-en .lang-thumb {
  transform: translateX(calc(var(--switcher-w) - var(--thumb-w)));
  background: linear-gradient(135deg, #d4a017 0%, #f0b429 100%);
  box-shadow:
    0 2px 8px rgba(200, 150, 0, 0.4),
    0 1px 2px rgba(0, 0, 0, 0.1);
}

.lang-label {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: var(--thumb-w);
  height: 100%;
  flex-shrink: 0;
  pointer-events: none;
  transition: opacity var(--transition), color var(--transition);
}

.lang-label--es { order: 1; }
.lang-label--en { order: 2; }

.lang-text {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #64748b;
  transition: color var(--transition);
}

.lang-label.is-active .lang-text {
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.lang-switcher:active .lang-thumb {
  transform: scaleX(1.05) translateX(0);
}
.lang-switcher.is-en:active .lang-thumb {
  transform: scaleX(1.05) translateX(calc(var(--switcher-w) - var(--thumb-w)));
}

.lang-switcher:hover .lang-track {
  box-shadow:
    0 4px 12px rgba(0, 132, 199, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}

.is-en.lang-switcher:hover .lang-track {
  box-shadow:
    0 4px 12px rgba(200, 150, 0, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
}
</style>
