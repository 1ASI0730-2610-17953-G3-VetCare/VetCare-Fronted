import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class AppointmentService {
  async createAppointment({ patientId, clientId, date, startTime, endTime, type }) {
    const response = await BaseApi.post('/appointments', {
      patientId: Number(patientId),
      clientId: Number(clientId),
      date: `${date}T00:00:00Z`,
      startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime: endTime.length === 5 ? `${endTime}:00` : endTime,
      type
    });
    return response.data;
  }
}
