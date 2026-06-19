import { BaseApi } from '../../../shared/infrastructure/base-api.js';
import { Patient } from '../../domain/model/patient.entity.js';
import { resolvePatientImageFromPatient } from '../../infrastructure/patient-image.utils.js';

export function normalizeConsultationStatus(status) {
  const value = String(status ?? '').trim().toLowerCase();
  const statusMap = {
    abierta: 'en_proceso',
    cerrada: 'completada',
    completada: 'completada',
    en_proceso: 'en_proceso',
    pendiente: 'pendiente',
    critico: 'critico',
    urgente: 'urgente',
    cancelada: 'cancelada'
  };
  return statusMap[value] ?? 'pendiente';
}

function parseDateParts(dateValue) {
  if (!dateValue) return { date: '—', time: '—' };
  const iso = String(dateValue);
  const [datePart, timePart] = iso.split('T');
  return {
    date: datePart ?? iso,
    time: timePart ? timePart.substring(0, 5) : '—'
  };
}

function buildClientsById(clients) {
  return clients.reduce((map, client) => {
    map[client.id] = {
      id: client.id,
      fullName: client.fullName ?? client.FullName ?? '',
      phone: client.phone ?? client.Phone ?? '—'
    };
    return map;
  }, {});
}

export function mapConsultation(consultation, patientsById, clientsById) {
  const patient = patientsById[consultation.patientId] ?? null;
  const client = patient?.ownerId ? clientsById[patient.ownerId] : null;
  const statusKey = normalizeConsultationStatus(consultation.status);
  const { date, time } = parseDateParts(consultation.date);

  return {
    id: `#C-${consultation.id}`,
    originalId: consultation.id,
    patientId: consultation.patientId,
    patient: {
      name: patient?.name ?? `Paciente #${consultation.patientId}`,
      breed: patient?.species ?? '—',
      image: patient ? resolvePatientImageFromPatient(patient) : null,
      type: 'dog'
    },
    client: {
      name: client?.fullName ?? patient?.owner ?? '—',
      phone: client?.phone ?? '—'
    },
    type: consultation.type,
    diagnosis: consultation.analysis || consultation.subjective || '—',
    date,
    time,
    status: statusKey,
    rawStatus: consultation.status,
    notes: consultation.plan ?? '',
    vitals: {
      temp: consultation.temperature,
      hr: consultation.heartRate,
      weight: consultation.weight,
      condition: consultation.bodyCondition
    }
  };
}

export class ConsultationService {
  async loadLookups() {
    const [patientsRes, clientsRes] = await Promise.all([
      BaseApi.get('/patients'),
      BaseApi.get('/clients')
    ]);

    const clientsById = buildClientsById(clientsRes.data);
    const ownerNamesById = Object.fromEntries(
      Object.entries(clientsById).map(([id, client]) => [id, client.fullName])
    );

    const patientsById = {};
    for (const raw of patientsRes.data) {
      const patient = Patient.fromApi(raw, ownerNamesById);
      patientsById[patient.id] = patient;
    }

    return { patientsById, clientsById, patients: Object.values(patientsById) };
  }

  async getAllConsultations() {
    try {
      const [consultationsRes, lookups] = await Promise.all([
        BaseApi.get('/consultations'),
        this.loadLookups()
      ]);

      return consultationsRes.data.map((consultation) =>
        mapConsultation(consultation, lookups.patientsById, lookups.clientsById)
      );
    } catch (error) {
      console.error('Error fetching consultations:', error);
      throw error;
    }
  }

  async getConsultationsByPatientId(patientId) {
    try {
      const [response, lookups] = await Promise.all([
        BaseApi.get(`/consultations/patient/${patientId}`),
        this.loadLookups()
      ]);

      return response.data.map((consultation) =>
        mapConsultation(consultation, lookups.patientsById, lookups.clientsById)
      );
    } catch (error) {
      console.error(`Error fetching consultations for patient ${patientId}:`, error);
      throw error;
    }
  }

  async getConsultationById(id) {
    try {
      const [response, lookups] = await Promise.all([
        BaseApi.get(`/consultations/${id}`),
        this.loadLookups()
      ]);

      return mapConsultation(response.data, lookups.patientsById, lookups.clientsById);
    } catch (error) {
      console.error(`Error fetching consultation ${id}:`, error);
      throw error;
    }
  }

  async createConsultation(data) {
    try {
      const response = await BaseApi.post('/consultations', data);
      const lookups = await this.loadLookups();
      return mapConsultation(response.data, lookups.patientsById, lookups.clientsById);
    } catch (error) {
      console.error('Error creating consultation:', error);
      throw error;
    }
  }

  async completeConsultation(id) {
    try {
      const response = await BaseApi.put(`/consultations/${id}/complete`);
      const lookups = await this.loadLookups();
      return mapConsultation(response.data, lookups.patientsById, lookups.clientsById);
    } catch (error) {
      console.error(`Error completing consultation ${id}:`, error);
      throw error;
    }
  }
}
