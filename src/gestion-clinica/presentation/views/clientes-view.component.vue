<script setup>
import { ref, reactive, computed, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { useClientStore } from '../../application/store/client.store.js';
import { usePatientStore } from '../../application/store/patient.store.js';
import { useAgendaStore } from '@/agenda-veterinaria/application/agenda.store.js';
import { AppointmentService } from '../../infrastructure/services/appointment.service.js';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';

const { t } = useI18n();
const clientStore = useClientStore();
const patientStore = usePatientStore();
const agendaStore = useAgendaStore();
const appointmentService = new AppointmentService();

const searchQuery = ref('');
const filterStatus = ref('Todos');
const showModal = ref(false);
const showScheduleModal = ref(false);
const selectedClient = ref(null);
const isScheduling = ref(false);
const isLoadingPets = ref(false);
const scheduleErrors = reactive({});
const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const isPageLoading = ref(true);
const formErrors = reactive({});

const getDefaultForm = () => ({
  fullName: '',
  documentId: '',
  phone: '',
  email: '',
  address: ''
});
const form = reactive(getDefaultForm());

const appointmentTypes = [
  'Consulta General',
  'Vacunación',
  'Control',
  'Cirugía',
  'Desparasitación',
  'Dermatología'
];

const getDefaultScheduleForm = () => ({
  patientId: '',
  date: '',
  timeStart: '',
  type: 'Consulta General'
});
const scheduleForm = reactive(getDefaultScheduleForm());

const toIsoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const addHourToTime = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const end = new Date(2000, 0, 1, hours, minutes);
  end.setHours(end.getHours() + 1);
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
};

onActivated(async () => {
  const needsLoader = !clientStore.hasCachedClients || !patientStore.hasCachedPatients;
  if (needsLoader) isPageLoading.value = true;
  try {
    await Promise.all([
      clientStore.fetchClients(),
      patientStore.fetchPatients()
    ]);
  } catch (error) {
    displayToast(t('clinicManagement.clients.registerForm.errorMessage'), 'error');
  } finally {
    isPageLoading.value = false;
  }
});

const clientPets = computed(() => {
  if (!selectedClient.value) return [];
  const clientId = Number(selectedClient.value.id);
  return patientStore.patients.filter((pet) => Number(pet.ownerId) === clientId);
});

const selectedPet = computed(() =>
  clientPets.value.find((pet) => String(pet.id) === String(scheduleForm.patientId)) ?? null
);

const getStatusClass = (status) => {
  if (status === 'Activo') return 'badge-success';
  if (status === 'Inactivo') return 'badge-warning';
  return 'badge-success';
};

const getInitials = (fullName) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? '?').toUpperCase();
};

const getAvatarTone = (id) => {
  const tones = ['tone-primary', 'tone-info', 'tone-success', 'tone-warm'];
  return tones[Number(id) % tones.length];
};

const openModal = () => { Object.assign(form, getDefaultForm()); Object.keys(formErrors).forEach(k => delete formErrors[k]); showModal.value = true; };
const closeModal = () => { showModal.value = false; };

const openScheduleModal = async (client) => {
  selectedClient.value = client;
  Object.assign(scheduleForm, getDefaultScheduleForm());
  Object.keys(scheduleErrors).forEach((key) => delete scheduleErrors[key]);
  scheduleForm.date = toIsoDate(new Date());
  showScheduleModal.value = true;

  isLoadingPets.value = true;
  try {
    if (!patientStore.patients.length) {
      await patientStore.fetchPatients();
    }
    const pets = patientStore.patients.filter((pet) => Number(pet.ownerId) === Number(client.id));
    scheduleForm.patientId = pets[0]?.id ?? '';
  } finally {
    isLoadingPets.value = false;
  }
};

const closeScheduleModal = () => {
  showScheduleModal.value = false;
  selectedClient.value = null;
};

const validateScheduleForm = () => {
  Object.keys(scheduleErrors).forEach((key) => delete scheduleErrors[key]);
  if (!scheduleForm.patientId) scheduleErrors.patientId = true;
  if (!scheduleForm.date) scheduleErrors.date = true;
  if (!scheduleForm.timeStart) scheduleErrors.timeStart = true;
  if (!scheduleForm.type) scheduleErrors.type = true;
  return Object.keys(scheduleErrors).length === 0;
};

