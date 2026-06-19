<script setup>
import { ref, onActivated, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { MedicalHistoryService } from '../../infrastructure/services/medical-history.service.js';
import { usePatientStore } from '../../application/store/patient.store.js';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';
import { resolvePatientImageFromPatient } from '../../infrastructure/patient-image.utils.js';

const { t, te } = useI18n();
const route = useRoute();
const router = useRouter();
const medicalHistoryService = new MedicalHistoryService();
const patientStore = usePatientStore();
const { patients } = storeToRefs(patientStore);

const timeline = ref([]);
const stats = ref({});
const loading = ref(false);
const patient = ref(null);
const selectedPatientId = ref('');
const showPatientSelector = ref(false);
const loadError = ref(false);

const handlePrint = () => {
  window.print();
};

const handleNewConsultation = () => {
  const patientId = route.query.patientId;
  const query = { new: 'true' };
  if (patientId) query.patientId = patientId;
  router.push({ path: '/gestion-clinica/consultas', query });
};

const handleChangePatient = () => {
  router.push({ path: '/gestion-clinica/pacientes' });
};

const getTagLabel = (tag) => {
  const key = `clinicManagement.medicalHistory.timeline.tags.${tag}`;
  return te(key) ? t(key) : tag;
};

const getPatientImage = (patientData) => resolvePatientImageFromPatient(patientData);

const loadPatientsList = async () => {
  loading.value = true;
  try {
    await patientStore.fetchPatients();
    showPatientSelector.value = true;
  } catch (error) {
    console.error('Error fetching patients:', error);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

const loadPatientHistory = async (patientId) => {
  loading.value = true;
  loadError.value = false;
  showPatientSelector.value = false;
  patient.value = null;
  timeline.value = [];
  stats.value = {};
  try {
    const history = await medicalHistoryService.getMedicalHistory(patientId);
    patient.value = history.patient;
    timeline.value = history.timeline;
    stats.value = history.stats;

    if (!history.patient) {
      loadError.value = true;
    }
  } catch (error) {
    console.error('Error fetching historial data:', error);
    loadError.value = true;
    patient.value = null;
    timeline.value = [];
    stats.value = {};
  } finally {
    loading.value = false;
  }
};

const handleSelectPatient = () => {
  if (!selectedPatientId.value) return;
  router.push({ path: '/gestion-clinica/historial', query: { patientId: selectedPatientId.value } });
};

const activateView = () => {
  const patientId = route.query.patientId;
  if (patientId) {
    loadPatientHistory(patientId);
  } else {
    loadPatientsList();
  }
};

onActivated(() => {
  activateView();
});

watch(() => route.query.patientId, (newId) => {
  if (newId) {
    loadPatientHistory(newId);
  } else {
    patient.value = null;
    timeline.value = [];
    stats.value = {};
    loadPatientsList();
  }
});
</script>

<template>
  <div class="historial-view">

    <PageViewLoading
      v-if="loading"
      variant="historial"
      :message="t('clinicManagement.medicalHistory.loading')"
    />

    <div v-else-if="showPatientSelector" class="patient-selector-card">
      <div class="selector-atmosphere" aria-hidden="true"></div>
      <div class="selector-icon">
        <i class="pi pi-search"></i>
      </div>
      <div class="selector-copy">
        <h3 class="selector-title">{{ t('clinicManagement.medicalHistory.selectPatient.title') }}</h3>
        <p class="selector-description">{{ t('clinicManagement.medicalHistory.selectPatient.description') }}</p>
      </div>
      <div class="selector-controls">
        <div class="selector-field">
          <label class="selector-field-label" for="historial-patient-select">
            {{ t('clinicManagement.medicalHistory.selectPatient.placeholder') }}
          </label>
          <select
            id="historial-patient-select"
            v-model="selectedPatientId"
            class="selector-dropdown"
          >
            <option value="">{{ t('clinicManagement.medicalHistory.selectPatient.placeholder') }}</option>
            <option v-for="p in patients" :key="p.id" :value="p.id">
              {{ p.name }} — {{ p.species }} ({{ p.owner }})
            </option>
          </select>
        </div>
        <button class="btn-primary" :disabled="!selectedPatientId" @click="handleSelectPatient">
          <i class="pi pi-book"></i>
          {{ t('clinicManagement.medicalHistory.selectPatient.viewHistory') }}
        </button>
      </div>
      <button type="button" class="btn-link" @click="handleChangePatient">
        <i class="pi pi-list"></i>
        {{ t('clinicManagement.medicalHistory.selectPatient.browsePatients') }}
      </button>
    </div>

    <div v-else-if="loadError" class="error-state">
      <i class="pi pi-exclamation-triangle"></i>
      <p>{{ t('clinicManagement.medicalHistory.loadError') }}</p>
      <button class="btn-secondary" @click="handleChangePatient">
        {{ t('clinicManagement.medicalHistory.header.changePatient') }}
      </button>
    </div>
    
    <template v-else-if="patient">
    <div class="patient-header-card">
      <div class="patient-header-accent" aria-hidden="true"></div>
      <div class="patient-header-main">
        <div class="patient-avatar-wrap">
          <img :src="getPatientImage(patient)" :alt="patient.name" class="patient-avatar-img" />
        </div>
        <div class="patient-header-info">
          <h2 class="patient-header-name">{{ patient.name }}</h2>
          <p class="patient-header-meta">{{ patient.species }} · {{ patient.age }}</p>
          <div class="patient-owner-chip">
            <i class="pi pi-user" aria-hidden="true"></i>
            <span class="owner-chip-label">{{ t('clinicManagement.medicalHistory.header.owner') }}</span>
            <strong class="owner-chip-value">{{ patient.owner }}</strong>
          </div>
        </div>
      </div>
      <div class="patient-header-actions">
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

    
    <div class="status-cards-row status-cards-row-4">
      <div class="status-card card-info">
        <div class="card-header-row">
          <div class="icon-circle icon-info">
            <i class="pi pi-briefcase" aria-hidden="true"></i>
          </div>
        </div>
        <p class="count-number text-info">{{ stats.totalConsultations || 0 }}</p>
        <p class="card-title title-info">{{ t('clinicManagement.medicalHistory.stats.totalConsultations') }}</p>
      </div>

      <div class="status-card card-success">
        <div class="card-header-row">
          <div class="icon-circle icon-success">
            <i class="pi pi-shield" aria-hidden="true"></i>
          </div>
        </div>
        <p class="count-number text-success">{{ stats.vaccinesApplied || 0 }}</p>
        <p class="card-title title-success">{{ t('clinicManagement.medicalHistory.stats.vaccinesApplied') }}</p>
      </div>

      <div class="status-card card-danger">
        <div class="card-header-row">
          <div class="icon-circle icon-danger">
            <i class="pi pi-building" aria-hidden="true"></i>
          </div>
        </div>
        <p class="count-number text-danger">{{ stats.hospitalizations || 0 }}</p>
        <p class="card-title title-danger">{{ t('clinicManagement.medicalHistory.stats.hospitalizations') }}</p>
      </div>

      <div class="status-card card-primary card-date-stat">
        <div class="card-header-row">
          <div class="icon-circle icon-primary">
            <i class="pi pi-calendar" aria-hidden="true"></i>
          </div>
        </div>
        <p class="count-number count-date text-primary">{{ stats.lastVisit || '--' }}</p>
        <p class="card-title title-primary">{{ t('clinicManagement.medicalHistory.stats.lastVisit') }}</p>
      </div>
    </div>

    <div class="historial-card">
      <div class="card-header">
        <div class="card-header-left">
          <h2 class="section-title">{{ t('clinicManagement.medicalHistory.timelineTitle') }}</h2>
          <span class="results-chip">{{ t('clinicManagement.medicalHistory.timelineCount', { count: timeline.length }) }}</span>
        </div>
      </div>
      <div class="medical-records-timeline">
      <div v-if="timeline.length === 0" class="empty-timeline">
        <i class="pi pi-folder-open empty-timeline-icon" aria-hidden="true"></i>
        <p>{{ t('clinicManagement.medicalHistory.emptyTimeline') }}</p>
      </div>
      <template v-for="record in timeline" :key="record.id">
        
        <div v-if="record.type === 'consulta'" class="medical-record-card variant-consulta">
          <div class="timeline-icon-container bg-blue-tint">
            <i class="pi pi-briefcase icon-blue"></i>
          </div>
          <div class="record-outer-container border-blue">
            <div class="record-header">
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
            <div class="record-header">
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
            <div class="record-header">
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
  </div>
</template>

<style scoped>
.historial-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.patient-selector-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  max-width: 560px;
  margin: 48px auto 0;
  padding: 40px 32px 36px;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
  text-align: center;
  overflow: hidden;
}

.selector-atmosphere {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 88% 12%,
      color-mix(in srgb, var(--color-status-success-indicator) 10%, transparent) 0%,
      transparent 42%
    ),
    radial-gradient(
      circle at 12% 88%,
      color-mix(in srgb, var(--color-primary-main) 8%, transparent) 0%,
      transparent 40%
    );
}

.selector-icon {
  position: relative;
  z-index: 1;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-full);
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.selector-icon i {
  font-size: 28px;
  color: var(--color-primary-main);
}

.selector-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-title {
  font-size: var(--font-title-size);
  font-weight: var(--font-title-weight);
  color: var(--color-text-primary);
  margin: 0;
}

.selector-description {
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 400px;
}

.selector-controls {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 420px;
}

.selector-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.selector-field-label {
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-text-secondary);
  letter-spacing: 0.02em;
}

