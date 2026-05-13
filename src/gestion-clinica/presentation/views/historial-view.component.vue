<script setup>
import { ref, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();

const timeline = ref([]);
const stats = ref({});
const loading = ref(true);
const patient = ref(null);

const handlePrint = () => {
  window.print();
};

const handleNewConsultation = () => {
  router.push({ path: '/gestion-clinica/consultas', query: { new: 'true' } });
};

const handleChangePatient = () => {
  router.push({ path: '/gestion-clinica/pacientes' });
};

const getTagLabel = (tag) => {
  const key = `clinicManagement.medicalHistory.timeline.tags.${tag}`;
  return te(key) ? t(key) : tag;
};

const loadPatientHistory = async (patientId) => {
  loading.value = true;
  try {
    const [patientRes, timelineRes, statsRes] = await Promise.all([
      fetch(`http://localhost:3000/pacientes/${patientId}`),
      fetch(`http://localhost:3000/historial_clinico?patientId=${patientId}`),
      fetch('http://localhost:3000/historial_stats')
    ]);
    
    if (patientRes.ok) {
      patient.value = await patientRes.json();
    } else {
      patient.value = {
        name: 'Paciente Desconocido',
        species: 'Desconocida',
        owner: 'Desconocido',
        age: '-',
        image: 'https://placedog.net/150/150?id=1'
      };
    }
    
    timeline.value = await timelineRes.json();
    stats.value = await statsRes.json();
  } catch (error) {
    console.error('Error fetching historial data:', error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  const patientId = route.query.patientId || 1;
  loadPatientHistory(patientId);
});

watch(() => route.query.patientId, (newId) => {
  if (newId) {
    loadPatientHistory(newId);
  }
});
</script>

<template>
  <div class="historial-view">
    
    <div class="patient-profile-header" v-if="patient">
      <div class="left-group">
        <div class="pet-avatar">
          <img :src="patient.image" :alt="patient.name" class="pet-image" />
        </div>
        <div class="info-block">
          <h3 class="pet-name">{{ patient.name }}</h3>
          <span class="pet-meta">{{ patient.species }} • {{ patient.age }}</span>
          <div class="owner-line">
            <span class="owner-label">{{ t('clinicManagement.medicalHistory.header.owner') }}</span>
            <span class="owner-value">{{ patient.owner }}</span>
          </div>
        </div>
      </div>
      
      <div class="actions-group">
        <button class="btn-secondary" @click="handleChangePatient">
          <i class="pi pi-users"></i>
          {{ t('clinicManagement.medicalHistory.header.changePatient') }}
        </button>
        <button class="btn-secondary" @click="handlePrint">
          <i class="pi pi-print"></i>
          {{ t('clinicManagement.medicalHistory.header.print') }}
        </button>
        <button class="btn-primary" @click="handleNewConsultation">
          <i class="pi pi-plus"></i>
          {{ t('clinicManagement.medicalHistory.header.newConsultation') }}
        </button>
      </div>
    </div>

    
    <div class="stats-cards-row" v-if="!loading">
      
      <div class="stats-card">
        <div class="card-header-row">
          <span class="card-label">{{ t('clinicManagement.medicalHistory.stats.totalConsultations') }}</span>
          <i class="pi pi-briefcase card-icon" style="color: #0ea5e9;"></i>
        </div>
        <div class="card-value-row">
          <span class="card-value-numeric">{{ stats.totalConsultations || 0 }}</span>
        </div>
      </div>

      
      <div class="stats-card">
        <div class="card-header-row">
          <span class="card-label">{{ t('clinicManagement.medicalHistory.stats.vaccinesApplied') }}</span>
          <i class="pi pi-shield card-icon" style="color: #22c55e;"></i>
        </div>
        <div class="card-value-row">
          <span class="card-value-numeric">{{ stats.vaccinesApplied || 0 }}</span>
        </div>
      </div>

      
      <div class="stats-card">
        <div class="card-header-row">
          <span class="card-label">{{ t('clinicManagement.medicalHistory.stats.hospitalizations') }}</span>
          <i class="pi pi-building card-icon" style="color: #ef4444;"></i>
        </div>
        <div class="card-value-row">
          <span class="card-value-numeric">{{ stats.hospitalizations || 0 }}</span>
        </div>
      </div>

      
      <div class="stats-card card-date">
        <div class="card-header-row">
          <span class="card-label">{{ t('clinicManagement.medicalHistory.stats.lastVisit') }}</span>
          <i class="pi pi-calendar card-icon" style="color: #a855f7;"></i>
        </div>
        <div class="card-value-row">
          <span class="card-value-date">{{ stats.lastVisit || '--' }}</span>
        </div>
      </div>
    </div>

    
    <div v-if="loading" class="loading-state" style="padding: 40px; text-align: center; color: #6b7280;">
      <i class="pi pi-spin pi-spinner" style="font-size: 32px; margin-bottom: 12px; color: #0ea5e9;"></i>
      <p>Cargando historial clínico...</p>
    </div>

    
    <div class="medical-records-timeline" v-else>
      <div v-if="timeline.length === 0" class="empty-timeline" style="padding: 40px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 8px; border: 1px dashed #d1d5db;">
        <i class="pi pi-folder-open" style="font-size: 32px; margin-bottom: 12px; color: #9ca3af;"></i>
        <p>{{ t('clinicManagement.medicalHistory.emptyTimeline', 'No hay registros en el historial clínico de este paciente.') }}</p>
      </div>
      <template v-for="record in timeline" :key="record.id">
        
        <div v-if="record.type === 'consulta'" class="medical-record-card variant-consulta">
          <div class="timeline-icon-container bg-blue-tint">
            <i class="pi pi-briefcase icon-blue"></i>
          </div>
          <div class="record-outer-container border-blue">
            <div class="record-header bg-blue-solid">
              <h3 class="record-title">{{ t('clinicManagement.medicalHistory.timeline.generalConsultation') }}</h3>
              <div class="record-meta">
                <span class="meta-item"><i class="pi pi-calendar"></i> {{ record.date }}</span>
                <span class="meta-item"><i class="pi pi-user"></i> {{ record.doctor }}</span>
              </div>
            </div>
            <div class="record-body">
              
              <div class="soap-section border-blue-light">
                <div class="soap-header">
                  <div class="soap-icon-box bg-blue-tint">
                    <i class="pi pi-comment icon-blue"></i>
                  </div>
                  <h4 class="soap-title text-blue-dark">{{ t('clinicManagement.medicalHistory.timeline.subjective') }}</h4>
                </div>
                <p class="soap-text">{{ record.details.subjective }}</p>
              </div>

              
              <div class="soap-section border-blue-light">
                <div class="soap-header">
                  <div class="soap-icon-box bg-green-tint">
                    <i class="pi pi-eye icon-green"></i>
                  </div>
                  <h4 class="soap-title text-green-dark">{{ t('clinicManagement.medicalHistory.timeline.objective') }}</h4>
                </div>
                <div class="vitals-grid">
                  <div class="vital-chip">
                    <span class="vital-label">{{ t('clinicManagement.medicalHistory.timeline.vitals.temperature') }}</span>
                    <span class="vital-value">{{ record.details.objective.vitals.temperature }}</span>
                  </div>
                  <div class="vital-chip">
                    <span class="vital-label">{{ t('clinicManagement.medicalHistory.timeline.vitals.heartRate') }}</span>
                    <span class="vital-value">{{ record.details.objective.vitals.heartRate }}</span>
                  </div>
                  <div class="vital-chip">
                    <span class="vital-label">{{ t('clinicManagement.medicalHistory.timeline.vitals.weight') }}</span>
                    <span class="vital-value">{{ record.details.objective.vitals.weight }}</span>
                  </div>
                  <div class="vital-chip">
                    <span class="vital-label">{{ t('clinicManagement.medicalHistory.timeline.vitals.bodyCondition') }}</span>
                    <span class="vital-value">{{ record.details.objective.vitals.bodyCondition }}</span>
                  </div>
                </div>
                <p class="soap-text mt-3">{{ record.details.objective.exam }}</p>
              </div>

              
              <div class="eval-section border-orange">
                <div class="eval-header">
                  <div class="eval-icon-box bg-orange-tint">
                    <i class="pi pi-clipboard icon-orange"></i>
                  </div>
                  <h4 class="eval-title">{{ t('clinicManagement.medicalHistory.timeline.evaluation') }}</h4>
                </div>
                <div class="eval-list">
                  <div class="eval-item">
                    <i class="pi pi-check-circle icon-red-bullet"></i>
                    <span class="eval-label">{{ t('clinicManagement.medicalHistory.timeline.evalLabels.presumptiveDiagnosis') }}</span>
                    <span class="eval-value">{{ record.details.evaluation.presumptiveDiagnosis }}</span>
                  </div>
                  <div class="eval-item">
                    <i class="pi pi-check-circle icon-red-bullet"></i>
                    <span class="eval-label">{{ t('clinicManagement.medicalHistory.timeline.evalLabels.differentialDiagnosis') }}</span>
                    <span class="eval-value">{{ record.details.evaluation.differentialDiagnosis }}</span>
                  </div>
                  <div class="eval-item">
                    <i class="pi pi-check-circle icon-red-bullet"></i>
                    <span class="eval-label">{{ t('clinicManagement.medicalHistory.timeline.evalLabels.prognosis') }}</span>
                    <span class="eval-value">{{ record.details.evaluation.prognosis }}</span>
                  </div>
                </div>
              </div>

              
              <div class="plan-section border-purple">
                <div class="plan-header">
                  <div class="plan-icon-box bg-purple-tint">
                    <i class="pi pi-list icon-purple"></i>
                  </div>
                  <h4 class="plan-title">{{ t('clinicManagement.medicalHistory.timeline.plan') }}</h4>
                </div>
                <div class="plan-subsections">
                  <div class="plan-subsection">
                    <div class="plan-sub-header">
                      <span class="plan-sub-title">{{ t('clinicManagement.medicalHistory.timeline.planLabels.pharmacologicalTreatment') }}</span>
                      <i class="pi pi-box icon-purple-dark"></i>
                    </div>
                    <ul class="plan-list">
                      <li v-for="(item, idx) in record.details.plan.pharmacological" :key="idx">{{ item }}</li>
                    </ul>
                  </div>
                  <div class="plan-subsection">
                    <div class="plan-sub-header">
                      <span class="plan-sub-title">{{ t('clinicManagement.medicalHistory.timeline.planLabels.dietaryRecommendations') }}</span>
                      <i class="pi pi-apple icon-purple-dark"></i>
                    </div>
                    <ul class="plan-list">
                      <li v-for="(item, idx) in record.details.plan.dietary" :key="idx">{{ item }}</li>
                    </ul>
                  </div>
                  <div class="plan-subsection">
                    <div class="plan-sub-header">
                      <span class="plan-sub-title">{{ t('clinicManagement.medicalHistory.timeline.planLabels.followUp') }}</span>
                      <i class="pi pi-calendar-plus icon-purple-dark"></i>
                    </div>
                    <p class="plan-text">{{ record.details.plan.followUp }}</p>
                  </div>
                </div>
              </div>

              
              <div class="record-footer-tags">
                <span class="record-tag" v-for="(tag, idx) in record.details.tags" :key="idx">
                  {{ getTagLabel(tag) }} <i class="pi pi-tag" v-if="!tag.startsWith('HC-')"></i><i class="pi pi-file" v-else></i>
                </span>
              </div>
            </div>
          </div>
        </div>

        
        <div v-else-if="record.type === 'vacuna'" class="medical-record-card variant-vacuna">
          <div class="timeline-icon-container bg-green-tint">
            <i class="pi pi-shield icon-green"></i>
          </div>
          <div class="record-outer-container border-green">
            <div class="record-header bg-green-solid">
              <h3 class="record-title">{{ t('clinicManagement.medicalHistory.timeline.annualVaccination') }}</h3>
              <div class="record-meta">
                <span class="meta-item"><i class="pi pi-calendar"></i> {{ record.date }}</span>
                <span class="meta-item"><i class="pi pi-user"></i> {{ record.doctor }}</span>
              </div>
            </div>
            <div class="record-body">
              <div class="vaccine-section border-green-light">
                <div class="vaccine-header">
                  <div class="vaccine-icon-box bg-green-tint">
                    <i class="pi pi-check-circle icon-green"></i>
                  </div>
                  <h4 class="vaccine-title">{{ t('clinicManagement.medicalHistory.timeline.vaccinesApplied') }}</h4>
                </div>
                <div class="vaccine-list">
                  <div class="vaccine-row" v-for="(vac, idx) in record.details.vaccines" :key="idx">
                    <span class="vaccine-name">{{ vac.name }}</span>
                    <span class="vaccine-lot">{{ vac.lot }}</span>
                  </div>
                </div>
                <p class="vaccine-notes">{{ record.details.notes }}</p>
              </div>
              
              <div class="record-footer-tags">
                <span class="record-tag" v-for="(tag, idx) in record.details.tags" :key="idx">
                  {{ getTagLabel(tag) }} <i class="pi pi-tag"></i>
                </span>
              </div>
            </div>
          </div>
        </div>

        
        <div v-else-if="record.type === 'hospitalizacion'" class="medical-record-card variant-hospitalizacion">
          <div class="timeline-icon-container bg-red-tint">
            <i class="pi pi-chart-bar icon-red"></i>
          </div>
          <div class="record-outer-container border-red">
            <div class="record-header bg-red-solid">
              <h3 class="record-title">{{ t('clinicManagement.medicalHistory.timeline.hospitalizationSurgery') }}</h3>
              <div class="record-meta">
                <span class="meta-item"><i class="pi pi-calendar"></i> {{ record.date }}</span>
                <span class="meta-item"><i class="pi pi-user"></i> {{ record.doctor }}</span>
              </div>
            </div>
            <div class="record-body">
              <div class="hosp-summary-section">
                <h4 class="hosp-title">{{ t('clinicManagement.medicalHistory.timeline.hospitalizationSummary') }}</h4>
                <div class="hosp-fields">
                  <p class="hosp-field"><span class="hosp-label">{{ t('clinicManagement.medicalHistory.timeline.hospLabels.reason') }}</span> {{ record.details.reason }}</p>
                  <p class="hosp-field"><span class="hosp-label">{{ t('clinicManagement.medicalHistory.timeline.hospLabels.procedure') }}</span> {{ record.details.procedure }}</p>
                  <p class="hosp-field"><span class="hosp-label">{{ t('clinicManagement.medicalHistory.timeline.hospLabels.evolution') }}</span> {{ record.details.evolution }}</p>
                </div>
              </div>

              <div class="hosp-vitals-section">
                <h4 class="hosp-title">{{ t('clinicManagement.medicalHistory.timeline.postOpParameters') }}</h4>
                <div class="hosp-vitals-grid">
                  <div class="hosp-vital-chip">
                    <span class="hosp-vital-label">{{ t('clinicManagement.medicalHistory.timeline.postOpVitals.temp') }}</span>
                    <span class="hosp-vital-value">{{ record.details.postOpVitals.temp }}</span>
                  </div>
                  <div class="hosp-vital-chip">
                    <span class="hosp-vital-label">{{ t('clinicManagement.medicalHistory.timeline.postOpVitals.hr') }}</span>
                    <span class="hosp-vital-value">{{ record.details.postOpVitals.hr }}</span>
                  </div>
                  <div class="hosp-vital-chip">
                    <span class="hosp-vital-label">{{ t('clinicManagement.medicalHistory.timeline.postOpVitals.spo2') }}</span>
                    <span class="hosp-vital-value">{{ record.details.postOpVitals.spo2 }}</span>
                  </div>
                  <div class="hosp-vital-chip">
                    <span class="hosp-vital-label">{{ t('clinicManagement.medicalHistory.timeline.postOpVitals.crt') }}</span>
                    <span class="hosp-vital-value">{{ record.details.postOpVitals.crt }}</span>
                  </div>
                </div>
              </div>
              
              
              <div class="record-footer-tags">
                <span class="record-tag" v-for="(tag, idx) in record.details.tags" :key="idx">
                  {{ getTagLabel(tag) }} <i class="pi pi-tag"></i>
                </span>
              </div>
            </div>
          </div>
        </div>

      </template>

    </div>
  </div>
</template>

<style scoped>
.historial-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}


.patient-profile-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 126px;
  padding: 25px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0px 1px 3px rgba(0,0,0,0.08), 0px 1px 2px rgba(0,0,0,0.05);
  box-sizing: border-box;
}

