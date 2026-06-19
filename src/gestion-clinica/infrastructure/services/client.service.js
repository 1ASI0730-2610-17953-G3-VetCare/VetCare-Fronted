import { BaseApi } from '@/shared/infrastructure/base-api';
import { Client } from '../../domain/model/client.entity.js';

function formatLastVisit(dateValue) {
  if (!dateValue) return null;
  const iso = String(dateValue);
  const datePart = iso.split('T')[0];
  const date = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function buildPetsCountByOwner(patients) {
  return patients.reduce((map, patient) => {
    const ownerId = patient.ownerId ?? patient.OwnerId;
    if (ownerId) {
      map[ownerId] = (map[ownerId] || 0) + 1;
    }
    return map;
  }, {});
}

export class ClientService {
  async getAllClients() {
    try {
      const [clientsResponse, patientsResponse] = await Promise.all([
        BaseApi.get('/clients'),
        BaseApi.get('/patients')
      ]);

      const petsCountByOwner = buildPetsCountByOwner(patientsResponse.data ?? []);

      return clientsResponse.data.map((item) => new Client({
        id: item.id,
        code: item.code || `#C-${String(item.id).padStart(3, '0')}`,
        fullName: item.fullName ?? item.FullName ?? '',
        documentId: item.documentId ?? item.DocumentId ?? '',
        phone: item.phone ?? item.Phone ?? '',
        email: item.email ?? item.Email ?? '',
        address: item.address ?? item.Address ?? '',
        status: item.status ?? item.Status ?? 'Activo',
        petsCount: petsCountByOwner[item.id] ?? 0,
        lastVisitAt: formatLastVisit(item.lastVisitAt ?? item.LastVisitAt)
      }));
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  async createClient(clientData) {
    try {
      const payload = {
        fullName: clientData.fullName,
        documentId: clientData.documentId,
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address || ''
      };

      const response = await BaseApi.post('/clients', payload);
      const data = response.data;
      return new Client({
        id: data.id,
        code: data.code || `#C-${String(data.id).padStart(3, '0')}`,
        fullName: data.fullName ?? data.FullName ?? '',
        documentId: data.documentId ?? data.DocumentId ?? '',
        phone: data.phone ?? data.Phone ?? '',
        email: data.email ?? data.Email ?? '',
        address: data.address ?? data.Address ?? '',
        status: data.status ?? data.Status ?? 'Activo',
        petsCount: 0,
        lastVisitAt: null
      });
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }
}
