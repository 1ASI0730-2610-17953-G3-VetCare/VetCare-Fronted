import { BaseApi } from '@/shared/infrastructure/base-api.js';

export class AgendaApi {
  constructor() {
    this.endpoint = '/appointments'; 
  }

  getAll() {
    return Promise.resolve({
      data: [
        { id: '1', patientName: 'Firulais', ownerName: 'Juan Perez', date: '2026-04-20', timeStart: '10:00', timeEnd: '11:00', status: 'Confirmada', type: 'Consulta General' },
        { id: '2', patientName: 'Mishi', ownerName: 'Maria Gomez', date: '2026-04-20', timeStart: '11:30', timeEnd: '12:30', status: 'Pendiente', type: 'Vacunación' },
        { id: '3', patientName: 'Max', ownerName: 'Carlos Ruiz', date: '2026-04-22', timeStart: '14:00', timeEnd: '15:00', status: 'Completada', type: 'Control' },
      ]
    });
  }

  create(data) {
    return Promise.resolve({ data: { ...data, id: String(Date.now()) } });
  }

  update(id, data) {
    return Promise.resolve({ data: { ...data, id } });
  }

  delete(id) {
    return Promise.resolve({ data: { id } });
  }
}
