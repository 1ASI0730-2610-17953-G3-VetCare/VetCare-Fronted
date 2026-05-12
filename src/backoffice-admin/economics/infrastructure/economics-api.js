import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class EconomicsApi {
  static async getEntries() {
    const response = await BaseApi.get('/economics_entries');
    return response.data;
  }

  static async createEntry(entryData) {
    const response = await BaseApi.post('/economics_entries', entryData);
    return response.data;
  }
}