.selector-dropdown {
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.selector-dropdown:hover {
  border-color: color-mix(in srgb, var(--color-primary-main) 30%, var(--color-border-light));
}

.selector-dropdown:focus {
  outline: none;
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 18%, transparent);
}

.btn-link {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--color-primary-main);
  font-size: var(--font-body-main-size);
  font-weight: var(--font-body-main-weight);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.btn-link:hover {
  background: color-mix(in srgb, var(--color-primary-main) 8%, transparent);
  text-decoration: none;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 32px;
  background: var(--color-status-danger-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 26%, transparent);
  border-radius: var(--radius-large);
  text-align: center;
  color: var(--color-status-danger-text);
}

.error-state i {
  font-size: 32px;
  color: var(--color-status-danger-indicator);
}

.patient-header-card {
  position: relative;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  padding: 22px 24px;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
  box-sizing: border-box;
  overflow: hidden;
}

.patient-header-accent {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      circle at 100% 0%,
      color-mix(in srgb, var(--color-primary-main) 8%, transparent) 0%,
      transparent 48%
    ),
    radial-gradient(
      circle at 0% 100%,
      color-mix(in srgb, var(--color-status-success-indicator) 6%, transparent) 0%,
      transparent 42%
    );
}

.patient-header-main {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 18px;
  min-width: 0;
}