.left-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.pet-avatar {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(45deg, #fb923c 0%, #ea580c 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  overflow: hidden;
}

.pet-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 232px;
}

.pet-name {
  font-family: 'Inter', sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: -0.5px;
  color: #111827;
  margin: 0;
  padding-top: 1px;
  padding-bottom: 2px;
}

.pet-meta {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: -0.5px;
  color: #6b7280;
  margin: 0;
  padding-top: 1px;
  padding-bottom: 2px;
}

.owner-line {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding-top: 1px;
  padding-bottom: 2px;
}

.owner-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  letter-spacing: -0.5px;
  color: #000000;
}

.owner-value {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  letter-spacing: -0.5px;
  color: #000000;
}

.actions-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.btn-primary {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 10px 16px 11px 16px;
  background-color: #0284c7;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.5px;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.btn-primary:hover {
  background-color: #0369a1;
}

.btn-primary i {
  font-size: 14px;
}

.btn-secondary {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 10px 17px 11px 17px;
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.5px;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.btn-secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

.btn-secondary i {
  font-size: 14px;
}


.stats-cards-row {
  display: flex;
  flex-direction: row;
  gap: 24px;
  width: 100%;
  height: 110px;
  background-color: transparent;
}

.stats-card {
  display: flex;
  flex-direction: column;
  padding: 21px;
  gap: 8px;
  width: 262px;
  height: 110px;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0px 1px 2px rgba(0,0,0,0.05);
  box-sizing: border-box;
  flex: 1;
}

.card-date {
  padding-bottom: 29px;
}

.card-header-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 24px;
}

