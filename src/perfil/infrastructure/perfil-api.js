import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class PerfilApi {
  constructor() {
    this.endpoint = '/perfil';
  }

  async getPerfil() {
    const response = await BaseApi.get(this.endpoint);
    return response.data;
  }

  async updatePerfil(data) {
    const response = await BaseApi.put(this.endpoint, data);
    return response.data;
  }
}
