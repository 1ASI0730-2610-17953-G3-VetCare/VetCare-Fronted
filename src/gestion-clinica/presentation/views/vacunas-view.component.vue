<script setup>
import { ref, reactive, computed, onMounted, onActivated } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import {
  vaccinesState,
  parseDisplayDate,
  computeVaccineStatus,
  formatDisplayDate
} from '../../infrastructure/vaccine.utils.js';
import { VaccineService } from '../../infrastructure/services/vaccine.service.js';
import { usePatientStore } from '../../application/store/patient.store.js';
import { useVaccineStore } from '../../application/store/vaccine.store.js';
import { resolvePatientImage } from '../../infrastructure/patient-image.utils.js';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';

const { t } = useI18n();
const vaccineService = new VaccineService();
const patientStore = usePatientStore();
const vaccineStore = useVaccineStore();
const { patients } = storeToRefs(patientStore);

const searchQuery = ref('');
const filterStatus = ref('Todos');
const showModal = ref(false);
const showDetailModal = ref(false);
const selectedVaccine = ref(null);
const isSaving = ref(false);
const isLoading = ref(false);
const loadError = ref('');
const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const formErrors = reactive({});

const getDefaultForm = () => ({
  patientId: '',
  vaccineName: '',
  disease: '',
  lastApplication: '',
  nextDose: ''
});
const form = reactive(getDefaultForm());

const vaccines = vaccinesState;

const getAvatarImage = (vaccine) => {
  const patient = patients.value.find((p) => p.id === vaccine.patientId);
  return resolvePatientImage({
    id: vaccine.patientId ?? patient?.id,
    image: patient?.image,
    species: vaccine.species ?? patient?.species,
    name: vaccine.patientName ?? patient?.name
  });
};

const loadData = async (force = false) => {
  const needsLoader = vaccinesState.value.length === 0 || patients.value.length === 0;
  if (needsLoader) isLoading.value = true;
  loadError.value = '';
  try {
    await Promise.all([
      patientStore.fetchPatients({ force }),
      vaccineStore.fetchVaccines({ force })
    ]);
  } catch (error) {
    console.error('Error loading vaccines:', error);
    loadError.value = t('clinicManagement.vaccines.loadError');
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadData();
});

onActivated(() => {
  loadData();
});

const getSpeciesClass = (species) => {
  if (species === 'Perro') return 'species-dog';
  if (species === 'Gato') return 'species-cat';
  return 'species-default';
};

const openModal = () => { Object.assign(form, getDefaultForm()); Object.keys(formErrors).forEach(k => delete formErrors[k]); showModal.value = true; };
const closeModal = () => { showModal.value = false; };

const openDetailModal = (vaccine) => {
  selectedVaccine.value = vaccine;
  showDetailModal.value = true;
};

const closeDetailModal = () => {
  showDetailModal.value = false;
  selectedVaccine.value = null;
};

const validateForm = () => {
  Object.keys(formErrors).forEach(k => delete formErrors[k]);
  if (!form.patientId) formErrors.patientId = true;
  if (!form.vaccineName.trim()) formErrors.vaccineName = true;
  if (!form.lastApplication) formErrors.lastApplication = true;
  return Object.keys(formErrors).length === 0;
};

const displayToast = (msg, type) => {
  toastMessage.value = msg; toastType.value = type; showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const formatDate = formatDisplayDate;

const enrichedVaccines = computed(() =>
  vaccines.value.map((vaccine) => ({
    ...vaccine,
    ...computeVaccineStatus(vaccine.nextDose)
  }))
);

const filteredVaccines = computed(() => {
  return enrichedVaccines.value.filter(vaccine => {
    let match = true;
    
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const patientMatch = vaccine.patientName.toLowerCase().includes(q);
      const vaccineMatch = vaccine.vaccineName.toLowerCase().includes(q);
      const diseaseMatch = vaccine.disease.toLowerCase().includes(q);
      match = match && (patientMatch || vaccineMatch || diseaseMatch);
    }
    
    if (filterStatus.value && filterStatus.value !== 'Todos') {
      match = match && (vaccine.status === filterStatus.value);
    }
    
    return match;
  });
});

const expiredCount = computed(() => enrichedVaccines.value.filter(v => v.status === 'Vencida').length);
const upcomingCount = computed(() => enrichedVaccines.value.filter(v => v.status === 'Próxima').length);
const upToDateCount = computed(() => enrichedVaccines.value.filter(v => v.status === 'Al Día').length);

