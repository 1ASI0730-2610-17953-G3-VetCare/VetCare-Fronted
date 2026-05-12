<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<template>
  <div class="hospitalizacion-view">
    <div class="actions-bar">
      <div class="view-info">
        <h1 class="view-title">{{ t('clinicManagement.tabs.hospitalization') }}</h1>
        <p class="view-description">Gestión de pacientes hospitalizados.</p>
      </div>
    </div>
    <div class="empty-state">
      <i class="pi pi-home empty-icon"></i>
      <h3>Módulo en construcción</h3>
      <p>Pronto podrás gestionar la hospitalización aquí.</p>
    </div>
  </div>
</template>

<style scoped>
.hospitalizacion-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.view-title {
  font-size: 24px;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 4px 0;
}

.view-description {
  font-size: 14px;
  color: #64748B;
  margin: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px dashed #CBD5E1;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #94A3B8;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: #1E293B;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: #64748B;
  margin: 0;
}
</style>