.card-label {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  letter-spacing: -0.5px;
  color: #6b7280;
}

.card-icon {
  font-size: 18px;
}

.card-value-row {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.card-value-numeric {
  font-family: 'Inter', sans-serif;
  font-size: 30px;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: -0.5px;
  color: #111827;
}

.card-value-date {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 28px;
  letter-spacing: -0.5px;
  color: #111827;
}


.medical-records-timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  position: relative;
}

.medical-records-timeline::before {
  content: '';
  position: absolute;
  left: 31px; 
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e5e7eb;
  z-index: 1;
}

.medical-record-card {
  position: relative;
  padding-left: 80px; 
  width: 100%;
  box-sizing: border-box;
}

.timeline-icon-container {
  position: absolute;
  left: 0;
  top: 0;
  width: 64px;
  height: 64px;
  border-radius: 12px;
  border: 4px solid #ffffff;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
}

.record-outer-container {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.record-header {
  height: 60px;
  padding: 16px 24px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
}

.record-title {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.5px;
  margin: 0;
}

.record-meta {
  display: flex;
  flex-direction: row;
  gap: 16px;
}

.meta-item {
  font-size: 14px;
  font-weight: 400;
  color: #ffffff;
  display: flex;
  align-items: center;
  gap: 6px;
}

.record-body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: transparent;
}