const reminderDismissed = ref(false);
const alertVaccines = computed(() =>
  enrichedVaccines.value.filter(v => v.status === 'Vencida' || v.status === 'Próxima')
);
const alertExpiredCount = computed(() => alertVaccines.value.filter(v => v.status === 'Vencida').length);
const alertUpcomingCount = computed(() => alertVaccines.value.filter(v => v.status === 'Próxima').length);

const showApplyModal = ref(false);
const vaccineToApply = ref(null);
const applyForm = reactive({
  applicationDate: '',
  nextDoseDate: ''
});

const toIsoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

const openApplyModal = (vaccine) => {
  vaccineToApply.value = vaccine;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  applyForm.applicationDate = toIsoDate(today);
  applyForm.nextDoseDate = toIsoDate(addYears(today, 1));
  showApplyModal.value = true;
  closeDetailModal();
};

const closeApplyModal = () => {
  showApplyModal.value = false;
  vaccineToApply.value = null;
};

const onApplicationDateChange = () => {
  if (!applyForm.applicationDate) return;
  const appDate = new Date(`${applyForm.applicationDate}T00:00:00`);
  applyForm.nextDoseDate = toIsoDate(addYears(appDate, 1));
};

const confirmApplyVaccine = async () => {
  if (!vaccineToApply.value || !applyForm.applicationDate || !applyForm.nextDoseDate) {
    displayToast(t('clinicManagement.vaccines.applyForm.errorMessage'), 'error');
    return;
  }

  isSaving.value = true;
  try {
    const { patientName, vaccineName } = vaccineToApply.value;
    await vaccineService.applyVaccine(vaccineToApply.value.id, {
      lastApplication: applyForm.applicationDate,
      nextDose: applyForm.nextDoseDate
    });
    displayToast(
      t('clinicManagement.vaccines.applyForm.successMessage', { name: patientName, vaccine: vaccineName }),
      'success'
    );
    closeApplyModal();
  } catch (error) {
    console.error('Error applying vaccine:', error);
    displayToast(t('clinicManagement.vaccines.applyForm.errorMessage'), 'error');
  } finally {
    isSaving.value = false;
  }
};

const submitForm = async () => {
  if (!validateForm()) return;
  isSaving.value = true;

  try {
    await vaccineService.createVaccineRecord({
      patientId: form.patientId,
      vaccineName: form.vaccineName,
      disease: form.disease || '-',
      lastApplication: form.lastApplication,
      nextDose: form.nextDose || null
    });
    displayToast(t('clinicManagement.vaccines.registerForm.successMessage'), 'success');
    closeModal();
  } catch (error) {
    console.error('Error registering vaccine:', error);
    displayToast(t('clinicManagement.vaccines.registerForm.errorMessage'), 'error');
  } finally {
    isSaving.value = false;
  }
};

</script>

