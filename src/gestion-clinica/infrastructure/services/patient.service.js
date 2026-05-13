import axios from 'axios';
import { Patient } from '../../domain/model/patient.entity';
import { API_BASE_URL } from '../../../shared/infrastructure/api-base-url.js';

const http = axios.create({
  baseURL: API_BASE_URL
});

export class PatientService {
  async getAllPatients() {
    try {
      const response = await http.get('/pacientes');
      return response.data.map(patient => new Patient(patient));
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  async createPatient(patientData) {
    try {
      const response = await http.post('/pacientes', patientData);
      return new Patient(response.data);
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }
}
