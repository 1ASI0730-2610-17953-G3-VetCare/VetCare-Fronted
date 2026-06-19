import { BaseApi } from '@/shared/infrastructure/base-api';
import { Patient } from '../../domain/model/patient.entity';

function buildClientsById(clients) {
  return clients.reduce((map, client) => {
    map[client.id] = client.fullName ?? client.FullName ?? '';
    return map;
  }, {});
}

export class PatientService {
  async getClientsById() {
    const response = await BaseApi.get('/clients');
    return buildClientsById(response.data);
  }

  async getAllPatients() {
    try {
      const [patientsResponse, clientsById] = await Promise.all([
        BaseApi.get('/patients'),
        this.getClientsById()
      ]);

      return patientsResponse.data.map((patient) =>
        Patient.fromApi(patient, clientsById)
      );
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  async createPatient({ name, species, age, weight, ownerId }) {
    try {
      const payload = {
        name,
        species,
        age: Number(age),
        weight: Number(weight),
        ownerId: Number(ownerId)
      };

      const response = await BaseApi.post('/patients', payload);
      const clientsById = await this.getClientsById();
      return Patient.fromApi(response.data, clientsById);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  async updatePatient(id, { age, weight }) {
    try {
      const response = await BaseApi.patch(`/patients/${id}`, {
        age: Number(age),
        weight: Number(weight)
      });
      const clientsById = await this.getClientsById();
      return Patient.fromApi(response.data, clientsById);
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  async deletePatient(id) {
    try {
      await BaseApi.delete(`/patients/${id}`);
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }
}