<template>
  <div class="vacunas-view">
    
    <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    
    <Transition name="fade">
      <div v-if="alertVaccines.length > 0 && !reminderDismissed" class="vaccine-alert-banner" role="alert">
        <div class="banner-icon-wrap">
          <i class="pi pi-bell" aria-hidden="true"></i>
        </div>
        <div class="banner-body">
          <p class="banner-title">
            {{ t('clinicManagement.vaccines.reminderBanner.title', { count: alertVaccines.length, expired: alertExpiredCount, upcoming: alertUpcomingCount }) }}
          </p>
          <div class="banner-chips">
            <span
              v-for="vaccine in alertVaccines"
              :key="vaccine.id"
              :class="['alert-chip', `alert-chip-${vaccine.type}`]"
            >
              <span class="chip-label">{{ vaccine.patientName }} · {{ vaccine.vaccineName }}</span>
              <span class="chip-status">{{ t(`clinicManagement.vaccines.status.${vaccine.status}`) }}</span>
            </span>
          </div>
        </div>
        <button type="button" class="banner-dismiss" :aria-label="t('clinicManagement.vaccines.reminderBanner.dismiss')" @click="reminderDismissed = true">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </Transition>

    <div class="page-header">
      <div class="header-main">
        <div class="header-icon-wrap">
          <i class="pi pi-shield" aria-hidden="true"></i>
        </div>
        <div class="view-info">
          <h1 class="view-title">{{ t('clinicManagement.vaccines.title') }}</h1>
          <p class="view-description">{{ t('clinicManagement.vaccines.description') }}</p>
        </div>
      </div>
      <button type="button" class="btn-primary" @click="openModal">
        <i class="pi pi-plus"></i>
        {{ t('clinicManagement.vaccines.register') }}
      </button>
    </div>

    
    <PageViewLoading v-if="isLoading" variant="cards" :card-count="3" />

    <div v-else class="status-cards-row">
      
      <div class="status-card card-danger">
        <div class="card-header-row">
          <div class="icon-circle icon-danger">
            <i class="pi pi-exclamation-circle"></i>
          </div>
          <p class="count-number text-danger">{{ expiredCount }}</p>
        </div>
        <h3 class="card-title title-danger">{{ t('clinicManagement.vaccines.statusCards.expired.title') }}</h3>
        <p class="card-subtitle subtitle-danger">{{ t('clinicManagement.vaccines.statusCards.expired.subtitle') }}</p>
      </div>

      
      <div class="status-card card-warning">
        <div class="card-header-row">
          <div class="icon-circle icon-warning">
            <i class="pi pi-clock"></i>
          </div>
          <p class="count-number text-warning">{{ upcomingCount }}</p>
        </div>
        <h3 class="card-title title-warning">{{ t('clinicManagement.vaccines.statusCards.upcoming.title') }}</h3>
        <p class="card-subtitle subtitle-warning">{{ t('clinicManagement.vaccines.statusCards.upcoming.subtitle') }}</p>
      </div>

      
      <div class="status-card card-success">
        <div class="card-header-row">
          <div class="icon-circle icon-success">
            <i class="pi pi-check"></i>
          </div>
          <p class="count-number text-success">{{ upToDateCount }}</p>
        </div>
        <h3 class="card-title title-success">{{ t('clinicManagement.vaccines.statusCards.upToDate.title') }}</h3>
        <p class="card-subtitle subtitle-success">{{ t('clinicManagement.vaccines.statusCards.upToDate.subtitle') }}</p>
      </div>
    </div>

    
    <div class="vacunas-card">
      <div class="card-header">
        <div class="card-header-left">
          <h2 class="section-title">{{ t('clinicManagement.vaccines.listTitle') }}</h2>
          <span class="results-chip">
            {{ t('clinicManagement.vaccines.resultsCount', { count: filteredVaccines.length }) }}
          </span>
        </div>
      </div>

      <div class="filters-panel">
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="t('clinicManagement.vaccines.search')"
            class="search-input"
          />
        </div>
        <div class="filter-select-wrapper">
          <select v-model="filterStatus" class="filter-select">
            <option value="Todos">{{ t('clinicManagement.vaccines.allStatuses') }}</option>
            <option value="Vencida">{{ t('clinicManagement.vaccines.status.Vencida') }}</option>
            <option value="Próxima">{{ t('clinicManagement.vaccines.status.Próxima') }}</option>
            <option value="Al Día">{{ t('clinicManagement.vaccines.status.Al Día') }}</option>
          </select>
          <i class="pi pi-chevron-down select-icon" aria-hidden="true"></i>
        </div>
      </div>

    <div class="table-container">
      <PageViewLoading
        v-if="isLoading"
        variant="table"
        :columns="6"
        :table-rows="6"
        :message="t('clinicManagement.vaccines.loading')"
      />
      <div v-else-if="loadError" class="table-state table-state-error">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ loadError }}</p>
        <button type="button" class="btn-retry" @click="loadData">{{ t('clinicManagement.vaccines.retry') }}</button>
      </div>
      <table v-else class="vaccine-table">
        <thead>
          <tr>
            <th>{{ t('clinicManagement.vaccines.columns.patient') }}</th>
            <th>{{ t('clinicManagement.vaccines.columns.vaccine') }}</th>
            <th>{{ t('clinicManagement.vaccines.columns.lastApplication') }}</th>
            <th>{{ t('clinicManagement.vaccines.columns.nextDose') }}</th>
            <th>{{ t('clinicManagement.vaccines.columns.status') }}</th>
            <th>{{ t('clinicManagement.vaccines.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredVaccines.length === 0">
            <td colspan="6" class="table-empty-cell">
              <i class="pi pi-inbox"></i>
              <span>{{ t('clinicManagement.vaccines.emptyList') }}</span>
            </td>
          </tr>
          <tr v-for="vaccine in filteredVaccines" :key="vaccine.id">
            <td>
              <div class="patient-cell">
                <div :class="['species-avatar', getSpeciesClass(vaccine.species)]">
                  <img v-if="getAvatarImage(vaccine)" :src="getAvatarImage(vaccine)" :alt="vaccine.patientName" class="patient-image" />
                  <span v-else class="patient-initial">{{ vaccine.patientName.charAt(0) }}</span>
                </div>
                <span class="patient-name">{{ vaccine.patientName }}</span>
              </div>
            </td>
            <td>
              <div class="vaccine-cell">
                <span class="vaccine-name">{{ vaccine.vaccineName }}</span>
                <span class="vaccine-disease">{{ vaccine.disease }}</span>
              </div>
            </td>
            <td>
              <span class="vaccine-date">{{ vaccine.lastApplication }}</span>
            </td>
            <td>
              <span
                :class="['vaccine-date', vaccine.status !== 'Al Día' ? `text-${vaccine.type}` : '', vaccine.status !== 'Al Día' ? 'date-emphasis' : '']"
              >{{ vaccine.nextDose }}</span>
            </td>
            <td>
              <span :class="['status-badge', `badge-${vaccine.type}`]">
                {{ t(`clinicManagement.vaccines.status.${vaccine.status}`) }}
              </span>
            </td>
            <td>
              <div class="table-actions">
                <button type="button" class="action-btn action-view" @click="openDetailModal(vaccine)">
                  <span class="action-icon-wrap"><i class="pi pi-eye"></i></span>
                  <span class="action-label">{{ t('clinicManagement.vaccines.viewDetails') }}</span>
                </button>
                <button
                  v-if="vaccine.status !== 'Al Día'"
                  type="button"
                  class="action-btn action-apply"
                  :title="t('clinicManagement.vaccines.actions.apply')"
                  @click="openApplyModal(vaccine)"
                >
                  <span class="action-icon-wrap apply"><i class="pi pi-check-circle"></i></span>
                  <span class="action-label">{{ t('clinicManagement.vaccines.actions.apply') }}</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      
      <div class="pagination-bar" v-if="filteredVaccines.length > 0">
        <div class="results-summary">
          {{ t('clinicManagement.vaccines.pagination.showing', { from: 1, to: filteredVaccines.length, total: filteredVaccines.length }) }}
        </div>
        <div class="pagination-controls">
          <button class="pagination-nav-btn disabled-btn" disabled>
            <i class="pi pi-chevron-left"></i>
          </button>
          <button class="pagination-btn active">1</button>
          <button class="pagination-nav-btn disabled-btn" disabled>
            <i class="pi pi-chevron-right"></i>
          </button>
        </div>
      </div>
    </div>
    </div>

    
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container register-modal">
          <div class="modal-header">
            <div class="modal-header-icon icon-success"><i class="pi pi-shield" aria-hidden="true"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.vaccines.registerForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.vaccines.registerForm.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="register-form" @submit.prevent="submitForm">
            <div class="register-form-content">
              <section class="register-panel">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon register-panel-icon-info"><i class="pi pi-user" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.vaccines.registerForm.patientInfo') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full" :class="{ 'has-error': formErrors.patientId }">
                    <label>{{ t('clinicManagement.vaccines.registerForm.patientName') }} *</label>
                    <select v-model="form.patientId">
                      <option value="">{{ t('clinicManagement.vaccines.registerForm.patientNamePlaceholder') }}</option>
                      <option v-for="patient in patients" :key="patient.id" :value="patient.id">
                        {{ patient.name }} ({{ patient.species }})
                      </option>
                    </select>
                    <span v-if="formErrors.patientId" class="error-text">{{ t('clinicManagement.vaccines.registerForm.required') }}</span>
                  </div>
                </div>
              </section>

              <section class="register-panel">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon register-panel-icon-success"><i class="pi pi-heart-fill" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.vaccines.registerForm.vaccineInfo') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group" :class="{ 'has-error': formErrors.vaccineName }">
                    <label>{{ t('clinicManagement.vaccines.registerForm.vaccineName') }} *</label>
                    <input type="text" v-model="form.vaccineName" :placeholder="t('clinicManagement.vaccines.registerForm.vaccineNamePlaceholder')" />
                    <span v-if="formErrors.vaccineName" class="error-text">{{ t('clinicManagement.vaccines.registerForm.required') }}</span>
                  </div>
                  <div class="form-group">
                    <label>{{ t('clinicManagement.vaccines.registerForm.disease') }}</label>
                    <input type="text" v-model="form.disease" :placeholder="t('clinicManagement.vaccines.registerForm.diseasePlaceholder')" />
                  </div>
                  <div class="form-group" :class="{ 'has-error': formErrors.lastApplication }">
                    <label>{{ t('clinicManagement.vaccines.registerForm.applicationDate') }} *</label>
                    <input type="date" v-model="form.lastApplication" />
                    <span v-if="formErrors.lastApplication" class="error-text">{{ t('clinicManagement.vaccines.registerForm.required') }}</span>
                  </div>
                  <div class="form-group">
                    <label>{{ t('clinicManagement.vaccines.registerForm.nextDose') }}</label>
                    <input type="date" v-model="form.nextDose" />
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-actions register-form-actions">
              <button type="button" class="btn-cancel" @click="closeModal">{{ t('clinicManagement.vaccines.registerForm.cancel') }}</button>
              <button type="submit" class="btn-submit" :disabled="isSaving">
                <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ isSaving ? t('clinicManagement.vaccines.registerForm.saving') : t('clinicManagement.vaccines.registerForm.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showDetailModal && selectedVaccine" class="modal-overlay" @click.self="closeDetailModal">
        <div class="modal-container view-modal">
          <div class="modal-header">
            <div class="modal-header-icon icon-success"><i class="pi pi-shield" aria-hidden="true"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.vaccines.detailModal.title', { id: selectedVaccine.id }) }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.vaccines.detailModal.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeDetailModal"><i class="pi pi-times"></i></button>
          </div>

          <div class="detail-form-content">
            <section class="detail-panel detail-panel-info">
              <h3 class="detail-panel-title">
                <span class="detail-panel-icon detail-panel-icon-info"><i class="pi pi-user" aria-hidden="true"></i></span>
                {{ t('clinicManagement.vaccines.detailModal.patientSection') }}
              </h3>
              <div class="detail-patient-card">
                <div :class="['species-avatar', getSpeciesClass(selectedVaccine.species)]">
                  <img
                    v-if="getAvatarImage(selectedVaccine)"
                    :src="getAvatarImage(selectedVaccine)"
                    :alt="selectedVaccine.patientName"
                    class="patient-image"
                  />
                  <span v-else class="patient-initial">{{ selectedVaccine.patientName.charAt(0) }}</span>
                </div>
                <div class="detail-patient-info">
                  <strong class="detail-patient-name">{{ selectedVaccine.patientName }}</strong>
                  <span class="detail-patient-species">{{ selectedVaccine.species }}</span>
                </div>
              </div>
            </section>

            <section class="detail-panel detail-panel-success">
              <h3 class="detail-panel-title">
                <span class="detail-panel-icon detail-panel-icon-success"><i class="pi pi-heart-fill" aria-hidden="true"></i></span>
                {{ t('clinicManagement.vaccines.detailModal.vaccineSection') }}
              </h3>
              <div class="detail-fields-grid">
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.vaccines.registerForm.vaccineName') }}</span>
                  <strong class="detail-field-value">{{ selectedVaccine.vaccineName }}</strong>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.vaccines.registerForm.disease') }}</span>
                  <strong class="detail-field-value">{{ selectedVaccine.disease || '—' }}</strong>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.vaccines.columns.lastApplication') }}</span>
                  <strong class="detail-field-value">{{ selectedVaccine.lastApplication }}</strong>
                </div>
                <div class="detail-field">
                  <span class="detail-field-label">{{ t('clinicManagement.vaccines.columns.nextDose') }}</span>
                  <strong class="detail-field-value" :class="selectedVaccine.status !== 'Al Día' ? `text-${selectedVaccine.type}` : ''">
                    {{ selectedVaccine.nextDose }}
                  </strong>
                </div>
                <div class="detail-field span-full">
                  <span class="detail-field-label">{{ t('clinicManagement.vaccines.columns.status') }}</span>
                  <span :class="['status-badge', `badge-${selectedVaccine.type}`]">
                    {{ t(`clinicManagement.vaccines.status.${selectedVaccine.status}`) }}
                  </span>
                </div>
              </div>
            </section>
          </div>

          <div class="modal-actions detail-modal-actions">
            <button type="button" class="btn-cancel" @click="closeDetailModal">
              {{ t('clinicManagement.vaccines.detailModal.close') }}
            </button>
            <button
              v-if="selectedVaccine.status !== 'Al Día'"
              type="button"
              class="btn-submit"
              @click="openApplyModal(selectedVaccine)"
            >
              <i class="pi pi-check-circle"></i>
              {{ t('clinicManagement.vaccines.actions.apply') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showApplyModal && vaccineToApply" class="modal-overlay" @click.self="closeApplyModal">
        <div class="modal-container apply-modal">
          <div class="modal-header">
            <div class="modal-header-icon icon-success"><i class="pi pi-check-circle" aria-hidden="true"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.vaccines.applyForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.vaccines.applyForm.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeApplyModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="register-form apply-form" @submit.prevent="confirmApplyVaccine">
            <div class="register-form-content">
              <section class="register-panel register-panel-info">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon register-panel-icon-info"><i class="pi pi-id-card" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.vaccines.applyForm.summarySection') }}
                </h3>
                <div class="apply-summary-grid">
                  <div class="detail-field">
                    <span class="detail-field-label">{{ t('clinicManagement.vaccines.applyForm.patient') }}</span>
                    <strong class="detail-field-value">{{ vaccineToApply.patientName }}</strong>
                  </div>
                  <div class="detail-field">
                    <span class="detail-field-label">{{ t('clinicManagement.vaccines.applyForm.vaccine') }}</span>
                    <strong class="detail-field-value">{{ vaccineToApply.vaccineName }}</strong>
                  </div>
                </div>
              </section>

              <section class="register-panel">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon register-panel-icon-success"><i class="pi pi-calendar" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.vaccines.applyForm.applicationDate') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label>{{ t('clinicManagement.vaccines.applyForm.applicationDate') }} *</label>
                    <input
                      v-model="applyForm.applicationDate"
                      type="date"
                      required
                      @change="onApplicationDateChange"
                    />
                  </div>
                  <div class="form-group">
                    <label>{{ t('clinicManagement.vaccines.applyForm.nextDoseDate') }} *</label>
                    <input v-model="applyForm.nextDoseDate" type="date" required />
                    <span class="field-hint">{{ t('clinicManagement.vaccines.applyForm.nextDoseHint') }}</span>
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-actions register-form-actions">
              <button type="button" class="btn-cancel" @click="closeApplyModal">
                {{ t('clinicManagement.vaccines.registerForm.cancel') }}
              </button>
              <button type="submit" class="btn-submit" :disabled="isSaving">
                <i v-if="isSaving" class="pi pi-spin pi-spinner"></i>
                <i v-else class="pi pi-check"></i>
                {{ isSaving ? t('clinicManagement.vaccines.applyForm.saving') : t('clinicManagement.vaccines.applyForm.confirm') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.vacunas-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 18px 20px;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
}

.header-main {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, transparent);
  color: var(--color-primary-main);
  font-size: 20px;
}

.view-title {
  font-size: var(--font-title-size);
  line-height: 1.3;
  font-weight: var(--font-title-weight);
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
}

.view-description {
  font-size: var(--font-subtitle-size);
  line-height: 1.4;
  font-weight: var(--font-subtitle-weight);
  color: var(--color-text-secondary);
  margin: 0;
}

.btn-primary {
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border: none;
  border-radius: var(--radius-standard);
  padding: 10px 20px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 24%, transparent);
}

.vaccine-alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  background: color-mix(in srgb, var(--color-status-warning-indicator) 10%, var(--color-background-surface));
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 28%, var(--color-border-light));
  border-left: 4px solid var(--color-status-warning-indicator);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
}

.banner-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-indicator);
  font-size: 18px;
}

.banner-body {
  flex: 1;
  min-width: 0;
}

.banner-title {
  margin: 0 0 10px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-status-warning-text);
  line-height: 1.45;
}

