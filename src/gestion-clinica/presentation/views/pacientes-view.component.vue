<script setup>
import { ref, computed, reactive, onActivated, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { usePatientStore } from '../../application/store/patient.store.js';
import { useClientStore } from '../../application/store/client.store.js';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';
import { resolvePatientImageFromPatient, resolvePatientImageOnError } from '../../infrastructure/patient-image.utils.js';

const { t } = useI18n();
const router = useRouter();
const patientStore = usePatientStore();
const clientStore = useClientStore();
const { patients } = storeToRefs(patientStore);
const { clients } = storeToRefs(clientStore);

const searchQuery = ref('');
const filterStatus = ref('Todos');
const showModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const selectedPatient = ref(null);
const isSaving = ref(false);
const isUpdating = ref(false);
const isDeleting = ref(false);
const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const formErrors = reactive({});

const getDefaultForm = () => ({
  name: '', species: '', breed: '', sex: '',
  birthDate: '', weight: '', ownerId: '',
  allergies: '', notes: ''
});
const form = reactive(getDefaultForm());

const getDefaultEditForm = () => ({
  age: '',
  weight: '',
  allergies: ''
});
const editForm = reactive(getDefaultEditForm());
const editErrors = reactive({});

const isPageFetching = ref(false);

const isLoading = computed(
  () => isPageFetching.value && patients.value.length === 0 && clients.value.length === 0
);

const loadPageData = async () => {
  const needsLoader = patients.value.length === 0 || clients.value.length === 0;
  if (needsLoader) isPageFetching.value = true;
  try {
    await Promise.all([
      patientStore.fetchPatients(),
      clientStore.fetchClients()
    ]);
  } catch (error) {
    displayToast(t('clinicManagement.patients.registerForm.errorMessage'), 'error');
  } finally {
    isPageFetching.value = false;
  }
};

onMounted(() => {
  loadPageData();
});

onActivated(() => {
  loadPageData();
});

const filteredPatients = computed(() => {
  return patients.value.filter(p => {
    const s = searchQuery.value.toLowerCase();
    const codeStr = p.code || p.id || '';
    const matchesSearch = p.name.toLowerCase().includes(s)
      || (p.owner ?? '').toLowerCase().includes(s)
      || codeStr.toString().toLowerCase().includes(s);
    return matchesSearch && (filterStatus.value === 'Todos' || p.status === filterStatus.value);
  });
});

const totalPatients = computed(() => patients.value.length);
const activePatients = computed(() => patients.value.filter((p) => p.status === 'Activo').length);
const treatmentPatients = computed(() => patients.value.filter((p) => p.status === 'Tratamiento').length);

const selectedOwner = computed(() =>
  clients.value.find((c) => String(c.id) === String(form.ownerId)) ?? null
);

const getStatusClass = (status) => {
  if (status === 'Activo') return 'status-active';
  if (status === 'Tratamiento') return 'status-treatment';
  if (status === 'Observación') return 'status-observation';
  return '';
};

const parseWeightValue = (weight) => {
  if (weight == null || weight === '') return '';
  if (typeof weight === 'number') return weight;
  const match = String(weight).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : '';
};

const openEditModal = (patient) => {
  selectedPatient.value = patient;
  editForm.age = patient.age ?? '';
  editForm.weight = parseWeightValue(patient.weight);
  editForm.allergies = patient.allergies ?? '';
  Object.keys(editErrors).forEach((key) => delete editErrors[key]);
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  selectedPatient.value = null;
};

const openDeleteModal = (patient) => {
  selectedPatient.value = patient;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  selectedPatient.value = null;
};

const validateEditForm = () => {
  Object.keys(editErrors).forEach((key) => delete editErrors[key]);
  const age = Number(editForm.age);
  const weight = Number(editForm.weight);
  if (!Number.isFinite(age) || age < 0) editErrors.age = true;
  if (!Number.isFinite(weight) || weight <= 0) editErrors.weight = true;
  return Object.keys(editErrors).length === 0;
};

const submitEditForm = async () => {
  if (!selectedPatient.value) return;
  if (!validateEditForm()) {
    displayToast(t('clinicManagement.patients.updateForm.validationError'), 'error');
    return;
  }
  isUpdating.value = true;
  try {
    await patientStore.updatePatient(selectedPatient.value.id, {
      age: Number(editForm.age),
      weight: Number(editForm.weight),
      allergies: editForm.allergies || null
    });
    displayToast(t('clinicManagement.patients.updateForm.successMessage'), 'success');
    closeEditModal();
  } catch (error) {
    const apiMessage = error?.response?.data?.message;
    displayToast(apiMessage || t('clinicManagement.patients.updateForm.errorMessage'), 'error');
  } finally {
    isUpdating.value = false;
  }
};

const confirmDeletePatient = async () => {
  if (!selectedPatient.value) return;
  isDeleting.value = true;
  try {
    await patientStore.deletePatient(selectedPatient.value.id);
    displayToast(t('clinicManagement.patients.deleteConfirm.successMessage'), 'success');
    closeDeleteModal();
  } catch (error) {
    const message = error?.response?.status === 409
      ? t('clinicManagement.patients.deleteConfirm.hasRecordsMessage')
      : t('clinicManagement.patients.deleteConfirm.errorMessage');
    displayToast(message, 'error');
  } finally {
    isDeleting.value = false;
  }
};

const openModal = () => { Object.assign(form, getDefaultForm()); Object.keys(formErrors).forEach(k => delete formErrors[k]); showModal.value = true; };
const closeModal = () => { showModal.value = false; };

const validateForm = () => {
  Object.keys(formErrors).forEach(k => delete formErrors[k]);
  if (!form.name.trim()) formErrors.name = true;
  if (!form.species) formErrors.species = true;
  if (!form.breed.trim()) formErrors.breed = true;
  if (!form.ownerId) formErrors.ownerId = true;
  return Object.keys(formErrors).length === 0;
};

const displayToast = (msg, type) => {
  toastMessage.value = msg; toastType.value = type; showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const calcAgeYears = (dateStr) => {
  if (!dateStr) return 1;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.max(1, Math.floor(diff / 31557600000));
};

const viewClinicalHistory = (patient) => {
  router.push({ path: '/gestion-clinica/historial', query: { patientId: patient.id } });
};

const getPatientImage = (patient) => resolvePatientImageFromPatient(patient);

const onPatientImageError = (event, patient) => {
  event.target.src = resolvePatientImageOnError(patient);
};

const submitForm = async () => {
  if (!validateForm()) return;
  isSaving.value = true;
  const speciesLabel = `${form.species}${form.breed ? ` - ${form.breed}` : ''}`;
  const payload = {
    name: form.name.trim(),
    species: speciesLabel,
    age: calcAgeYears(form.birthDate),
    weight: parseFloat(form.weight) || 1,
    ownerId: form.ownerId,
    allergies: form.allergies || null
  };
  try {
    const newPatient = await patientStore.createPatient(payload);
    displayToast(t('clinicManagement.patients.registerForm.successMessage'), 'success');
    closeModal();
  } catch (e) {
    displayToast(t('clinicManagement.patients.registerForm.errorMessage'), 'error');
  } finally { isSaving.value = false; }
};
</script>

<template>
  <div class="pacientes-view">
    
    <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    
    <div class="page-header">
      <div class="header-main">
        <div class="header-icon-wrap">
          <i class="pi pi-heart" aria-hidden="true"></i>
        </div>
        <div class="view-info">
          <h1 class="view-title">{{ t('clinicManagement.patients.title') }}</h1>
          <p class="view-description">{{ t('clinicManagement.patients.description') }}</p>
        </div>
      </div>
      <button type="button" class="btn-primary" @click="openModal">
        <i class="pi pi-plus"></i>
        {{ t('clinicManagement.patients.register') }}
      </button>
    </div>

    <PageViewLoading v-if="isLoading" variant="cards" :card-count="3" />

    <div v-else class="status-cards-row">
      <div class="status-card card-info">
        <div class="card-header-row">
          <div class="icon-circle icon-info">
            <i class="pi pi-users"></i>
          </div>
          <p class="count-number text-info">{{ totalPatients }}</p>
        </div>
        <h3 class="card-title title-info">{{ t('clinicManagement.patients.statusCards.total.title') }}</h3>
        <p class="card-subtitle subtitle-info">{{ t('clinicManagement.patients.statusCards.total.subtitle') }}</p>
      </div>

      <div class="status-card card-success">
        <div class="card-header-row">
          <div class="icon-circle icon-success">
            <i class="pi pi-check-circle"></i>
          </div>
          <p class="count-number text-success">{{ activePatients }}</p>
        </div>
        <h3 class="card-title title-success">{{ t('clinicManagement.patients.statusCards.active.title') }}</h3>
        <p class="card-subtitle subtitle-success">{{ t('clinicManagement.patients.statusCards.active.subtitle') }}</p>
      </div>

      <div class="status-card card-warning">
        <div class="card-header-row">
          <div class="icon-circle icon-warning">
            <i class="pi pi-heart-fill"></i>
          </div>
          <p class="count-number text-warning">{{ treatmentPatients }}</p>
        </div>
        <h3 class="card-title title-warning">{{ t('clinicManagement.patients.statusCards.treatment.title') }}</h3>
        <p class="card-subtitle subtitle-warning">{{ t('clinicManagement.patients.statusCards.treatment.subtitle') }}</p>
      </div>
    </div>

    <div class="pacientes-card">
      <div class="card-header">
        <div class="card-header-left">
          <h2 class="section-title">{{ t('clinicManagement.patients.listTitle') }}</h2>
          <span class="results-chip">
            {{ t('clinicManagement.patients.resultsCount', { count: filteredPatients.length }) }}
          </span>
        </div>
      </div>

      <div class="filters-panel">
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="t('clinicManagement.patients.search')"
            class="search-input"
          />
        </div>
        <div class="filter-select-wrapper">
          <select v-model="filterStatus" class="filter-select">
            <option value="Todos">{{ t('clinicManagement.patients.allSpecies') }}</option>
            <option value="Activo">{{ t('clinicManagement.patients.status.Activo') }}</option>
            <option value="Tratamiento">{{ t('clinicManagement.patients.status.Tratamiento') }}</option>
          </select>
          <i class="pi pi-chevron-down select-icon" aria-hidden="true"></i>
        </div>
      </div>

      <PageViewLoading
        v-if="isLoading"
        variant="grid"
        :grid-items="6"
        :message="t('clinicManagement.patients.loading')"
      />

      <div v-else-if="filteredPatients.length > 0" class="patients-grid">
        <article class="patient-card" v-for="patient in filteredPatients" :key="patient.id">
          <div class="patient-card-header">
            <div class="patient-profile">
              <div class="patient-avatar-wrap">
                <img
                  :src="getPatientImage(patient)"
                  :alt="patient.name"
                  class="patient-image"
                  @error="onPatientImageError($event, patient)"
                />
              </div>
              <div class="patient-name-container">
                <h2 class="patient-name">{{ patient.name }}</h2>
                <span class="patient-id">{{ patient.code || patient.id }}</span>
              </div>
            </div>
            <span :class="['status-badge', getStatusClass(patient.status)]">
              {{ t(`clinicManagement.patients.status.${patient.status}`) }}
            </span>
          </div>

          <div v-if="patient.allergies" class="allergy-alert">
            <i class="pi pi-exclamation-triangle allergy-icon" aria-hidden="true"></i>
            <span><strong>{{ t('clinicManagement.patients.registerForm.allergies') }}:</strong> {{ patient.allergies }}</span>
          </div>

          <div class="patient-data-list">
            <div class="data-row">
              <span class="data-label"><i class="pi pi-tag data-icon" aria-hidden="true"></i> {{ t('clinicManagement.patients.fields.species') }}</span>
              <span class="data-value">{{ patient.species }}</span>
            </div>
            <div class="data-row">
              <span class="data-label"><i class="pi pi-calendar data-icon" aria-hidden="true"></i> {{ t('clinicManagement.patients.fields.age') }}</span>
              <span class="data-value">{{ patient.age }}</span>
            </div>
            <div class="data-row">
              <span class="data-label"><i class="pi pi-chart-line data-icon" aria-hidden="true"></i> {{ t('clinicManagement.patients.fields.weight') }}</span>
              <span class="data-value">{{ patient.weight }}</span>
            </div>
            <div class="data-row">
              <span class="data-label"><i class="pi pi-user data-icon" aria-hidden="true"></i> {{ t('clinicManagement.patients.fields.owner') }}</span>
              <span class="data-value">{{ patient.owner }}</span>
            </div>
          </div>

          <div class="patient-card-footer">
            <div class="patient-card-actions">
              <button type="button" class="action-btn action-view" @click="viewClinicalHistory(patient)">
                <span class="action-icon-wrap"><i class="pi pi-book"></i></span>
                <span class="action-label">{{ t('clinicManagement.patients.viewRecord') }}</span>
              </button>
              <button type="button" class="action-btn action-edit" @click="openEditModal(patient)">
                <span class="action-icon-wrap action-icon-wrap--edit"><i class="pi pi-pencil"></i></span>
                <span class="action-label">{{ t('clinicManagement.patients.editPatient') }}</span>
              </button>
              <button type="button" class="action-btn action-delete" @click="openDeleteModal(patient)">
                <span class="action-icon-wrap action-icon-wrap--delete"><i class="pi pi-trash"></i></span>
                <span class="action-label">{{ t('clinicManagement.patients.deletePatient') }}</span>
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon-wrap">
          <i class="pi pi-inbox"></i>
        </div>
        <h3 class="empty-title">{{ t('clinicManagement.patients.emptyState.title') }}</h3>
        <p class="empty-description">{{ t('clinicManagement.patients.emptyState.description') }}</p>
        <button type="button" class="btn-primary empty-action" @click="openModal">
          <i class="pi pi-plus"></i>
          {{ t('clinicManagement.patients.register') }}
        </button>
      </div>
    </div>

    
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container register-modal">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-heart" aria-hidden="true"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.patients.registerForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.patients.registerForm.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="register-form" @submit.prevent="submitForm">
            <div class="register-form-content">
              <div class="register-intro-card">
                <div class="register-intro-icon">
                  <i class="pi pi-heart-fill" aria-hidden="true"></i>
                </div>
                <p class="register-intro-text">{{ t('clinicManagement.patients.registerForm.subtitle') }}</p>
              </div>

              <section class="register-panel">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon"><i class="pi pi-heart" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.patients.registerForm.petInfo') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group" :class="{ 'has-error': formErrors.name }">
                    <label for="patient-name">{{ t('clinicManagement.patients.registerForm.name') }} *</label>
                    <input id="patient-name" type="text" v-model="form.name" :placeholder="t('clinicManagement.patients.registerForm.namePlaceholder')" />
                    <span v-if="formErrors.name" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                  </div>
                  <div class="form-group" :class="{ 'has-error': formErrors.species }">
                    <label for="patient-species">{{ t('clinicManagement.patients.registerForm.speciesSelect') }} *</label>
                    <select id="patient-species" v-model="form.species">
                      <option value="">{{ t('clinicManagement.patients.registerForm.speciesPlaceholder') }}</option>
                      <option value="Perro">{{ t('clinicManagement.patients.registerForm.speciesDog') }}</option>
                      <option value="Gato">{{ t('clinicManagement.patients.registerForm.speciesCat') }}</option>
                      <option value="Ave">{{ t('clinicManagement.patients.registerForm.speciesbird') }}</option>
                      <option value="Conejo">{{ t('clinicManagement.patients.registerForm.speciesRabbit') }}</option>
                      <option value="Otro">{{ t('clinicManagement.patients.registerForm.speciesOther') }}</option>
                    </select>
                    <span v-if="formErrors.species" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                  </div>
                  <div class="form-group" :class="{ 'has-error': formErrors.breed }">
                    <label for="patient-breed">{{ t('clinicManagement.patients.registerForm.breed') }} *</label>
                    <input id="patient-breed" type="text" v-model="form.breed" :placeholder="t('clinicManagement.patients.registerForm.breedPlaceholder')" />
                    <span v-if="formErrors.breed" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                  </div>
                  <div class="form-group">
                    <label for="patient-sex">{{ t('clinicManagement.patients.registerForm.sex') }}</label>
                    <select id="patient-sex" v-model="form.sex">
                      <option value="">{{ t('clinicManagement.patients.registerForm.sexPlaceholder') }}</option>
                      <option value="M">{{ t('clinicManagement.patients.registerForm.sexMale') }}</option>
                      <option value="H">{{ t('clinicManagement.patients.registerForm.sexFemale') }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="patient-birth">{{ t('clinicManagement.patients.registerForm.birthDate') }}</label>
                    <input id="patient-birth" type="date" v-model="form.birthDate" />
                  </div>
                  <div class="form-group">
                    <label for="patient-weight">{{ t('clinicManagement.patients.registerForm.weight') }}</label>
                    <input id="patient-weight" type="number" step="0.1" min="0" v-model="form.weight" :placeholder="t('clinicManagement.patients.registerForm.weightPlaceholder')" />
                  </div>
                </div>
              </section>

              <section class="register-panel">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon"><i class="pi pi-user" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.patients.registerForm.ownerInfo') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full" :class="{ 'has-error': formErrors.ownerId }">
                    <label for="patient-owner">{{ t('clinicManagement.patients.registerForm.ownerName') }} *</label>
                    <select id="patient-owner" v-model="form.ownerId">
                      <option value="">{{ t('clinicManagement.patients.registerForm.ownerNamePlaceholder') }}</option>
                      <option v-for="client in clients" :key="client.id" :value="client.id">
                        {{ client.fullName }} ({{ client.code }})
                      </option>
                    </select>
                    <div v-if="selectedOwner" class="selected-owner-preview">
                      <span class="selected-owner-avatar">{{ selectedOwner.fullName.charAt(0).toUpperCase() }}</span>
                      <span class="selected-owner-text">{{ selectedOwner.fullName }}</span>
                    </div>
                    <span v-if="formErrors.ownerId" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                  </div>
                </div>
              </section>

              <section class="register-panel register-panel-notes">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon register-panel-icon-warning"><i class="pi pi-exclamation-triangle" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.patients.registerForm.additionalSection') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full allergy-field">
                    <label for="patient-allergies">{{ t('clinicManagement.patients.registerForm.allergies') }}</label>
                    <input id="patient-allergies" type="text" v-model="form.allergies" :placeholder="t('clinicManagement.patients.registerForm.allergiesPlaceholder')" />
                  </div>
                  <div class="form-group span-full">
                    <label for="patient-notes">{{ t('clinicManagement.patients.registerForm.notes') }}</label>
                    <textarea id="patient-notes" v-model="form.notes" :placeholder="t('clinicManagement.patients.registerForm.notesPlaceholder')" rows="3"></textarea>
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-actions register-form-actions">
              <button type="button" class="btn-cancel" @click="closeModal">{{ t('clinicManagement.patients.registerForm.cancel') }}</button>
              <button type="submit" class="btn-submit" :disabled="isSaving">
                <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ isSaving ? t('clinicManagement.patients.registerForm.saving') : t('clinicManagement.patients.registerForm.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showEditModal && selectedPatient" class="modal-overlay" @click.self="closeEditModal">
        <div class="modal-container register-modal update-modal">
          <div class="modal-header">
            <div class="modal-header-icon modal-header-icon--edit"><i class="pi pi-pencil" aria-hidden="true"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.patients.updateForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.patients.updateForm.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeEditModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="register-form" @submit.prevent="submitEditForm">
            <div class="register-form-content">
              <div class="update-patient-summary">
                <div class="update-patient-avatar">
                  <img
                    :src="getPatientImage(selectedPatient)"
                    :alt="selectedPatient.name"
                    class="patient-image"
                    @error="onPatientImageError($event, selectedPatient)"
                  />
                </div>
                <div class="update-patient-copy">
                  <strong class="update-patient-name">{{ selectedPatient.name }}</strong>
                  <span class="update-patient-meta">{{ selectedPatient.code || selectedPatient.id }}</span>
                  <span class="update-patient-meta">{{ selectedPatient.species }}</span>
                  <span class="update-patient-meta">{{ selectedPatient.owner }}</span>
                </div>
              </div>

              <p class="update-readonly-hint">{{ t('clinicManagement.patients.updateForm.readOnlyHint') }}</p>

              <section class="register-panel">
                <div class="form-grid">
                  <div class="form-group" :class="{ 'has-error': editErrors.age }">
                    <label for="edit-patient-age">{{ t('clinicManagement.patients.fields.age') }}</label>
                    <input
                      id="edit-patient-age"
                      type="number"
                      min="0"
                      step="1"
                      v-model.number="editForm.age"
                    />
                    <span class="field-hint">{{ t('clinicManagement.patients.updateForm.ageHint') }}</span>
                    <span v-if="editErrors.age" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                  </div>
                  <div class="form-group" :class="{ 'has-error': editErrors.weight }">
                    <label for="edit-patient-weight">{{ t('clinicManagement.patients.registerForm.weight') }}</label>
                    <input
                      id="edit-patient-weight"
                      type="number"
                      min="0.1"
                      step="0.1"
                      v-model.number="editForm.weight"
                      :placeholder="t('clinicManagement.patients.registerForm.weightPlaceholder')"
                    />
                    <span class="field-hint">{{ t('clinicManagement.patients.updateForm.weightHint') }}</span>
                    <span v-if="editErrors.weight" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                  </div>
                  <div class="form-group span-full">
                    <label for="edit-patient-allergies">{{ t('clinicManagement.patients.registerForm.allergies') }}</label>
                    <input
                      id="edit-patient-allergies"
                      type="text"
                      v-model="editForm.allergies"
                      :placeholder="t('clinicManagement.patients.registerForm.allergiesPlaceholder')"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-actions register-form-actions">
              <button type="button" class="btn-cancel" @click="closeEditModal">
                {{ t('clinicManagement.patients.updateForm.cancel') }}
              </button>
              <button type="submit" class="btn-submit" :disabled="isUpdating">
                <i :class="isUpdating ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ isUpdating ? t('clinicManagement.patients.updateForm.saving') : t('clinicManagement.patients.updateForm.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showDeleteModal && selectedPatient" class="modal-overlay" @click.self="closeDeleteModal">
        <div class="modal-container delete-modal">
          <div class="modal-header">
            <div class="modal-header-icon modal-header-icon--danger"><i class="pi pi-trash" aria-hidden="true"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.patients.deleteConfirm.title') }}</h2>
              <p class="modal-subtitle">
                {{ t('clinicManagement.patients.deleteConfirm.message', { name: selectedPatient.name }) }}
              </p>
            </div>
            <button type="button" class="modal-close" @click="closeDeleteModal"><i class="pi pi-times"></i></button>
          </div>

          <p class="delete-warning">{{ t('clinicManagement.patients.deleteConfirm.warning') }}</p>

          <div class="modal-actions register-form-actions">
            <button type="button" class="btn-cancel" @click="closeDeleteModal">
              {{ t('clinicManagement.patients.deleteConfirm.cancel') }}
            </button>
            <button type="button" class="btn-danger" :disabled="isDeleting" @click="confirmDeletePatient">
              <i :class="isDeleting ? 'pi pi-spin pi-spinner' : 'pi pi-trash'"></i>
              {{ isDeleting ? t('clinicManagement.patients.deleteConfirm.deleting') : t('clinicManagement.patients.deleteConfirm.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.pacientes-view {
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
  background: var(--color-status-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
  color: var(--color-status-success-indicator);
  font-size: 20px;
}

.view-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-title {
  font-size: var(--font-title-size);
  line-height: 1.3;
  font-weight: var(--font-title-weight);
  color: var(--color-text-primary);
  margin: 0;
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

.card-info {
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 26%, transparent);
  background: var(--color-status-info-bg);
}
.icon-info { background-color: var(--color-status-info-indicator); }
.text-info { color: var(--color-status-info-text); }
.title-info { color: var(--color-status-info-text); }
.subtitle-info { color: color-mix(in srgb, var(--color-status-info-text) 82%, var(--color-text-secondary)); }

.card-success {
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 26%, transparent);
  background: var(--color-status-success-bg);
}
.icon-success { background-color: var(--color-status-success-indicator); }
.text-success { color: var(--color-status-success-text); }
.title-success { color: var(--color-status-success-text); }
.subtitle-success { color: color-mix(in srgb, var(--color-status-success-text) 82%, var(--color-text-secondary)); }

.card-warning {
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 26%, transparent);
  background: var(--color-status-warning-bg);
}
.icon-warning { background-color: var(--color-status-warning-indicator); }
.text-warning { color: var(--color-status-warning-text); }
.title-warning { color: var(--color-status-warning-text); }
.subtitle-warning { color: color-mix(in srgb, var(--color-status-warning-text) 82%, var(--color-text-secondary)); }

.pacientes-card {
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.pacientes-card > .card-header {
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
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.search-input::placeholder {
  color: var(--color-text-muted);
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
  box-sizing: border-box;
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
  color: var(--color-text-secondary);
  pointer-events: none;
  font-size: 12px;
}

.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 18px 22px 22px;
}

.patient-card {
  background: color-mix(in srgb, var(--color-background-main) 35%, var(--color-background-surface));
  border-radius: var(--radius-large);
  padding: 18px;
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

.patient-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--color-primary-main) 22%, var(--color-border-light));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--color-primary-main) 10%, transparent);
}

.patient-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.patient-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.patient-avatar-wrap {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  padding: 3px;
  background: color-mix(in srgb, var(--color-primary-main) 12%, var(--color-background-surface));
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, transparent);
  flex-shrink: 0;
}

.patient-image {
  width: 100%;
  height: 100%;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.status-badge {
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  flex-shrink: 0;
}

.status-active {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-text);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
}

.status-treatment {
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-text);
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 22%, transparent);
}

