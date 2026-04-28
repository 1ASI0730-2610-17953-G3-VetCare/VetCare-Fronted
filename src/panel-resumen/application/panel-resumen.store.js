import { defineStore } from 'pinia';
import { ref } from 'vue';
import { panelResumenApi } from '../infrastructure/panel-resumen-api';

export const usePanelResumenStore = defineStore('panelResumen', () => {
  const kpis = ref([]);
  const citas = ref([]);
  const alertas = ref([]);
  const actividad = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchDashboardData = async () => {
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
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  return {
    kpis,
    citas,
    alertas,
    actividad,
    loading,
    error,
    fetchDashboardData
  };
});