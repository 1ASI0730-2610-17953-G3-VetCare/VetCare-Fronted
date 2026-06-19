import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { tokenStorage } from '@/iam/infrastructure/token-storage.js';

export class PerfilApi {
  constructor() {
    this.endpoint = '/profile';
  }

  mapProductivity(profile) {
    const productivity = profile.productivity ?? profile.Productivity ?? {};
    return {
      citasEsteMes: productivity.monthlyAppointments ?? productivity.MonthlyAppointments ?? 0,
      pacientesAtendidos: productivity.patientsAttended ?? productivity.PatientsAttended ?? 0,
      metaMensualPorcentaje: productivity.monthlyGoalPercent ?? productivity.MonthlyGoalPercent ?? 0
    };
  }

  mapProfileResponse(profile, sessionUser = null) {
    const user = sessionUser ?? tokenStorage.getSession().user;
    const avatarUrl = profile.avatarUrl ?? profile.AvatarUrl ?? user?.avatarUrl ?? null;

    return {
      id: profile.id,
      avatarUrl,
      datosPersonales: {
        nombre: user?.nombre ?? '',
        apellidos: user?.apellidos ?? '',
        correoElectronico: user?.email ?? '',
        telefono: '',
        especialidad: user?.especialidad ?? '',
        dni: ''
      },
      preferencias: {
        notificacionesEmail: profile.receiveNotifications ?? true,
        notificacionesPush: profile.receiveNotifications ?? true,
        recordatoriosCitas: profile.receiveNotifications ?? true,
        modoOscuro: profile.theme === 'dark',
        sonidosSistema: true
      },
      actividad: this.mapProductivity(profile)
    };
  }

  async getPerfil(sessionUser) {
    const response = await BaseApi.get(this.endpoint);
    return this.mapProfileResponse(response.data, sessionUser);
  }

  async updatePerfil(data, sessionUser) {
    const preferencias = data.preferencias ?? {};
    const payload = {
      theme: preferencias.modoOscuro ? 'dark' : 'light',
      language: 'es',
      receiveNotifications: preferencias.notificacionesEmail ?? true
    };
    const response = await BaseApi.put(this.endpoint, payload);
    return this.mapProfileResponse(response.data, sessionUser);
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await BaseApi.post(`${this.endpoint}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.avatarUrl ?? response.data.AvatarUrl;
  }
}