.status-observation {
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 22%, transparent);
}

.allergy-alert {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--color-status-danger-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 22%, transparent);
  border-left: 3px solid var(--color-status-danger-indicator);
  border-radius: var(--radius-standard);
  padding: 8px 12px;
  font-size: 13px;
  color: var(--color-status-danger-text);
}

.allergy-icon {
  color: var(--color-status-danger-indicator);
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.patient-name-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.patient-name {
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
  margin: 0;
}

.patient-id {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  background: var(--color-background-main);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-light);
}

.patient-data-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  display: flex;
  font-size: var(--font-body-main-size);
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
}

.data-row:last-child {
  border-bottom: none;
}

.data-label {
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.data-icon {
  font-size: 12px;
  color: var(--color-text-muted);
}

.data-value {
  color: var(--color-text-primary);
  font-weight: 500;
  text-align: right;
}

.patient-card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
}

.patient-card-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 6px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  background: var(--color-background-surface);
  cursor: pointer;
  min-height: 72px;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.15s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  border: 1px solid var(--color-border-light);
  flex-shrink: 0;
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 18%, transparent);
}

.action-icon-wrap--edit {
  color: var(--color-status-warning-text);
  background: var(--color-status-warning-bg);
  border-color: color-mix(in srgb, var(--color-status-warning-indicator) 20%, transparent);
}

