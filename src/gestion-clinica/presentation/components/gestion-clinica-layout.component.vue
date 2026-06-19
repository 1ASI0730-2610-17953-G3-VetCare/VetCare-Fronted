<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';

const route = useRoute();
const { t } = useI18n();

const tabs = computed(() => [
  { id: 'pacientes', label: t('clinicManagement.tabs.patients'), route: '/gestion-clinica/pacientes', icon: 'pi pi-heart' },
  { id: 'clientes', label: t('clinicManagement.tabs.clients'), route: '/gestion-clinica/clientes', icon: 'pi pi-users' },
  { id: 'consultas', label: t('clinicManagement.tabs.consultations'), route: '/gestion-clinica/consultas', icon: 'pi pi-calendar-plus' },
  { id: 'historial', label: t('clinicManagement.tabs.clinicalHistory'), route: '/gestion-clinica/historial', icon: 'pi pi-book' },
  { id: 'vacunas', label: t('clinicManagement.tabs.vaccines'), route: '/gestion-clinica/vacunas', icon: 'pi pi-shield' },
  { id: 'hospitalizacion', label: t('clinicManagement.tabs.hospitalization'), route: '/gestion-clinica/hospitalizacion', icon: 'pi pi-home' }
]);

const isTabActive = (tabRoute) => route.path === tabRoute || route.path.startsWith(`${tabRoute}/`);
</script>

<template>
  <div class="gestion-clinica-layout">
    <nav class="tabs-panel" :aria-label="t('clinicManagement.tabsNavAriaLabel')">
      <div class="tabs-panel-inner">
        <div class="tabs-scroll">
          <router-link
            v-for="tab in tabs"
            :key="tab.id"
            :to="tab.route"
            :class="['tab-link', `tab-link--${tab.id}`, { 'active-tab': isTabActive(tab.route) }]"
          >
            <span class="tab-icon-wrap">
              <i :class="tab.icon" aria-hidden="true"></i>
            </span>
            <span class="tab-label">{{ tab.label }}</span>
          </router-link>
        </div>
      </div>
    </nav>

    <div class="tab-content">
      <router-view v-slot="{ Component }">
        <keep-alive :max="8">
          <component :is="Component" v-if="Component" :key="$route.name" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.gestion-clinica-layout {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: -24px;
  width: calc(100% + 48px);
  min-height: calc(100vh - 128px);
  padding: 24px;
  background:
    radial-gradient(
      color-mix(in srgb, var(--color-primary-main) 4%, transparent) 1px,
      transparent 1px
    ) 0 0 / 24px 24px,
    var(--color-background-main);
}

.tabs-panel {
  flex-shrink: 0;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.tabs-panel-inner {
  padding: 10px 12px;
  background: color-mix(in srgb, var(--color-background-surface) 92%, var(--color-primary-subtle));
}

.tabs-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.tab-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: var(--font-body-main-weight);
  font-size: var(--font-body-main-size);
  border: 1px solid transparent;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.15s ease;
  white-space: nowrap;
}

.tab-link:focus-visible {
  outline: 2px solid var(--color-primary-main);
  outline-offset: 2px;
}

.tab-link:hover {
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-primary-main) 6%, var(--color-background-surface));
}

.tab-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--color-text-muted) 12%, var(--color-background-surface));
  color: var(--color-text-secondary);
  transition: background 0.2s ease, color 0.2s ease;
}

.tab-icon-wrap i {
  font-size: 14px;
}

.tab-link:hover .tab-icon-wrap {
  background: color-mix(in srgb, var(--color-primary-main) 12%, var(--color-background-surface));
  color: var(--color-primary-main);
}

.tab-link.active-tab {
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 22%, transparent);
  box-shadow: 0 1px 3px color-mix(in srgb, var(--color-primary-main) 12%, transparent);
}

.tab-link.active-tab .tab-icon-wrap {
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
}

/* Accentos complementarios por sección (activo) */
.tab-link--pacientes.active-tab {
  color: var(--color-status-success-text);
  background: var(--color-status-success-bg);
  border-color: color-mix(in srgb, var(--color-status-success-indicator) 24%, transparent);
}
.tab-link--pacientes.active-tab .tab-icon-wrap {
  background: var(--color-status-success-indicator);
}

.tab-link--clientes.active-tab {
  color: var(--color-status-info-text);
  background: var(--color-status-info-bg);
  border-color: color-mix(in srgb, var(--color-status-info-indicator) 24%, transparent);
}
.tab-link--clientes.active-tab .tab-icon-wrap {
  background: var(--color-status-info-indicator);
}

.tab-link--consultas.active-tab {
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 24%, transparent);
}
.tab-link--consultas.active-tab .tab-icon-wrap {
  background: var(--color-primary-main);
}

.tab-link--historial.active-tab {
  color: color-mix(in srgb, var(--color-status-warning-text) 88%, var(--color-text-primary));
  background: var(--color-status-warning-bg);
  border-color: color-mix(in srgb, var(--color-status-warning-indicator) 24%, transparent);
}
.tab-link--historial.active-tab .tab-icon-wrap {
  background: var(--color-status-warning-indicator);
}

.tab-link--vacunas.active-tab {
  color: var(--color-status-success-text);
  background: color-mix(in srgb, var(--color-status-success-bg) 80%, var(--color-primary-subtle));
  border-color: color-mix(in srgb, var(--color-status-success-indicator) 20%, var(--color-primary-main) 8%);
}
.tab-link--vacunas.active-tab .tab-icon-wrap {
  background: color-mix(in srgb, var(--color-status-success-indicator) 72%, var(--color-primary-main));
}

.tab-link--hospitalizacion.active-tab {
  color: var(--color-status-danger-text);
  background: var(--color-status-danger-bg);
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 24%, transparent);
}
.tab-link--hospitalizacion.active-tab .tab-icon-wrap {
  background: var(--color-status-danger-indicator);
}

.tab-content {
  flex: 1;
  min-height: 0;
}

@media (max-width: 768px) {
  .gestion-clinica-layout {
    margin: 0;
    width: 100%;
    min-height: 0;
    padding: 0;
    background: var(--color-background-main);
  }

  .tabs-panel-inner {
    padding: 8px 10px;
  }

  .tabs-scroll {
    flex-wrap: nowrap;
    padding-bottom: 2px;
  }

  .tab-label {
    font-size: 13px;
  }

  .tab-link {
    padding: 8px 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .tab-link {
    transition: none;
  }
}
</style>