const submitScheduleForm = async () => {
  if (!selectedClient.value || !validateScheduleForm()) {
    displayToast(t('clinicManagement.clients.scheduleForm.errorMessage'), 'error');
    return;
  }

  const pet = selectedPet.value;
  if (!pet) {
    displayToast(t('clinicManagement.clients.scheduleForm.noPets'), 'error');
    return;
  }

  isScheduling.value = true;
  try {
    const timeEnd = addHourToTime(scheduleForm.timeStart);

    await appointmentService.createAppointment({
      patientId: scheduleForm.patientId,
      clientId: selectedClient.value.id,
      date: scheduleForm.date,
      startTime: scheduleForm.timeStart,
      endTime: timeEnd,
      type: scheduleForm.type
    });

    await agendaStore.fetchCitas({ force: true });
    displayToast(
      t('clinicManagement.clients.scheduleForm.successMessage', { name: selectedClient.value.fullName }),
      'success'
    );
    closeScheduleModal();
  } catch {
    displayToast(t('clinicManagement.clients.scheduleForm.errorMessage'), 'error');
  } finally {
    isScheduling.value = false;
  }
};

const validateForm = () => {
  Object.keys(formErrors).forEach(k => delete formErrors[k]);
  if (!form.fullName.trim()) formErrors.fullName = true;
  if (!form.documentId.trim()) formErrors.documentId = true;
  if (!form.phone.trim()) formErrors.phone = true;
  return Object.keys(formErrors).length === 0;
};

const displayToast = (msg, type) => {
  toastMessage.value = msg; toastType.value = type; showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const filteredClients = computed(() => {
  return clientStore.clients.filter(client => {
    let match = true;
    
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase();
      const nameMatch = client.fullName.toLowerCase().includes(q);
      const docMatch = client.documentId.toLowerCase().includes(q);
      const phoneMatch = client.phone.toLowerCase().includes(q);
      match = match && (nameMatch || docMatch || phoneMatch);
    }
    
    if (filterStatus.value && filterStatus.value !== 'Todos') {
      match = match && (client.status === filterStatus.value);
    }
    
    return match;
  });
});

const submitForm = async () => {
  if (!validateForm()) return;
  
  try {
    await clientStore.addClient({ ...form });
    displayToast(t('clinicManagement.clients.registerForm.successMessage'), 'success');
    closeModal();
  } catch (e) {
    displayToast(t('clinicManagement.clients.registerForm.errorMessage'), 'error');
  }
};
</script>