.action-icon-wrap--delete {
  color: var(--color-status-danger-text);
  background: var(--color-status-danger-bg);
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 20%, transparent);
}

.action-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.2;
}

.action-view:hover {
  border-color: color-mix(in srgb, var(--color-primary-main) 24%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-primary-subtle) 60%, var(--color-background-surface));
}

.action-edit:hover {
  border-color: color-mix(in srgb, var(--color-status-warning-indicator) 24%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-status-warning-bg) 70%, var(--color-background-surface));
}

.action-delete:hover {
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 24%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-status-danger-bg) 70%, var(--color-background-surface));
}

.update-modal {
  max-width: 560px;
}

.delete-modal {
  max-width: 480px;
}

.modal-header-icon--edit {
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 22%, transparent);
}

.modal-header-icon--danger {
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 22%, transparent);
}

.update-patient-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  background: color-mix(in srgb, var(--color-background-main) 40%, var(--color-background-surface));
}

.update-patient-avatar {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid color-mix(in srgb, var(--color-primary-main) 16%, transparent);
}

.update-patient-avatar .patient-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.update-patient-copy {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.update-patient-name {
  font-size: var(--font-cardTitle-size);
  color: var(--color-text-primary);
}

.update-patient-meta {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.update-readonly-hint,
.field-hint {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.update-readonly-hint {
  padding: 0 2px;
}

.field-hint {
  margin-top: 6px;
}

.delete-warning {
  margin: 0 0 8px;
  padding: 12px 14px;
  border-radius: var(--radius-standard);
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-text);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 20%, transparent);
  font-size: 13px;
  line-height: 1.45;
}

.btn-danger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border: none;
  border-radius: var(--radius-standard);
  background: var(--color-status-danger-indicator);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-danger:hover:not(:disabled) {
  opacity: 0.92;
}

.btn-danger:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 32px;
  text-align: center;
}

