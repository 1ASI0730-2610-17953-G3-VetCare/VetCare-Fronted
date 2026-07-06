import { BaseApi } from '@/shared/infrastructure/base-api';
import { PatientService } from './patient.service.js';

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export function formatHistoryDate(dateValue) {
  if (!dateValue) return '—';
  const iso = String(dateValue);
  const datePart = iso.split('T')[0];
  const date = new Date(`${datePart}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function isVacunacionType(type) {
  return String(type ?? '').toLowerCase().includes('vacun');
}

function mapPharmacologicalItems(items) {
  if (!Array.isArray(items) || items.length === 0) return [];
  return items.map((item) => {
    const name = item.productName ?? item.ProductName ?? 'Producto';
    const qty = item.quantity ?? item.Quantity ?? 1;
    return qty > 1 ? `${name} (x${qty})` : name;
  });
}

export function mapConsultationToTimeline(raw) {
  const id = raw.id ?? raw.Id;
  const type = raw.type ?? raw.Type ?? 'General';
  const doctorName = raw.doctorName ?? raw.DoctorName ?? '—';
  const date = formatHistoryDate(raw.date ?? raw.Date);
  const items = raw.items ?? raw.Items ?? [];

  if (isVacunacionType(type)) {
    const vaccines = mapPharmacologicalItems(items).map((name) => ({ name, lot: '—' }));
    if (vaccines.length === 0) {
      const plan = raw.plan ?? raw.Plan ?? '';
      vaccines.push({ name: plan || type, lot: '—' });
    }

    return {
      id: `vacuna-${id}`,
      type: 'vacuna',
      date,
      doctor: doctorName,
      details: {
        vaccines,
        notes: raw.subjective ?? raw.Subjective ?? raw.plan ?? raw.Plan ?? '',
        tags: [`HC-${String(id).padStart(3, '0')}`, type]
      }
    };
  }

  const temp = raw.temperature ?? raw.Temperature;
  const hr = raw.heartRate ?? raw.HeartRate;
  const weight = raw.weight ?? raw.Weight;
  const bodyCondition = raw.bodyCondition ?? raw.BodyCondition;

  return {
    id: `consulta-${id}`,
    type: 'consulta',
    date,
    doctor: doctorName,
    details: {
      subjective: raw.subjective ?? raw.Subjective ?? '—',
      objective: {
        vitals: {
          temperature: temp != null ? `${temp} °C` : '—',
          heartRate: hr != null ? `${hr} lpm` : '—',
          weight: weight != null ? `${weight} kg` : '—',
          bodyCondition: bodyCondition != null ? `${bodyCondition}/5` : '—'
        },
        exam: raw.objective ?? raw.Objective ?? '—'
      },
      evaluation: {
        presumptiveDiagnosis: raw.analysis ?? raw.Analysis ?? '—',
        differentialDiagnosis: '—',
        prognosis: '—'
      },
      plan: {
        pharmacological: mapPharmacologicalItems(items),
        dietary: [],
        followUp: raw.plan ?? raw.Plan ?? '—'
      },
      tags: [`HC-${String(id).padStart(3, '0')}`, type]
    }
  };
}

export function computeMedicalHistoryStats(consultations, hospitalizationCount = 0) {
  const vaccineCount = consultations.filter((c) =>
    isVacunacionType(c.type ?? c.Type)
  ).length;

  let lastVisit = '—';
  if (consultations.length > 0) {
    const sorted = [...consultations].sort((a, b) => {
      const da = new Date(a.date ?? a.Date);
      const db = new Date(b.date ?? b.Date);
      return db - da;
    });
    lastVisit = formatHistoryDate(sorted[0].date ?? sorted[0].Date);
  }

  return {
    totalConsultations: consultations.length,
    vaccinesApplied: vaccineCount,
    hospitalizations: hospitalizationCount,
    lastVisit
  };
}

function mapHospitalizationToTimeline(raw) {
  const id = raw.id ?? raw.Id;
  const date = formatHistoryDate(raw.admissionDate ?? raw.AdmissionDate);
  const treatments = raw.treatments ?? raw.Treatments ?? [];
  const status = raw.status ?? raw.Status ?? '—';
  const diagnosis = raw.diagnosis ?? raw.Diagnosis ?? '—';

  return {
    id: `hospitalizacion-${id}`,
    type: 'hospitalizacion',
    date,
    doctor: '—',
    details: {
      reason: diagnosis,
      procedure: treatments.length > 0 ? treatments.join(', ') : '—',
      evolution: status,
      postOpVitals: { temp: '—', hr: '—', spo2: '—', crt: '—' },
      tags: [`H-${String(id).padStart(3, '0')}`]
    }
  };
}

export class MedicalHistoryService {
  constructor() {
    this.patientService = new PatientService();
  }

  async getPatientById(patientId) {
    const patients = await this.patientService.getAllPatients();
    const id = Number(patientId);
    return patients.find((p) => p.id === id) ?? null;
  }

  async getAllPatients() {
    return this.patientService.getAllPatients();
  }

  async getMedicalHistory(patientId) {
    const [patient, consultationsRes, hospitalizationsRes] = await Promise.all([
      this.getPatientById(patientId),
      BaseApi.get(`/consultations/patient/${patientId}`),
      BaseApi.get(`/hospitalizations/patient/${patientId}`).catch(() => ({ data: [] }))
    ]);

    const rawConsultations = consultationsRes.data ?? [];
    const rawHospitalizations = hospitalizationsRes.data ?? [];

    const consultationItems = rawConsultations.map(mapConsultationToTimeline);
    const hospitalizationItems = rawHospitalizations.map(mapHospitalizationToTimeline);

    const allItems = [...consultationItems, ...hospitalizationItems].sort((a, b) => {
      const parseDate = (item) => {
        const parts = (item.date ?? '').split(' ');
        if (parts.length === 3) {
          const months = { 'Ene': 0, 'Feb': 1, 'Mar': 2, 'Abr': 3, 'May': 4, 'Jun': 5, 'Jul': 6, 'Ago': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dic': 11 };
          return new Date(Number(parts[2]), months[parts[1]] ?? 0, Number(parts[0]));
        }
        return new Date(item.date ?? 0);
      };
      return parseDate(b) - parseDate(a);
    });

    return {
      patient,
      timeline: allItems,
      stats: computeMedicalHistoryStats(rawConsultations, rawHospitalizations.length)
    };
  }
}