.banner-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.alert-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  border: 1px solid transparent;
}

.alert-chip-danger {
  background: var(--color-status-danger-bg);
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 22%, transparent);
  color: var(--color-status-danger-text);
}

.alert-chip-warning {
  background: var(--color-status-warning-bg);
  border-color: color-mix(in srgb, var(--color-status-warning-indicator) 22%, transparent);
  color: var(--color-status-warning-text);
}

.chip-label {
  font-weight: 500;
}

.chip-status {
  font-weight: 700;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.banner-dismiss {
  background: none;
  border: none;
  cursor: pointer;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-status-warning-text);
  flex-shrink: 0;
  transition: background 0.2s ease;
}

.banner-dismiss:hover {
  background: color-mix(in srgb, var(--color-status-warning-indicator) 14%, transparent);
}

.status-cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
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
  min-height: 140px;
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

.card-title {
  font-size: var(--font-cardTitle-size);
  line-height: 1.35;
  font-weight: var(--font-cardTitle-weight);
  margin: 0;
}

.card-subtitle {
  font-size: var(--font-body-main-size);
  line-height: 1.4;
  margin: 0;
}

.card-danger {
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 26%, transparent);
  background: var(--color-status-danger-bg);
}
.icon-danger { background-color: var(--color-status-danger-indicator); }
.text-danger { color: var(--color-status-danger-text); }
.title-danger { color: var(--color-status-danger-text); }
.subtitle-danger { color: color-mix(in srgb, var(--color-status-danger-text) 82%, var(--color-text-secondary)); }