.empty-icon-wrap {
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-subtle);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 16%, transparent);
  color: var(--color-primary-main);
  font-size: 26px;
  margin-bottom: 4px;
}

.empty-title {
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
  margin: 0;
}

.empty-description {
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  margin: 0;
  max-width: 360px;
}

.empty-action {
  margin-top: 8px;
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
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.toast-success {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-text);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 24%, transparent);
}

.toast-error {
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-text);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 24%, transparent);
}

.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(15, 23, 42, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
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

.register-modal {
  max-width: 560px;
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
  background: var(--color-status-success-bg);
  color: var(--color-status-success-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
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

.register-intro-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--color-status-success-indicator) 6%, var(--color-background-surface));
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 14%, var(--color-border-light));
  border-radius: var(--radius-large);
}

.register-intro-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-status-success-bg);
  color: var(--color-status-success-indicator);
  font-size: 17px;
}

.register-intro-text {
  margin: 0;
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.register-panel {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--color-background-main) 55%, var(--color-background-surface));
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
}

.register-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.register-panel-icon {
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

.register-panel-icon-warning {
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-indicator);
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

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.register-form .form-group input,
.register-form .form-group select,
.register-form .form-group textarea {
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

.register-form .form-group textarea {
  resize: vertical;
  min-height: 72px;
}

.register-form .form-group input:focus,
.register-form .form-group select:focus,
.register-form .form-group textarea:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.has-error input,
.has-error select {
  border-color: var(--color-status-danger-indicator);
}

.error-text {
  font-size: 12px;
  color: var(--color-status-danger-text);
  font-weight: 500;
}

.selected-owner-preview {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-full);
  background: var(--color-status-info-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 22%, transparent);
}

.selected-owner-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-status-info-indicator);
  color: var(--color-primary-contrastText);
  font-size: var(--font-body-caption-size);
  font-weight: 700;
  flex-shrink: 0;
}

.selected-owner-text {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-status-info-text);
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

.register-form-actions {
  margin-top: 0;
}

.btn-cancel {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-cancel:hover {
  background: var(--color-background-main);
  color: var(--color-text-primary);
}

.btn-submit {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-submit:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 28%, transparent);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .status-cards-row {
    grid-template-columns: 1fr;
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
  .register-form-content { padding: 16px 20px 8px; }
  .modal-actions { padding: 16px 20px; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group.span-full { grid-column: 1; }
  .filters-panel { margin: 16px 16px 0; }
  .patients-grid { padding: 16px; grid-template-columns: 1fr; }
  .patient-card-actions { grid-template-columns: 1fr; }
  .action-btn { flex-direction: row; justify-content: flex-start; min-height: auto; padding: 12px 14px; }
  .update-patient-summary { flex-direction: column; align-items: flex-start; }
}
</style>