.patient-avatar-wrap {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-large);
  border: 2px solid color-mix(in srgb, var(--color-primary-main) 22%, transparent);
  background: var(--color-primary-subtle);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;
  overflow: hidden;
}

.patient-avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.patient-header-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.patient-header-name {
  font-size: var(--font-title-size);
  font-weight: var(--font-title-weight);
  line-height: 1.25;
  color: var(--color-text-primary);
  margin: 0;
}

.patient-header-meta {
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  margin: 0;
}

.patient-owner-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 5px 12px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-status-info-bg) 70%, var(--color-background-surface));
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 18%, transparent);
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.patient-owner-chip i {
  color: var(--color-status-info-indicator);
  font-size: 12px;
}

.owner-chip-label {
  font-weight: 600;
}

.owner-chip-value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.patient-header-actions {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn-primary {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 10px 16px;
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border: none;
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease;
}

.btn-primary:hover {
  background-color: color-mix(in srgb, var(--color-primary-main) 88%, #000);
}

.btn-primary i {
  font-size: 14px;
}

.btn-secondary {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 10px 16px;
  background-color: var(--color-background-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  font-weight: 500;
  cursor: pointer;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.btn-secondary:hover {
  background-color: var(--color-background-main);
  border-color: color-mix(in srgb, var(--color-text-muted) 40%, var(--color-border-light));
}

.btn-secondary i {
  font-size: 14px;
}

.status-cards-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  width: 100%;
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 22px;
  border-radius: var(--radius-large);
  box-sizing: border-box;
  box-shadow: var(--shadow-card);
  min-height: 130px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.icon-circle {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--color-primary-contrastText);
  font-size: 18px;
}

.count-number {
  font-size: 28px;
  line-height: 1.1;
  font-weight: 700;
  margin: 0;
}

.count-date {
  font-size: 18px;
  line-height: 1.35;
}

.card-title {
  font-size: var(--font-cardTitle-size);
  line-height: 1.35;
  font-weight: var(--font-cardTitle-weight);
  margin: 0;
}

.card-info {
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 26%, transparent);
  background: var(--color-status-info-bg);
}
.icon-info { background-color: var(--color-status-info-indicator); }
.text-info { color: var(--color-status-info-text); }
.title-info { color: var(--color-status-info-text); }

.card-success {
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 26%, transparent);
  background: var(--color-status-success-bg);
}
.icon-success { background-color: var(--color-status-success-indicator); }
.text-success { color: var(--color-status-success-text); }
.title-success { color: var(--color-status-success-text); }

.card-danger {
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 26%, transparent);
  background: var(--color-status-danger-bg);
}
.icon-danger { background-color: var(--color-status-danger-indicator); }
.text-danger { color: var(--color-status-danger-text); }
.title-danger { color: var(--color-status-danger-text); }

