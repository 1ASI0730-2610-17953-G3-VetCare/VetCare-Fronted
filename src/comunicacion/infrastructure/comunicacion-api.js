import { BaseApi } from '../../shared/infrastructure/base-api.js';

export class ComunicacionApi {
  async getNotificaciones() {
    const response = await BaseApi.get('/notificaciones');
    return response.data;
  }

  async getRecordatorios() {
    const response = await BaseApi.get('/recordatorios');
    return response.data;
  }

  async markAsRead(id) {
    const response = await BaseApi.patch(`/notificaciones/${id}`, { is_read: true });
    return response.data;
  }
}
