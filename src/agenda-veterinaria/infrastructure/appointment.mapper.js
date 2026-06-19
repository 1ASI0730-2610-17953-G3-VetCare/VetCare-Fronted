import { BaseApi } from '@/shared/infrastructure/base-api.js';
import { Patient } from '@/gestion-clinica/domain/model/patient.entity.js';
import { resolvePatientImageFromPatient } from '@/gestion-clinica/infrastructure/patient-image.utils.js';

function formatTime(timeValue) {
  if (!timeValue) return '';

  const str = String(timeValue);
  const parts = str.split(':');
  if (parts.length >= 2) return `${parts[0]}:${parts[1]}`;
  return str.slice(0, 5);
}

function buildLookupById(items, idKey = 'id', labelKey = 'name') {
  return (items ?? []).reduce((map, item) => {
    const id = item[idKey] ?? item[idKey.charAt(0).toUpperCase() + idKey.slice(1)];
    if (id == null) return map;

    const label = item[labelKey]
      ?? item[labelKey.charAt(0).toUpperCase() + labelKey.slice(1)]
      ?? item.fullName
      ?? item.FullName
      ?? '';

    map[id] = label;
    return map;
  }, {});
}

export function mapApiStatus(status) {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized.includes('confirm')) return 'Confirmada';
  if (normalized.includes('complet')) return 'Completada';
  if (normalized.includes('cancel')) return 'Cancelada';
  return 'Pendiente';
}

function buildClientNameMap(clients) {
  return (clients ?? []).reduce((map, client) => {
    const id = client.id ?? client.Id;
    if (id == null) return map;
    map[id] = client.fullName ?? client.FullName ?? '';
    return map;
  }, {});
}

function buildPatientsById(rawPatients, clientsById) {
  return (rawPatients ?? []).reduce((map, raw) => {
    const patient = Patient.fromApi(raw, clientsById);
    map[patient.id] = patient;
    return map;
  }, {});
}

export function mapApiAppointmentToCita(appointment, patientsById, clientsById) {
  const patientId = appointment.patientId ?? appointment.PatientId;
  const clientId = appointment.clientId ?? appointment.ClientId;
  const patient = patientsById[patientId] ?? null;

  return {
    id: appointment.id ?? appointment.Id,
    patientId,
    patientName: patient?.name ?? `Paciente #${patientId}`,
    ownerName: clientsById[clientId] ?? '—',
    species: patient?.species ?? '',
    image: resolvePatientImageFromPatient(patient),
    date: String(appointment.date ?? appointment.Date ?? '').split('T')[0],
    timeStart: formatTime(appointment.timeSlot?.startTime ?? appointment.timeSlot?.StartTime),
    timeEnd: formatTime(appointment.timeSlot?.endTime ?? appointment.timeSlot?.EndTime),
    status: mapApiStatus(appointment.status ?? appointment.Status),
    type: appointment.type ?? appointment.Type ?? 'Cita'
  };
}

export async function fetchAppointmentsFromApi() {
  const [appointmentsResponse, patientsResponse, clientsResponse] = await Promise.all([
    BaseApi.get('/appointments'),
    BaseApi.get('/patients'),
    BaseApi.get('/clients')
  ]);

  const clientsById = buildClientNameMap(clientsResponse.data);
  const patientsById = buildPatientsById(patientsResponse.data, clientsById);

  return (appointmentsResponse.data ?? []).map((appointment) =>
    mapApiAppointmentToCita(appointment, patientsById, clientsById)
  );
}

export function getTodayIso() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekIsoBounds(referenceDate = new Date()) {
  const date = new Date(referenceDate);
  date.setHours(0, 0, 0, 0);

  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() + mondayOffset);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const toIso = (value) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const dayOfMonth = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayOfMonth}`;
  };

  return { start: toIso(weekStart), end: toIso(weekEnd) };
}

export function isUpcomingActiveCita(cita) {
  const status = String(cita.status ?? '').toLowerCase();
  if (status.includes('complet') || status.includes('cancel')) return false;

  const today = getTodayIso();
  return cita.date >= today;
}

export function isUpcomingThisWeekCita(cita) {
  if (!isUpcomingActiveCita(cita)) return false;

  const { start, end } = getWeekIsoBounds();
  return cita.date >= start && cita.date <= end;
}

export function sortCitasByDateTime(citas) {
  return [...citas].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.timeStart.localeCompare(b.timeStart);
  });
}