.variant-consulta .record-outer-container { border: 2px solid #bae6fd; background: linear-gradient(45deg, #eff6ff 0%, #ffffff 100%); }
.variant-consulta .bg-blue-solid { background-color: #0284c7; }
.variant-consulta .bg-blue-tint { background-color: #dbeafe; }
.variant-consulta .icon-blue { color: #2563eb; font-size: 24px; }
.variant-consulta .border-blue { border-color: #bae6fd; }

.variant-vacuna .record-outer-container { border: 2px solid #bbf7d0; background: linear-gradient(45deg, #f0fdf4 0%, #ffffff 100%); }
.variant-vacuna .bg-green-solid { background-color: #16a34a; }
.variant-vacuna .bg-green-tint { background-color: #dcfce7; }
.variant-vacuna .icon-green { color: #16a34a; font-size: 24px; }
.variant-vacuna .border-green { border-color: #bbf7d0; }

.variant-hospitalizacion .record-outer-container { border: 2px solid #fecaca; background: linear-gradient(45deg, #fff1f2 0%, #ffffff 100%); }
.variant-hospitalizacion .bg-red-solid { background-color: #dc2626; }
.variant-hospitalizacion .bg-red-tint { background-color: #fee2e2; }
.variant-hospitalizacion .icon-red { color: #dc2626; font-size: 24px; }
.variant-hospitalizacion .border-red { border-color: #fecaca; }


.soap-section, .eval-section, .plan-section, .vaccine-section {
  background: #ffffff;
  border-radius: 8px;
  padding: 21px;
}

.border-blue-light { border: 1px solid #bfdbfe; }
.border-orange { border-left: 4px solid #fb923c; border-top: 1px solid #fed7aa; border-right: 1px solid #fed7aa; border-bottom: 1px solid #fed7aa; }
.border-purple { border: 1px solid #e9d5ff; background: #faf5ff; }
.border-green-light { border: 1px solid #bbf7d0; }

.soap-header, .eval-header, .plan-header, .vaccine-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.soap-icon-box, .eval-icon-box, .plan-icon-box, .vaccine-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.eval-icon-box { background: #fff7ed; width: 36px; height: 36px; }
.icon-orange { color: #ea580c; font-size: 18px; }
.plan-icon-box { background: #f3e8ff; width: 36px; height: 36px; }
.icon-purple { color: #9333ea; font-size: 18px; }

.soap-title, .eval-title, .plan-title, .vaccine-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}

.text-blue-dark { color: #1e40af; }
.text-green-dark { color: #15803d; }
.eval-title, .plan-title, .vaccine-title { color: #111827; }

.soap-text, .plan-text, .vaccine-notes {
  font-size: 16px;
  line-height: 26px;
  color: #374151;
  margin: 0;
}

.mt-3 { margin-top: 12px; }


.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.vital-chip {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vital-label {
  font-size: 11px;
  font-weight: 500;
  color: #16a34a;
}

.vital-value {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}


.eval-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.eval-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.icon-red-bullet {
  color: #ef4444;
  font-size: 16px;
  margin-top: 2px;
}

.eval-label {
  font-size: 13px;
  font-weight: 700;
  color: #111827;
}

.eval-value {
  font-size: 13px;
  font-weight: 400;
  color: #374151;
}


.plan-subsections {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.plan-subsection {
  background: #faf5ff;
  border-radius: 8px;
  padding: 0;
}

.plan-sub-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.plan-sub-title {
  font-size: 13px;
  font-weight: 700;
  color: #7c3aed;
}

.icon-purple-dark {
  color: #7c3aed;
  font-size: 14px;
}

.plan-list {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
  color: #374151;
}

.plan-list li {
  font-size: 13px;
  line-height: 20px;
  margin-bottom: 4px;
}

.plan-text {
  font-size: 13px;
}


.vaccine-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.vaccine-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}

.vaccine-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.vaccine-lot {
  font-size: 13px;
  font-weight: 500;
  color: #16a34a;
}


.hosp-summary-section, .hosp-vitals-section {
  background: #ffffff;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 16px;
}

.hosp-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.hosp-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hosp-field {
  font-size: 13px;
  color: #374151;
  margin: 0;
  line-height: 20px;
}

.hosp-label {
  font-weight: 700;
  color: #111827;
}

.hosp-vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.hosp-vital-chip {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hosp-vital-label {
  font-size: 11px;
  font-weight: 500;
  color: #ef4444;
}

.hosp-vital-value {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}


.record-footer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.record-tag {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 11px;
  color: #6b7280;
  display: flex;
  align-items: center;
  gap: 4px;
}

.record-tag i {
  font-size: 10px;
}

@media print {
  .actions-group {
    display: none !important;
  }
  .historial-view {
    gap: 16px;
  }
  .patient-profile-header {
    box-shadow: none;
    border: 2px solid #000;
  }
  .medical-record-card {
    break-inside: avoid;
  }
}
</style>
