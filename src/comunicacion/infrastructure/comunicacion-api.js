import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class ComunicacionApi {
  async getClientMessages(clientId) {
    try {
      const response = await BaseApi.get(`/messages/client/${clientId}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener mensajes del cliente ${clientId}`, error);
      throw error;
    }
  }

  async sendMessage(payload) {
    try {
      const response = await BaseApi.post('/messages/send', payload);
      return response.data;
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      throw error;
    }
  }
}