<template>
  <div class="clientes-view">
        <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

        <div class="page-header">
      <div class="header-main">
        <div class="header-icon-wrap">
          <i class="pi pi-users" aria-hidden="true"></i>
        </div>
        <div class="view-info">
          <h1 class="view-title">{{ t('clinicManagement.clients.title') }}</h1>
          <p class="view-description">{{ t('clinicManagement.clients.description') }}</p>
        </div>
      </div>
      <button type="button" class="btn-primary" @click="openModal">
        <i class="pi pi-user-plus"></i>
        {{ t('clinicManagement.clients.register') }}
      </button>
    </div>

        <PageViewLoading v-if="isPageLoading" variant="cards" :card-count="3" />

        <div v-else class="status-cards-row">
            <div class="status-card card-info">
        <div class="card-header-row">
          <div class="icon-circle icon-info">
            <i class="pi pi-users"></i>
          </div>
          <p class="count-number text-info">{{ clientStore.totalClients }}</p>
        </div>
        <h3 class="card-title title-info">{{ t('clinicManagement.clients.statusCards.total.title') }}</h3>
        <p class="card-subtitle subtitle-info">{{ t('clinicManagement.clients.statusCards.total.subtitle') }}</p>
      </div>

            <div class="status-card card-success">
        <div class="card-header-row">
          <div class="icon-circle icon-success">
            <i class="pi pi-check-circle"></i>
          </div>
          <p class="count-number text-success">{{ clientStore.activeClients }}</p>
        </div>
        <h3 class="card-title title-success">{{ t('clinicManagement.clients.statusCards.active.title') }}</h3>
        <p class="card-subtitle subtitle-success">{{ t('clinicManagement.clients.statusCards.active.subtitle') }}</p>
      </div>

            <div class="status-card card-primary">
        <div class="card-header-row">
          <div class="icon-circle icon-primary">
            <i class="pi pi-star"></i>
          </div>
          <p class="count-number text-primary">{{ clientStore.newClients }}</p>
        </div>
        <h3 class="card-title title-primary">{{ t('clinicManagement.clients.statusCards.new.title') }}</h3>
        <p class="card-subtitle subtitle-primary">{{ t('clinicManagement.clients.statusCards.new.subtitle') }}</p>
      </div>
    </div>

        <div class="clientes-card">
      <div class="card-header">
        <div class="card-header-left">
          <h2 class="section-title">{{ t('clinicManagement.clients.listTitle') }}</h2>
          <span class="results-chip">
            {{ t('clinicManagement.clients.resultsCount', { count: filteredClients.length }) }}
          </span>
        </div>
      </div>

      <div class="filters-panel">
        <div class="search-box">
          <i class="pi pi-search search-icon"></i>
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="t('clinicManagement.clients.search')"
            class="search-input"
          />
        </div>
        <div class="filter-select-wrapper">
          <select v-model="filterStatus" class="filter-select">
            <option value="Todos">{{ t('clinicManagement.clients.allStatuses') }}</option>
            <option value="Activo">{{ t('clinicManagement.clients.status.Activo') }}</option>
            <option value="Inactivo">{{ t('clinicManagement.clients.status.Inactivo') }}</option>
          </select>
          <i class="pi pi-chevron-down select-icon" aria-hidden="true"></i>
        </div>
      </div>

        <div class="clients-list-panel">
          <PageViewLoading
            v-if="isPageLoading"
            variant="grid"
            :grid-items="6"
            :message="t('clinicManagement.clients.loading')"
          />

          <div v-else-if="filteredClients.length > 0" class="clients-grid">
            <article
              v-for="client in filteredClients"
              :key="client.id"
              class="client-card"
            >
              <div class="client-card-header">
                <div class="client-profile">
                  <div class="client-avatar-wrap" :class="getAvatarTone(client.id)">
                    <span class="client-avatar-initials">{{ getInitials(client.fullName) }}</span>
                  </div>
                  <div class="client-name-block">
                    <h3 class="client-name">{{ client.fullName }}</h3>
                    <span class="client-doc-chip">
                      <i class="pi pi-id-card" aria-hidden="true"></i>
                      {{ client.documentId }}
                    </span>
                  </div>
                </div>
                <span :class="['status-badge', getStatusClass(client.status)]">
                  {{ t(`clinicManagement.clients.status.${client.status}`) }}
                </span>
              </div>

              <div class="client-data-list">
                <div class="data-row">
                  <span class="data-label">
                    <i class="pi pi-phone data-icon" aria-hidden="true"></i>
                    {{ t('clinicManagement.clients.columns.contact') }}
                  </span>
                  <span class="data-value">{{ client.phone }}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">
                    <i class="pi pi-envelope data-icon" aria-hidden="true"></i>
                    {{ t('clinicManagement.clients.registerForm.email') }}
                  </span>
                  <span class="data-value data-value--truncate">{{ client.email || '—' }}</span>
                </div>
                <div class="data-row">
                  <span class="data-label">
                    <i class="pi pi-heart data-icon data-icon--pets" aria-hidden="true"></i>
                    {{ t('clinicManagement.clients.columns.pets') }}
                  </span>
                  <span class="data-value">
                    <span class="pets-inline-badge">{{ client.petsCount }}</span>
                  </span>
                </div>
                <div class="data-row">
                  <span class="data-label">
                    <i class="pi pi-calendar data-icon" aria-hidden="true"></i>
                    {{ t('clinicManagement.clients.columns.lastVisit') }}
                  </span>
                  <span class="data-value">{{ client.lastVisitAt || '—' }}</span>
                </div>
              </div>

              <div class="client-card-footer">
                <button
                  type="button"
                  class="action-btn action-schedule"
                  :title="t('clinicManagement.clients.actions.schedule')"
                  :aria-label="t('clinicManagement.clients.actions.schedule')"
                  @click="openScheduleModal(client)"
                >
                  <span class="action-icon-wrap" aria-hidden="true">
                    <i class="pi pi-calendar-plus"></i>
                  </span>
                  <span class="action-label">{{ t('clinicManagement.clients.actions.schedule') }}</span>
                </button>
              </div>
            </article>
          </div>

          <div v-else class="empty-state empty-state--panel">
            <div class="empty-icon-wrap">
              <i class="pi pi-inbox"></i>
            </div>
            <h3 class="empty-title">{{ t('clinicManagement.clients.emptyState.title') }}</h3>
            <p class="empty-description">{{ t('clinicManagement.clients.emptyState.description') }}</p>
            <button type="button" class="btn-primary empty-action" @click="openModal">
              <i class="pi pi-user-plus"></i>
              {{ t('clinicManagement.clients.register') }}
            </button>
          </div>

          <div v-if="filteredClients.length > 0 && !isPageLoading" class="list-footer">
            <p class="list-footer-text">
              {{ t('clinicManagement.clients.pagination.showing', { from: 1, to: filteredClients.length, total: filteredClients.length }) }}
            </p>
          </div>
        </div>
    </div>

        <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container register-modal">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-user-plus"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.clients.registerForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.clients.registerForm.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="register-form" @submit.prevent="submitForm">
            <div class="register-form-content">
              <div class="register-intro-card">
                <div class="register-intro-icon">
                  <i class="pi pi-id-card" aria-hidden="true"></i>
                </div>
                <p class="register-intro-text">{{ t('clinicManagement.clients.registerForm.subtitle') }}</p>
              </div>

              <section class="register-panel">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon"><i class="pi pi-user" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.clients.registerForm.personalInfo') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full" :class="{ 'has-error': formErrors.fullName }">
                    <label for="register-full-name">{{ t('clinicManagement.clients.registerForm.fullName') }} *</label>
                    <input
                      id="register-full-name"
                      type="text"
                      v-model="form.fullName"
                      :placeholder="t('clinicManagement.clients.registerForm.fullNamePlaceholder')"
                    />
                    <span v-if="formErrors.fullName" class="error-text">{{ t('clinicManagement.clients.registerForm.required') }}</span>
                  </div>
                  <div class="form-group" :class="{ 'has-error': formErrors.documentId }">
                    <label for="register-document-id">{{ t('clinicManagement.clients.registerForm.documentId') }} *</label>
                    <input
                      id="register-document-id"
                      type="text"
                      v-model="form.documentId"
                      :placeholder="t('clinicManagement.clients.registerForm.documentIdPlaceholder')"
                    />
                    <span v-if="formErrors.documentId" class="error-text">{{ t('clinicManagement.clients.registerForm.required') }}</span>
                  </div>
                  <div class="form-group">
                    <span class="field-label">{{ t('clinicManagement.clients.registerForm.status') }}</span>
                    <div class="status-default-badge">
                      <span class="status-default-pill">
                        <i class="pi pi-check-circle" aria-hidden="true"></i>
                        {{ t('clinicManagement.clients.registerForm.statusDefaultActive') }}
                      </span>
                      <p class="status-auto-hint">{{ t('clinicManagement.clients.registerForm.statusAutoHint') }}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section class="register-panel">
                <h3 class="register-panel-title">
                  <span class="register-panel-icon"><i class="pi pi-phone" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.clients.registerForm.contactInfo') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group" :class="{ 'has-error': formErrors.phone }">
                    <label for="register-phone">{{ t('clinicManagement.clients.registerForm.phone') }} *</label>
                    <input
                      id="register-phone"
                      type="tel"
                      v-model="form.phone"
                      :placeholder="t('clinicManagement.clients.registerForm.phonePlaceholder')"
                    />
                    <span v-if="formErrors.phone" class="error-text">{{ t('clinicManagement.clients.registerForm.required') }}</span>
                  </div>
                  <div class="form-group">
                    <label for="register-email">{{ t('clinicManagement.clients.registerForm.email') }}</label>
                    <input
                      id="register-email"
                      type="email"
                      v-model="form.email"
                      :placeholder="t('clinicManagement.clients.registerForm.emailPlaceholder')"
                    />
                  </div>
                  <div class="form-group span-full">
                    <label for="register-address">{{ t('clinicManagement.clients.registerForm.address') }}</label>
                    <input
                      id="register-address"
                      type="text"
                      v-model="form.address"
                      :placeholder="t('clinicManagement.clients.registerForm.addressPlaceholder')"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-actions register-form-actions">
              <button type="button" class="btn-cancel" @click="closeModal">{{ t('clinicManagement.clients.registerForm.cancel') }}</button>
              <button type="submit" class="btn-submit" :disabled="clientStore.loading">
                <i :class="clientStore.loading ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ clientStore.loading ? t('clinicManagement.clients.registerForm.saving') : t('clinicManagement.clients.registerForm.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showScheduleModal && selectedClient" class="modal-overlay" @click.self="closeScheduleModal">
        <div class="modal-container schedule-modal">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-calendar-plus"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.clients.scheduleForm.title') }}</h2>
              <p class="modal-subtitle">
                {{ t('clinicManagement.clients.scheduleForm.subtitle', { name: selectedClient.fullName }) }}
              </p>
            </div>
            <button type="button" class="modal-close" @click="closeScheduleModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="schedule-form" @submit.prevent="submitScheduleForm">
            <div class="schedule-form-content">
              <div class="schedule-client-card">
                <div class="schedule-client-icon">
                  <i class="pi pi-user" aria-hidden="true"></i>
                </div>
                <div class="schedule-client-info">
                  <span class="schedule-client-label">{{ t('clinicManagement.clients.scheduleForm.client') }}</span>
                  <strong class="schedule-client-name">{{ selectedClient.fullName }}</strong>
                </div>
              </div>

              <section class="schedule-panel">
                <h3 class="schedule-panel-title">
                  <span class="schedule-panel-icon"><i class="pi pi-heart" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.clients.scheduleForm.patientName') }}
                </h3>
                <div class="form-group" :class="{ 'has-error': scheduleErrors.patientId }">
                  <label class="visually-hidden" for="schedule-patient-select">
                    {{ t('clinicManagement.clients.scheduleForm.patientName') }}
                  </label>
                  <select
                    id="schedule-patient-select"
                    v-model="scheduleForm.patientId"
                    :disabled="isLoadingPets || clientPets.length === 0"
                  >
                    <option value="">
                      {{ isLoadingPets
                        ? t('clinicManagement.clients.scheduleForm.loadingPets')
                        : t('clinicManagement.clients.scheduleForm.selectPet') }}
                    </option>
                    <option v-for="pet in clientPets" :key="pet.id" :value="pet.id">
                      {{ pet.name }} — {{ pet.species }}
                    </option>
                  </select>
                  <div v-if="selectedPet" class="selected-pet-preview">
                    <span class="selected-pet-avatar">{{ selectedPet.name.charAt(0).toUpperCase() }}</span>
                    <span class="selected-pet-text">{{ selectedPet.name }} · {{ selectedPet.species }}</span>
                  </div>
                  <span v-if="!isLoadingPets && clientPets.length === 0" class="schedule-hint schedule-hint-warning">
                    <i class="pi pi-info-circle"></i>
                    {{ t('clinicManagement.clients.scheduleForm.noPets') }}
                  </span>
                  <span v-if="scheduleErrors.patientId" class="error-text">
                    {{ t('clinicManagement.clients.registerForm.required') }}
                  </span>
                </div>
              </section>

              <section class="schedule-panel">
                <h3 class="schedule-panel-title">
                  <span class="schedule-panel-icon"><i class="pi pi-calendar" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.clients.scheduleForm.datetimeSection') }}
                </h3>
                <div class="form-grid schedule-datetime-grid">
                  <div class="form-group" :class="{ 'has-error': scheduleErrors.date }">
                    <label for="schedule-date">{{ t('clinicManagement.clients.scheduleForm.date') }} *</label>
                    <input id="schedule-date" v-model="scheduleForm.date" type="date" class="schedule-input" />
                    <span v-if="scheduleErrors.date" class="error-text">
                      {{ t('clinicManagement.clients.registerForm.required') }}
                    </span>
                  </div>
                  <div class="form-group" :class="{ 'has-error': scheduleErrors.timeStart }">
                    <label for="schedule-time">{{ t('clinicManagement.clients.scheduleForm.time') }} *</label>
                    <input id="schedule-time" v-model="scheduleForm.timeStart" type="time" class="schedule-input" />
                    <span v-if="scheduleErrors.timeStart" class="error-text">
                      {{ t('clinicManagement.clients.registerForm.required') }}
                    </span>
                  </div>
                </div>
              </section>

              <section class="schedule-panel">
                <h3 class="schedule-panel-title">
                  <span class="schedule-panel-icon"><i class="pi pi-tag" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.clients.scheduleForm.type') }}
                </h3>
                <div class="form-group" :class="{ 'has-error': scheduleErrors.type }">
                  <div class="type-pills" role="group" :aria-label="t('clinicManagement.clients.scheduleForm.type')">
                    <button
                      v-for="appointmentType in appointmentTypes"
                      :key="appointmentType"
                      type="button"
                      class="type-pill"
                      :class="{ active: scheduleForm.type === appointmentType }"
                      @click="scheduleForm.type = appointmentType"
                    >
                      {{ t(`agenda.types.${appointmentType}`) }}
                    </button>
                  </div>
                  <span v-if="scheduleErrors.type" class="error-text">
                    {{ t('clinicManagement.clients.registerForm.required') }}
                  </span>
                </div>
              </section>
            </div>

            <div class="modal-actions schedule-form-actions">
              <button type="button" class="btn-cancel" @click="closeScheduleModal">
                {{ t('clinicManagement.clients.registerForm.cancel') }}
              </button>
              <button type="submit" class="btn-submit" :disabled="isScheduling || isLoadingPets || clientPets.length === 0">
                <i :class="isScheduling ? 'pi pi-spin pi-spinner' : 'pi pi-calendar-plus'"></i>
                {{ isScheduling ? t('clinicManagement.clients.scheduleForm.saving') : t('clinicManagement.clients.scheduleForm.confirm') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.clientes-view {
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
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.status-card:hover {
  transform: translateY(-1px);
  box-shadow:
    var(--shadow-card),
    0 6px 18px color-mix(in srgb, var(--color-primary-main) 8%, transparent);
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

.card-primary {
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 26%, transparent);
  background: var(--color-primary-subtle);
}
.icon-primary { background-color: var(--color-primary-main); }
.text-primary { color: var(--color-primary-main); }
.title-primary { color: var(--color-text-primary); }
.subtitle-primary { color: var(--color-text-secondary); }

.card-success {
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 26%, transparent);
  background: var(--color-status-success-bg);
}
.icon-success { background-color: var(--color-status-success-indicator); }
.text-success { color: var(--color-status-success-text); }
.title-success { color: var(--color-status-success-text); }
.subtitle-success { color: color-mix(in srgb, var(--color-status-success-text) 82%, var(--color-text-secondary)); }

.clientes-card {
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.card-header {
  padding: 22px 22px 0;
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
  color: var(--color-text-muted);
  pointer-events: none;
  font-size: 11px;
}

.clients-list-panel {
  padding: 0 0 4px;
}

.clients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding: 18px 22px 8px;
}

.client-card {
  background: color-mix(in srgb, var(--color-background-main) 32%, var(--color-background-surface));
  border-radius: var(--radius-large);
  padding: 18px;
  border: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

.client-card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--color-primary-main) 22%, var(--color-border-light));
  box-shadow: 0 8px 20px color-mix(in srgb, var(--color-primary-main) 10%, transparent);
}

