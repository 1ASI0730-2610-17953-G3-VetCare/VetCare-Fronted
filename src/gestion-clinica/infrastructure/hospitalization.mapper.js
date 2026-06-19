const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function toIsoDatePart(value) {
  if (!value) return null;
  const raw = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const datePart = raw.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return datePart;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatAdmissionDateLabel(iso) {
  if (!iso) return { formatted: '—', relative: '' };
  const date = new Date(`${iso}T00:00:00`);
  return {
    formatted: `${String(date.getDate()).padStart(2, '0')} ${MONTHS_ES[date.getMonth()]} ${date.getFullYear()}`,
    relative: ''
  };
}

function getPalette(species) {
  if (species === 'Gato') return 'cat_purple';
  if (species === 'Perro') return 'dog_blue';
  return 'species-default';
}

export function mapAdmissionFromApi(record) {
  const admissionIso = toIsoDatePart(record.admissionDate ?? record.AdmissionDate);

  return {
    id: record.id ?? record.Id,
    patientId: record.patientId ?? record.PatientId,
    patient: {
      name: record.patientName ?? record.PatientName ?? '—',
      species: record.species ?? record.Species ?? '—',
      breed: record.species ?? record.Species ?? '—',
      age: `${record.age ?? record.Age ?? 0} años`,
      palette: getPalette(record.species ?? record.Species)
    },
    owner: {
      name: record.ownerName ?? record.OwnerName ?? '—',
      phone: record.ownerPhone ?? record.OwnerPhone ?? '—'
    },
    status: record.status ?? record.Status,
    admissionDate: formatAdmissionDateLabel(admissionIso),
    diagnosis: record.diagnosis ?? record.Diagnosis ?? '',
    treatments: record.treatments ?? record.Treatments ?? []
  };
}

export function mapTaskFromApi(task) {
  const rawDate = task.taskDate ?? task.TaskDate;
  return {
    id: task.id ?? task.Id,
    patientId: task.patientId ?? task.PatientId,
    status: task.status ?? task.Status,
    title: task.title ?? task.Title,
    description: task.description ?? task.Description,
    date: toIsoDatePart(rawDate),
    time: task.taskTime ?? task.TaskTime ?? '09:00',
    completed: Boolean(task.completed ?? task.Completed)
  };
}

export function mapOverviewFromApi(data) {
  const admissions = data.admissions ?? data.Admissions ?? [];
  const tasks = data.tasks ?? data.Tasks ?? [];

  return {
    admissions: admissions.map(mapAdmissionFromApi),
    tasks: tasks.map(mapTaskFromApi)
  };
}
