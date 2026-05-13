import axios from 'axios';
import { tokenStorage } from '../../iam/infrastructure/token-storage.js';
import router from '../../router.js';

export const BaseApi = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`, 
  headers: {
    'Content-type': 'application/json',
  }
});

BaseApi.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

BaseApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      tokenStorage.clearSession();
      router.push({ name: 'login' });
    }
    return Promise.reject(error);
  }
);