.client-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
}

.client-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.client-avatar-wrap {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid var(--color-background-surface);
  box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 12%, var(--color-border-light));
}

.client-avatar-initials {
  font-size: var(--font-body-main-size);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.client-avatar-wrap.tone-primary {
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
}

.client-avatar-wrap.tone-info {
  color: var(--color-status-info-text);
  background: var(--color-status-info-bg);
}

.client-avatar-wrap.tone-success {
  color: var(--color-status-success-text);
  background: var(--color-status-success-bg);
}

.client-avatar-wrap.tone-warm {
  color: var(--color-status-warning-text);
  background: var(--color-status-warning-bg);
}

.client-name-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.client-name {
  margin: 0;
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.client-doc-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  width: fit-content;
  max-width: 100%;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-text-secondary);
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
}

.client-doc-chip .pi {
  font-size: 11px;
  color: var(--color-text-muted);
}

.client-data-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--radius-standard);
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.data-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.data-icon {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
}

.data-icon--pets {
  color: var(--color-status-success-indicator);
  background: color-mix(in srgb, var(--color-status-success-indicator) 12%, var(--color-background-surface));
}

.data-value {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: right;
}

.data-value--truncate {
  max-width: 58%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pets-inline-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-main-size);
  font-weight: 700;
  color: var(--color-status-success-text);
  background: var(--color-status-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 20%, transparent);
}

