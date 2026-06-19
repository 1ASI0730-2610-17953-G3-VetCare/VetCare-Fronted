import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { panelResumenApi } from '../infrastructure/panel-resumen-api';
import { hasFreshCache } from '@/shared/application/cache.utils.js';

export const usePanelResumenStore = defineStore('panelResumen', () => {
  const kpis = ref([]);
  const citas = ref([]);
  const alertas = ref([]);
  const actividad = ref([]);
  const loading = ref(false);
  const error = ref(null);
  const lastFetchedAt = ref(null);

  const hasCachedDashboard = computed(() =>
    hasFreshCache(lastFetchedAt.value, kpis.value.length)
  );

  const fetchDashboardData = async ({ force = false } = {}) => {
    if (!force && hasCachedDashboard.value) {
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const [kpisData, citasData, alertasData, actividadData] = await Promise.all([
        panelResumenApi.getKpis(),
        panelResumenApi.getCitas(),
        panelResumenApi.getAlertas(),
        panelResumenApi.getActividad()
      ]);
      kpis.value = kpisData;
      citas.value = citasData;
      alertas.value = alertasData;
      actividad.value = actividadData;
      lastFetchedAt.value = Date.now();
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  const invalidate = () => {
    lastFetchedAt.value = null;
  };

  return {
    kpis,
    citas,
    alertas,
    actividad,
    loading,
    error,
    lastFetchedAt,
    hasCachedDashboard,
    fetchDashboardData,
    invalidate
  };
});