.card-warning {
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 26%, transparent);
  background: var(--color-status-warning-bg);
}
.icon-warning { background-color: var(--color-status-warning-indicator); }
.text-warning { color: var(--color-status-warning-text); }
.title-warning { color: var(--color-status-warning-text); }
.subtitle-warning { color: color-mix(in srgb, var(--color-status-warning-text) 82%, var(--color-text-secondary)); }

.card-success {
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 26%, transparent);
  background: var(--color-status-success-bg);
}
.icon-success { background-color: var(--color-status-success-indicator); }
.text-success { color: var(--color-status-success-text); }
.title-success { color: var(--color-status-success-text); }
.subtitle-success { color: color-mix(in srgb, var(--color-status-success-text) 82%, var(--color-text-secondary)); }

.vacunas-card {
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.card-header {
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

.filters-panel {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 16px 22px 0;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--color-background-main) 65%, var(--color-background-surface));
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.filter-select-wrapper {
  position: relative;
  min-width: 180px;
}

.filter-select {
  width: 100%;
  padding: 10px 32px 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-select:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
  font-size: 11px;
}

.table-container {
  padding: 16px 22px 0;
}

.table-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  color: var(--color-text-secondary);
}

.table-state i {
  font-size: 1.5rem;
  color: var(--color-primary-main);
}