.card-primary {
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 26%, transparent);
  background: var(--color-primary-subtle);
}
.icon-primary { background-color: var(--color-primary-main); }
.text-primary { color: var(--color-primary-main); }
.title-primary { color: var(--color-text-primary); }

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 48px 32px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
}

.loading-spinner {
  font-size: 32px;
  color: var(--color-primary-main);
}

.historial-card {
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.historial-card > .card-header {
  padding: 18px 22px 0;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.section-title {
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
  margin: 0;
}

.results-chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.empty-timeline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 8px 22px 24px;
  padding: 40px 24px;
  text-align: center;
  color: var(--color-text-secondary);
  background: var(--color-background-main);
  border-radius: var(--radius-standard);
  border: 1px dashed color-mix(in srgb, var(--color-border-light) 80%, var(--color-text-muted));
}

.empty-timeline-icon {
  font-size: 32px;
  color: var(--color-text-muted);
}

.empty-timeline p {
  margin: 0;
  font-size: var(--font-body-main-size);
}

.medical-records-timeline {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  position: relative;
  padding: 18px 22px 24px;
}

.medical-records-timeline::before {
  content: '';
  position: absolute;
  left: 53px;
  top: 18px;
  bottom: 24px;
  width: 2px;
  background-color: var(--color-border-light);
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
  border-radius: var(--radius-large);
  border: 3px solid var(--color-background-surface);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
  box-shadow: var(--shadow-card);
}

.record-outer-container {
  background: var(--color-background-surface);
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.record-header {
  min-height: 60px;
  padding: 16px 22px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  box-sizing: border-box;
  border-bottom: 1px solid var(--color-border-light);
}

.record-title {
  font-size: var(--font-cardTitle-size);
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
}

.record-meta {
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: var(--font-body-caption-size);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.record-body {
  padding: 22px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background-color: transparent;
}

.variant-consulta .record-outer-container {
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 24%, transparent);
  background: color-mix(in srgb, var(--color-status-info-bg) 35%, var(--color-background-surface));
}
.variant-consulta .record-header {
  background: var(--color-status-info-bg);
  border-bottom-color: color-mix(in srgb, var(--color-status-info-indicator) 20%, transparent);
}
.variant-consulta .record-title { color: var(--color-status-info-text); }
.variant-consulta .meta-item { color: color-mix(in srgb, var(--color-status-info-text) 78%, var(--color-text-secondary)); }
.variant-consulta .bg-blue-tint { background-color: color-mix(in srgb, var(--color-status-info-bg) 85%, var(--color-background-surface)); }
.variant-consulta .icon-blue { color: var(--color-status-info-indicator); font-size: 24px; }
.variant-consulta .border-blue { border-color: color-mix(in srgb, var(--color-status-info-indicator) 24%, transparent); }

.variant-vacuna .record-outer-container {
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 24%, transparent);
  background: color-mix(in srgb, var(--color-status-success-bg) 35%, var(--color-background-surface));
}
.variant-vacuna .record-header {
  background: var(--color-status-success-bg);
  border-bottom-color: color-mix(in srgb, var(--color-status-success-indicator) 20%, transparent);
}
.variant-vacuna .record-title { color: var(--color-status-success-text); }
.variant-vacuna .meta-item { color: color-mix(in srgb, var(--color-status-success-text) 78%, var(--color-text-secondary)); }
.variant-vacuna .bg-green-tint { background-color: color-mix(in srgb, var(--color-status-success-bg) 85%, var(--color-background-surface)); }
.variant-vacuna .icon-green { color: var(--color-status-success-indicator); font-size: 24px; }
.variant-vacuna .border-green { border-color: color-mix(in srgb, var(--color-status-success-indicator) 24%, transparent); }

.variant-hospitalizacion .record-outer-container {
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 24%, transparent);
  background: color-mix(in srgb, var(--color-status-danger-bg) 35%, var(--color-background-surface));
}
.variant-hospitalizacion .record-header {
  background: var(--color-status-danger-bg);
  border-bottom-color: color-mix(in srgb, var(--color-status-danger-indicator) 20%, transparent);
}
.variant-hospitalizacion .record-title { color: var(--color-status-danger-text); }
.variant-hospitalizacion .meta-item { color: color-mix(in srgb, var(--color-status-danger-text) 78%, var(--color-text-secondary)); }
.variant-hospitalizacion .bg-red-tint { background-color: color-mix(in srgb, var(--color-status-danger-bg) 85%, var(--color-background-surface)); }
.variant-hospitalizacion .icon-red { color: var(--color-status-danger-indicator); font-size: 24px; }
.variant-hospitalizacion .border-red { border-color: color-mix(in srgb, var(--color-status-danger-indicator) 24%, transparent); }

