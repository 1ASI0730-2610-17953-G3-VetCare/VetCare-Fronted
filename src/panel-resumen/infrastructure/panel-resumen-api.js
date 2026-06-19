import { BaseApi } from '@/shared/infrastructure/base-api.js';
import {
  fetchAppointmentsFromApi,
  isUpcomingThisWeekCita,
  sortCitasByDateTime
} from '@/agenda-veterinaria/infrastructure/appointment.mapper.js';
import { getExpiredVaccines } from '@/gestion-clinica/infrastructure/vaccine.utils.js';
import { getCriticalTasksToday } from '@/gestion-clinica/infrastructure/hospitalization-task.utils.js';

function mapStatusKey(status) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized.includes('confirm')) return 'scheduled';
  if (normalized.includes('pend')) return 'waiting';
  return 'scheduled';
}

function mapStatusClass(statusKey) {
  if (statusKey === 'waiting') return 'warning';
  if (statusKey === 'attending') return 'success';
  return 'primary';
}

function mapAppointmentsForDashboard(citas) {
  return citas.map((cita) => {
    const statusKey = mapStatusKey(cita.status);
    const type = cita.type ?? 'Cita';

    return {
      id: cita.id,
      petName: `${cita.patientName} — ${type}`,
      type,
      date: cita.date,
      statusKey,
      time: cita.timeStart || '—',
      img: cita.image,
      statusClass: mapStatusClass(statusKey)
    };
  });
}

export const panelResumenApi = {
  getKpis: async () => {
    const summary = (await BaseApi.get('/dashboard/summary')).data;
    return [
      {
        id: 1,
        titleKey: 'appointmentsToday',
        value: summary.todaysAppointments ?? 0,
        icon: 'pi-calendar',
        colorClass: 'primary',
        trend: '—',
        isPositive: true
      },
      {
        id: 2,
        titleKey: 'patientsAttended',
        value: summary.totalPatients ?? 0,
        icon: 'pi-heart',
        colorClass: 'success',
        trend: '—',
        isPositive: true
      }
    ];
  },

  getCitas: async () => {
    const appointments = await fetchAppointmentsFromApi();
    const filtered = sortCitasByDateTime(
      appointments.filter(isUpcomingThisWeekCita)
    );

    return mapAppointmentsForDashboard(filtered);
  },

  getAlertas: async () => {
    return getExpiredVaccines().map((vaccine) => ({
      id: vaccine.id,
      patientName: vaccine.patientName,
      vaccineName: vaccine.vaccineName,
      species: vaccine.species,
      nextDose: vaccine.nextDose,
      type: 'danger',
      icon: 'pi-shield'
    }));
  },
  getActividad: async () => {
    return getCriticalTasksToday().map((task) => ({
      id: task.id,
      patientName: task.title.split(' - ')[0]?.trim() ?? task.title,
      title: task.title,
      description: task.description,
      time: task.time,
      type: 'danger',
      icon: 'pi-clipboard'
    }));
  }
};