.table-state-error {
  color: var(--color-status-danger-text);
}

.btn-retry {
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  color: var(--color-text-primary);
  border-radius: var(--radius-standard);
  padding: 8px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-retry:hover {
  background: var(--color-background-main);
}

.vaccine-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  text-align: left;
}

.vaccine-table th {
  padding: 12px 16px;
  font-size: var(--font-body-tag-size);
  font-weight: var(--font-body-tag-weight);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-background-main) 80%, var(--color-background-surface));
  border-bottom: 1px solid var(--color-border-light);
}

.vaccine-table th:first-child {
  border-radius: 10px 0 0 0;
}

.vaccine-table th:last-child {
  border-radius: 0 10px 0 0;
}

.vaccine-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
  vertical-align: middle;
}

.vaccine-table tbody tr {
  transition: background 0.2s ease;
}

.vaccine-table tbody tr:hover {
  background: color-mix(in srgb, var(--color-primary-main) 4%, var(--color-background-surface));
}

.vaccine-table tr:last-child td {
  border-bottom: none;
}

.table-empty-cell {
  text-align: center;
  padding: 56px 24px !important;
  color: var(--color-text-secondary);
}

.table-empty-cell i {
  display: block;
  font-size: 1.75rem;
  margin-bottom: 10px;
  color: var(--color-text-muted);
}

