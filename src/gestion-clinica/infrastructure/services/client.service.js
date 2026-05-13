import { Client } from '../../domain/model/client.entity.js';
import { API_BASE_URL } from '../../../shared/infrastructure/api-base-url.js';

const API_URL = API_BASE_URL;

export class ClientService {
  async getAllClients() {
    try {
      const response = await fetch(`${API_URL}/clientes`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      return data.map(item => new Client({
        id: item.id,
        code: item.code || `#C-${String(item.id).padStart(3, '0')}`,
        fullName: item.nombre || item.fullName,
        documentId: item.dni || item.documentId,
        phone: item.telefono || item.phone,
        email: item.email,
        address: item.direccion || item.address,
        status: item.status || 'Activo',
        petsCount: item.petsCount || Math.floor(Math.random() * 3) + 1,
        lastVisitAt: item.lastVisitAt || '2026-04-28'
      }));
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  }

  async createClient(clientData) {
    try {
      const payload = {
        nombre: clientData.fullName,
        dni: clientData.documentId,
        telefono: clientData.phone,
        email: clientData.email,
        direccion: clientData.address || '',
        status: clientData.status || 'Activo'
      };

      const response = await fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      return new Client({
        id: data.id,
        code: `#C-${String(data.id).padStart(3, '0')}`,
        fullName: data.nombre,
        documentId: data.dni,
        phone: data.telefono,
        email: data.email,
        address: data.direccion,
        status: data.status || 'Activo',
        petsCount: 0,
        lastVisitAt: null
      });
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  }
}
