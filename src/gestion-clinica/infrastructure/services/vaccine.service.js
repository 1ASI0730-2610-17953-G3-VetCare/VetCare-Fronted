import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { vaccinesState } from '../vaccine.utils.js';
import { mapVaccineFromApi, mapVaccinesFromApi } from '../vaccine.mapper.js';

export class VaccineService {
  async fetchAll() {
    const response = await BaseApi.get('/vaccine-records');
    const mapped = mapVaccinesFromApi(response.data);
    vaccinesState.value = mapped;
    return mapped;
  }

  async createVaccineRecord({
    patientId,
    vaccineName,
    disease,
    lastApplication,
    nextDose,
    productId = null
  }) {
    const payload = {
      patientId: Number(patientId),
      vaccineName,
      disease: disease || '-',
      lastApplication: `${lastApplication}T00:00:00Z`,
      nextDose: nextDose ? `${nextDose}T00:00:00Z` : null,
      productId: productId ? Number(productId) : null
    };

    const response = await BaseApi.post('/vaccine-records', payload);
    const created = mapVaccineFromApi(response.data);
    vaccinesState.value = [created, ...vaccinesState.value.filter((v) => v.id !== created.id)];
    return created;
  }

  async applyVaccine(id, { lastApplication, nextDose }) {
    const response = await BaseApi.patch(`/vaccine-records/${id}/apply`, {
      lastApplication: `${lastApplication}T00:00:00Z`,
      nextDose: `${nextDose}T00:00:00Z`
    });
    const updated = mapVaccineFromApi(response.data);
    vaccinesState.value = vaccinesState.value.map((v) => (v.id === updated.id ? updated : v));
    return updated;
  }
}

export async function loadVaccinesFromApi() {
  const service = new VaccineService();
  return service.fetchAll();
}