.patient-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.species-avatar {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid var(--color-background-surface);
  box-shadow: 0 0 0 1px var(--color-border-light);
}

.patient-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.patient-initial {
  font-weight: 600;
  font-size: var(--font-body-main-size);
}

.species-dog {
  background: var(--color-status-info-bg);
  color: var(--color-status-info-text);
}

.species-cat {
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-text);
}

.species-default {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-text);
}

.patient-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.vaccine-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vaccine-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.vaccine-disease {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.vaccine-date {
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
}

.vaccine-date.date-emphasis {
  font-weight: 600;
}

.vaccine-date.text-danger {
  color: var(--color-status-danger-text);
}

.vaccine-date.text-warning {
  color: var(--color-status-warning-text);
}

.vaccine-date.text-success {
  color: var(--color-status-success-text);
}

.status-badge {
  padding: 5px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.badge-danger {
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-text);
}

.badge-warning {
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-text);
}

.badge-success {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-text);
}

.table-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.action-btn:hover {
  opacity: 0.88;
}

.action-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  flex-shrink: 0;
}

.action-view .action-icon-wrap {
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 18%, transparent);
}

.action-icon-wrap.apply {
  color: var(--color-status-success-indicator);
  background: var(--color-status-success-bg);
  border-color: color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
}

.action-label {
  font-size: var(--font-body-main-size);
  font-weight: 500;
  color: var(--color-text-accent);
}

.register-modal {
  max-width: 640px;
}

.view-modal,
.apply-modal {
  max-width: 620px;
}

.register-form {
  display: flex;
  flex-direction: column;
}

.register-form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 28px 8px;
}

.detail-form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 28px;
}

.register-panel,
.detail-panel {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--color-background-main) 55%, var(--color-background-surface));
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
}

.register-panel-info,
.detail-panel-info {
  border-color: color-mix(in srgb, var(--color-status-info-indicator) 20%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-status-info-bg) 40%, var(--color-background-surface));
}

.detail-panel-success {
  border-color: color-mix(in srgb, var(--color-status-success-indicator) 20%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-status-success-bg) 35%, var(--color-background-surface));
}

.register-panel-title,
.detail-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.register-panel-icon,
.detail-panel-icon {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  font-size: 13px;
  flex-shrink: 0;
}

.register-panel-icon-info,
.detail-panel-icon-info {
  background: var(--color-status-info-bg);
  color: var(--color-status-info-indicator);
}

.register-panel-icon-success,
.detail-panel-icon-success {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-indicator);
}

