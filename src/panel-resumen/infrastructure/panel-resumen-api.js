import axios from 'axios';
import { API_BASE_URL } from '../../shared/infrastructure/api-base-url.js';

const API_URL = API_BASE_URL;

export const panelResumenApi = {
  getKpis: async () => {
    const response = await axios.get(`${API_URL}/dashboard_kpis`);
    return response.data;
  },
  
  getCitas: async () => {
    const response = await axios.get(`${API_URL}/dashboard_citas`);
    return response.data;
  },
  
  getAlertas: async () => {
    const response = await axios.get(`${API_URL}/dashboard_alertas`);
    return response.data;
  },
  
  getActividad: async () => {
    const response = await axios.get(`${API_URL}/dashboard_actividad`);
    return response.data;
  }
};