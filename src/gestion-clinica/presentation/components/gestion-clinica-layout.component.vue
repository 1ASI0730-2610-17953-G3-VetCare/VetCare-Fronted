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
  { id: 'hospitalizacion', label: t('clinicManagement.tabs.hospitalization'), route: '/gestion-clinica/hospitalizacion', icon: 'pi pi-home' },
  { id: 'resultados-lab', label: t('clinicManagement.tabs.labResults'), route: '/gestion-clinica/resultados-lab', icon: 'pi pi-file' },
  { id: 'recetas', label: t('clinicManagement.tabs.prescriptions'), route: '/gestion-clinica/recetas', icon: 'pi pi-file-edit' }
]);
</script>

<template>
  <div class="gestion-clinica-layout">
    <div class="tabs-container">
      <router-link
        v-for="tab in tabs"
        :key="tab.id"
        :to="tab.route"
        class="tab-link"
        active-class="active-tab"
      >
        <i :class="tab.icon"></i>
        {{ tab.label }}
      </router-link>
    </div>
    
    <div class="tab-content">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.gestion-clinica-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tabs-container {
  display: flex;
  gap: 24px;
  background-color: var(--color-background-surface, #FFFFFF);
  border-bottom: 1px solid var(--color-border-light, #E2E8F0);
  margin: calc(var(--spacing-container-padding, 24px) * -1) calc(var(--spacing-container-padding, 24px) * -1) 24px calc(var(--spacing-container-padding, 24px) * -1);
  padding: 0 var(--spacing-container-padding, 24px);
}

.tab-link {
  padding: 12px 0;
  text-decoration: none;
  color: var(--color-text-muted, #64748B);
  font-weight: 500;
  font-size: 16px;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-link:hover {
  color: var(--color-text-heading, #1E293B);
}

.tab-link.active-tab {
  color: var(--color-primary-main, #0EA5E9);
  border-bottom-color: var(--color-primary-main, #0EA5E9);
}

.tab-content {
  flex: 1;
}
</style>
