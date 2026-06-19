import { formatDisplayDate } from './vaccine.utils.js';

function toIsoDatePart(value) {
  if (!value) return null;
  return String(value).split('T')[0];
}

export function mapVaccineFromApi(record) {
  const lastIso = toIsoDatePart(record.lastApplication ?? record.LastApplication);
  const nextIso = toIsoDatePart(record.nextDose ?? record.NextDose);

  return {
    id: record.id ?? record.Id,
    patientId: record.patientId ?? record.PatientId,
    patientName: record.patientName ?? record.PatientName ?? '—',
    species: record.species ?? record.Species ?? '—',
    vaccineName: record.vaccineName ?? record.VaccineName ?? '',
    disease: record.disease ?? record.Disease ?? '-',
    lastApplication: lastIso ? formatDisplayDate(lastIso) : '-',
    nextDose: nextIso ? formatDisplayDate(nextIso) : '-',
    lastApplicationIso: lastIso,
    nextDoseIso: nextIso,
    productId: record.productId ?? record.ProductId ?? null
  };
}

export function mapVaccinesFromApi(records) {
  return (records ?? []).map(mapVaccineFromApi);
}
