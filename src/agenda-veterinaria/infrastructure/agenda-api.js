import { fetchAppointmentsFromApi } from './appointment.mapper.js';

export class AgendaApi {
  async getAll() {
    const data = await fetchAppointmentsFromApi();
    return { data };
  }

  async create() {
    throw new Error('Use AppointmentService.createAppointment and fetchCitas instead.');
  }

  update(id, data) {
    return Promise.resolve({ data: { ...data, id } });
  }

  delete(id) {
    return Promise.resolve({ data: { id } });
  }
}