.client-card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-light);
}

.list-footer {
  padding: 12px 22px 18px;
  border-top: 1px solid var(--color-border-light);
  background: color-mix(in srgb, var(--color-background-main) 50%, var(--color-background-surface));
}

.list-footer-text {
  margin: 0;
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.empty-state--panel {
  margin: 18px 22px 22px;
  padding: 40px 24px;
  border-radius: var(--radius-large);
  border: 1px dashed color-mix(in srgb, var(--color-primary-main) 24%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-primary-subtle) 35%, var(--color-background-surface));
}

.status-badge {
  padding: 5px 10px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}

.badge-warning {
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-text);
}

.badge-success {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-text);
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  width: 100%;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, var(--color-border-light));
  border-radius: var(--radius-standard);
  background: color-mix(in srgb, var(--color-primary-subtle) 55%, var(--color-background-surface));
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
}

.action-btn:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--color-primary-main) 28%, var(--color-border-light));
  background: var(--color-primary-subtle);
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
  background: var(--color-background-surface);
  flex-shrink: 0;
}

.action-schedule .action-icon-wrap {
  color: var(--color-primary-main);
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 18%, transparent);
}

.action-label {
  font-size: var(--font-body-main-size);
  font-weight: 500;
  color: var(--color-text-accent);
}