.soap-section, .eval-section, .plan-section, .vaccine-section {
  background: var(--color-background-surface);
  border-radius: var(--radius-standard);
  padding: 18px 20px;
}

.border-blue-light {
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 22%, transparent);
}
.border-orange {
  border-left: 4px solid var(--color-status-warning-indicator);
  border-top: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 22%, transparent);
  border-right: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 22%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 22%, transparent);
}
.border-purple {
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, transparent);
  background: var(--color-primary-subtle);
}
.border-green-light {
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
}

.soap-header, .eval-header, .plan-header, .vaccine-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.soap-icon-box, .eval-icon-box, .plan-icon-box, .vaccine-icon-box {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-standard);
  display: flex;
  justify-content: center;
  align-items: center;
}

.eval-icon-box {
  background: var(--color-status-warning-bg);
  width: 36px;
  height: 36px;
}
.icon-orange { color: var(--color-status-warning-indicator); font-size: 18px; }
.plan-icon-box {
  background: var(--color-primary-subtle);
  width: 36px;
  height: 36px;
}
.icon-purple { color: var(--color-primary-main); font-size: 18px; }

.soap-title, .eval-title, .plan-title, .vaccine-title {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  margin: 0;
}

.text-blue-dark { color: var(--color-status-info-text); }
.text-green-dark { color: var(--color-status-success-text); }
.eval-title, .plan-title, .vaccine-title { color: var(--color-text-primary); }

.soap-text, .plan-text, .vaccine-notes {
  font-size: var(--font-body-main-size);
  line-height: 1.6;
  color: var(--color-text-primary);
  margin: 0;
}

.mt-3 { margin-top: 12px; }

.vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.vital-chip {
  background: var(--color-status-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
  border-radius: var(--radius-standard);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vital-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-status-success-text);
}

.vital-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
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
  color: var(--color-status-danger-indicator);
  font-size: 16px;
  margin-top: 2px;
}

.eval-label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.eval-value {
  font-size: 13px;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.plan-subsections {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.plan-subsection {
  background: var(--color-primary-subtle);
  border-radius: var(--radius-standard);
  padding: 12px 14px;
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
  color: var(--color-primary-main);
}

.icon-purple-dark {
  color: var(--color-primary-main);
  font-size: 14px;
}

.plan-list {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
  color: var(--color-text-secondary);
}

.plan-list li {
  font-size: 13px;
  line-height: 1.5;
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
  border-bottom: 1px solid var(--color-border-light);
}

.vaccine-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.vaccine-lot {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-status-success-text);
}

.hosp-summary-section, .hosp-vitals-section {
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 22%, transparent);
  border-radius: var(--radius-standard);
  padding: 16px;
}

.hosp-title {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

.hosp-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hosp-field {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.hosp-label {
  font-weight: 700;
  color: var(--color-text-primary);
}

.hosp-vitals-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.hosp-vital-chip {
  background: var(--color-status-danger-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 22%, transparent);
  border-radius: var(--radius-standard);
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hosp-vital-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-status-danger-text);
}

.hosp-vital-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.record-footer-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border-light);
}

.record-tag {
  background: var(--color-background-main);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}

.record-tag i {
  font-size: 10px;
}

@media (max-width: 1100px) {
  .status-cards-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .patient-header-card {
    flex-direction: column;
    align-items: stretch;
  }

  .patient-header-actions {
    justify-content: stretch;
  }

  .patient-header-actions .btn-primary,
  .patient-header-actions .btn-secondary {
    flex: 1;
    min-width: 0;
  }

  .status-cards-row {
    grid-template-columns: 1fr;
  }

  .medical-record-card {
    padding-left: 0;
    padding-top: 72px;
  }

  .timeline-icon-container {
    left: 50%;
    transform: translateX(-50%);
  }

  .medical-records-timeline::before {
    display: none;
  }
}

@media print {
  .patient-header-actions {
    display: none !important;
  }
  .historial-view {
    gap: 16px;
  }
  .patient-header-card {
    box-shadow: none;
    border: 2px solid #000;
  }
  .historial-card {
    box-shadow: none;
    border: 1px solid #ccc;
  }
  .medical-record-card {
    break-inside: avoid;
  }
}
</style>
