import { BaseApi } from '@/shared/infrastructure/base-api';

export class IamApi {

  static async login(credentials) {

    if (credentials.email === 'admin@veterinaria.com' && credentials.password === 'admin123') {
      return {
        accessToken: 'admin-token',
        user: {
          nombre: 'Admin',
          apellidos: 'Sistema',
          email: 'admin@veterinaria.com'
        },
        roles: ['admin']
      };
    }

    if (credentials.email === 'doctor@veterinaria.com' && credentials.password === 'vet123') {
      return {
        accessToken: 'vet-token',
        user: {
          nombre: 'Dr. Arturo',
          apellidos: 'Veterinario',
          email: 'doctor@veterinaria.com'
        },
        roles: ['veterinario']
      };
    }

    const response = await BaseApi.post('/auth/login', credentials);
    return response.data;
  }


  static async logout() {


    return Promise.resolve();
  }
}