.schedule-form {
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0;
}

.register-form {
  display: flex;
  flex-direction: column;
  padding: 0;
  gap: 0;
}

.schedule-modal,
.register-modal {
  max-width: 560px;
}

.schedule-form-content,
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
  background: color-mix(in srgb, var(--color-primary-main) 6%, var(--color-background-surface));
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 14%, var(--color-border-light));
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
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  font-size: 17px;
}

.register-intro-text {
  margin: 0;
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.schedule-panel,
.register-panel {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--color-background-main) 55%, var(--color-background-surface));
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
}

.schedule-panel-title,
.register-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.schedule-panel-icon,
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

.register-form .form-group label,
.register-form .field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.register-form .field-label {
  display: block;
  margin-bottom: 2px;
}

.register-form .form-group input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.register-form .form-group input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.register-form .has-error input {
  border-color: var(--color-status-danger-indicator);
}

.status-default-badge {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.status-default-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  background: var(--color-status-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 28%, transparent);
  color: var(--color-status-success-text);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
}

.status-default-pill i {
  color: var(--color-status-success-indicator);
  font-size: 14px;
}

.status-auto-hint {
  margin: 0;
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  line-height: 1.45;
  max-width: 420px;
}

.schedule-client-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: color-mix(in srgb, var(--color-primary-main) 6%, var(--color-background-surface));
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 16%, var(--color-border-light));
  border-radius: var(--radius-large);
}

