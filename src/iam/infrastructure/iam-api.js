import { BaseApi } from '@/shared/infrastructure/base-api';

export class IamApi {
  /**
   * Autentica un usuario y obtiene el token de acceso
   * @param {Object} credentials - { email, password }
   * @returns {Promise<{ accessToken: string, user: Object, roles: string[] }>}
   */
  static async login(credentials) {
    // Usuarios de prueba simulados (Mock)
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

  /**
   * Cierra la sesión en el backend (opcional, si el backend lo requiere)
   * @returns {Promise<void>}
   */
  static async logout() {
    // Si el backend requiere invalidar el token, se hace aquí
    // await BaseApi.post('/auth/logout');
    return Promise.resolve();
  }
}
