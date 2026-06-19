import { BaseApi } from '@/shared/infrastructure/base-api';
import { normalizeRoles } from './normalize-roles.js';

export class IamApi {

  static async login(credentials) {
    const response = await BaseApi.post('/auth/login', credentials);
    const data = response.data;
    
    return {
      accessToken: data.accessToken,
      user: {
        id: data.id,
        nombre: data.nombre,
        apellidos: data.apellidos,
        email: data.email
      },
      roles: normalizeRoles(data.roles)
    };
  }


  static async logout() {
    return Promise.resolve();
  }
}