.schedule-client-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  font-size: 18px;
}

.schedule-client-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.schedule-client-label {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.schedule-client-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.schedule-datetime-grid {
  gap: 14px;
}

.schedule-form .schedule-input {
  width: 100%;
  min-height: 42px;
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.schedule-form .schedule-input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.has-error .schedule-input {
  border-color: var(--color-status-danger-indicator);
}

.selected-pet-preview {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-full);
  background: var(--color-status-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
}

.selected-pet-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-status-success-indicator);
  color: var(--color-primary-contrastText);
  font-size: var(--font-body-caption-size);
  font-weight: 700;
  flex-shrink: 0;
}

.selected-pet-text {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-status-success-text);
}

.type-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.type-pill {
  padding: 8px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.type-pill:hover {
  border-color: color-mix(in srgb, var(--color-primary-main) 28%, var(--color-border-light));
  color: var(--color-text-primary);
  background: color-mix(in srgb, var(--color-primary-main) 5%, var(--color-background-surface));
}

.type-pill.active {
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 28%, transparent);
  color: var(--color-primary-main);
  box-shadow: 0 1px 2px color-mix(in srgb, var(--color-primary-main) 12%, transparent);
}

.schedule-hint {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 10px;
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.schedule-hint-warning {
  padding: 10px 12px;
  border-radius: var(--radius-standard);
  background: var(--color-status-warning-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 22%, transparent);
  color: var(--color-status-warning-text);
}

.schedule-hint-warning i {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--color-status-warning-indicator);
}