.apply-summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 90%, transparent);
  border-radius: var(--radius-standard);
}

.detail-field.span-full {
  grid-column: 1 / -1;
}

.detail-field-label {
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.detail-field-value {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.detail-field .status-badge {
  display: inline-flex;
  width: fit-content;
}

.detail-patient-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-border-light) 90%, transparent);
  border-radius: var(--radius-standard);
}

.detail-patient-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-patient-name {
  font-size: var(--font-body-main-size);
  font-weight: 700;
  color: var(--color-text-primary);
}

.detail-patient-species {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.field-hint {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-muted);
  line-height: 1.4;
}

.apply-form .register-form-content {
  gap: 16px;
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  border-top: 1px solid var(--color-border-light);
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
}

.results-summary {
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-btn,
.pagination-nav-btn {
  min-width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-surface);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: var(--font-body-main-size);
  cursor: pointer;
  transition: background 0.2s ease;
}

.pagination-btn:hover:not(.active),
.pagination-nav-btn:hover:not(.disabled-btn) {
  background: color-mix(in srgb, var(--color-primary-main) 6%, var(--color-background-surface));
}

.pagination-btn.active {
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border-color: var(--color-primary-main);
  font-weight: 600;
}

.disabled-btn {
  opacity: 0.45;
  cursor: not-allowed;
}

.pagination-nav-btn i {
  font-size: 12px;
}

.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 10px;
  font-size: var(--font-body-main-size);
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease;
}

.toast-success { background: var(--color-status-success-bg); color: var(--color-status-success-text); border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 30%, transparent); }
.toast-error { background: var(--color-status-danger-bg); color: var(--color-status-danger-text); border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 30%, transparent); }
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }


.modal-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(15, 23, 42, 0.75);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.modal-enter-active { animation: fadeIn 0.25s ease; }
.modal-leave-active { animation: fadeOut 0.2s ease; }
.modal-enter-active .modal-container { animation: scaleIn 0.25s ease; }
.modal-leave-active .modal-container { animation: scaleOut 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes scaleOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }


.modal-container {
  background: var(--color-background-surface);
  border-radius: var(--radius-large);
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border-light);
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid var(--color-border-light);
  position: sticky;
  top: 0;
  background: var(--color-background-surface);
  z-index: 1;
  border-radius: var(--radius-large) var(--radius-large) 0 0;
}

.modal-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 22%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.modal-header-icon.icon-success {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-indicator);
  border-color: color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.modal-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

.modal-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 16px;
  transition: background 0.2s ease, color 0.2s ease;
}

.modal-close:hover {
  background: var(--color-background-main);
  color: var(--color-text-primary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.span-full {
  grid-column: 1 / -1;
}

.register-form .form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.register-form .form-group input,
.register-form .form-group select {
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  font-family: inherit;
}

.register-form .form-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

.register-form .form-group input:focus,
.register-form .form-group select:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.has-error input,
.has-error select {
  border-color: var(--color-status-danger-indicator);
}

.has-error input:focus,
.has-error select:focus {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-status-danger-indicator) 14%, transparent);
}

.error-text {
  font-size: 12px;
  color: var(--color-status-danger-text);
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 28px;
  border-top: 1px solid var(--color-border-light);
  position: sticky;
  bottom: 0;
  background: var(--color-background-surface);
  border-radius: 0 0 var(--radius-large) var(--radius-large);
}

.btn-cancel {
  padding: 10px 20px;
  border-radius: var(--radius-standard);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-body-main-size);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}

.btn-cancel:hover {
  background: var(--color-background-main);
  border-color: color-mix(in srgb, var(--color-text-muted) 40%, var(--color-border-light));
}

.btn-submit {
  padding: 10px 24px;
  border-radius: var(--radius-standard);
  border: none;
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  font-size: var(--font-body-main-size);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-submit:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 28%, transparent);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.detail-field-value.text-danger { color: var(--color-status-danger-text); }
.detail-field-value.text-warning { color: var(--color-status-warning-text); }

@media (max-width: 1024px) {
  .status-cards-row {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .btn-primary {
    justify-content: center;
  }

  .filters-panel {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-select-wrapper {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .modal-overlay { padding: 12px; }
  .modal-container { max-height: 95vh; }
  .modal-header { padding: 16px 20px; }
  .register-form-content,
  .detail-form-content { padding: 16px 20px; }
  .register-form-content { padding-bottom: 8px; }
  .modal-actions { padding: 16px 20px; }
  .form-grid,
  .detail-fields-grid,
  .apply-summary-grid { grid-template-columns: 1fr; }
  .form-group.span-full,
  .detail-field.span-full { grid-column: 1; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
