import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { pendingTasksState } from '../hospitalization-task.utils.js';
import { mapOverviewFromApi, mapTaskFromApi } from '../hospitalization.mapper.js';

export class HospitalizationService {
  async fetchOverview() {
    const response = await BaseApi.get('/hospitalizations/overview');
    return mapOverviewFromApi(response.data);
  }

  async admitPatient({ patientId, status, diagnosis, admissionDate, treatments }) {
    const response = await BaseApi.post('/hospitalizations', {
      patientId: Number(patientId),
      status,
      diagnosis,
      admissionDate: admissionDate ? `${admissionDate}T00:00:00Z` : null,
      treatments: treatments ?? []
    });
    return response.data;
  }

  async updateAdmission(id, { status, diagnosis, treatments }) {
    const response = await BaseApi.put(`/hospitalizations/${id}`, {
      status,
      diagnosis,
      treatments: treatments ?? []
    });
    return response.data;
  }

  async dischargePatient(id) {
    await BaseApi.patch(`/hospitalizations/${id}/discharge`);
  }

  async createTask({ patientId, status, title, description, date, time }) {
    const response = await BaseApi.post('/hospitalizations/tasks', {
      patientId: Number(patientId),
      status,
      title,
      description,
      taskDate: `${date}T00:00:00Z`,
      taskTime: time
    });
    return mapTaskFromApi(response.data);
  }

  async toggleTaskComplete(id) {
    const response = await BaseApi.patch(`/hospitalizations/tasks/${id}/toggle-complete`);
    return mapTaskFromApi(response.data);
  }
}

export async function loadHospitalizationFromApi() {
  const service = new HospitalizationService();
  const overview = await service.fetchOverview();
  pendingTasksState.value = overview.tasks;
  return overview;
}