.schedule-form-actions,
.register-form-actions {
  margin-top: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.schedule-form .form-group select {
  padding: 10px 32px 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  font-size: var(--font-body-main-size);
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.schedule-form .form-group select:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.schedule-form .form-group select:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  background: color-mix(in srgb, var(--color-background-main) 80%, var(--color-background-surface));
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 56px 24px;
  color: var(--color-text-secondary);
}

.loading-icon {
  font-size: 2rem;
  color: var(--color-primary-main);
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
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
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
  background: var(--color-primary-main);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary-contrastText);
  font-size: 20px;
  flex-shrink: 0;
}

.modal-title { font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.modal-subtitle { font-size: 13px; color: var(--color-text-secondary); margin: 4px 0 0 0; }
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
  transition: all 0.2s;
}
.modal-close:hover { background: var(--color-background-main); color: var(--color-text-primary); }

.section-label i { color: var(--color-primary-main); font-size: 15px; }

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
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
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-submit:hover:not(:disabled) {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 28%, transparent);
}

.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

.modal-body { padding: 24px 28px; }

.form-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-light) 80%, transparent);
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.section-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
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

.form-group.span-full { grid-column: 1 / -1; }

.form-group label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 10px 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 8px;
  font-size: 14px;
  color: var(--color-text-primary);
  background: var(--color-background-surface);
  outline: none;
  transition: all 0.2s;
  width: 100%;
  box-sizing: border-box;
}

.form-group select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
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
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--color-background-main);
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

.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

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
  .clients-grid {
    grid-template-columns: 1fr;
    padding: 16px;
  }

  .client-name {
    white-space: normal;
  }

  .data-value--truncate {
    max-width: 50%;
  }

  .modal-overlay { padding: 12px; }
  .modal-container { max-height: 95vh; }
  .modal-header { padding: 16px 20px; }
  .modal-body { padding: 16px 20px; }
  .schedule-form-content,
  .register-form-content { padding: 16px 20px 8px; gap: 12px; }
  .schedule-form-actions,
  .register-form-actions { padding: 16px 20px; }
  .schedule-datetime-grid { grid-template-columns: 1fr; }
  .type-pills { gap: 6px; }
  .type-pill { flex: 1 1 calc(50% - 6px); text-align: center; min-width: 0; }
  .modal-actions { padding: 16px 20px; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group.span-full { grid-column: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .status-card,
  .client-card,
  .action-btn {
    transition: none;
  }

  .status-card:hover,
  .client-card:hover,
  .action-btn:hover {
    transform: none;
  }
}
</style>
