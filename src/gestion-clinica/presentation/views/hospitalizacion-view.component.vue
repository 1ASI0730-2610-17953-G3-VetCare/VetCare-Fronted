<script setup>
import { ref, computed, onMounted, onActivated } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import {
  pendingTasksState,
  getTodayIso,
  isTaskToday,
  sortTasksByPriority,
  formatTaskTime
} from '../../infrastructure/hospitalization-task.utils.js';
import { HospitalizationService } from '../../infrastructure/services/hospitalization.service.js';
import { usePatientStore } from '../../application/store/patient.store.js';
import { useHospitalizationStore } from '../../application/store/hospitalization.store.js';
import { mapAdmissionFromApi } from '../../infrastructure/hospitalization.mapper.js';
import { resolvePatientImage } from '../../infrastructure/patient-image.utils.js';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';

const { t } = useI18n();
const hospitalizationService = new HospitalizationService();
const patientStore = usePatientStore();
const hospitalizationStore = useHospitalizationStore();
const { patients: apiPatients } = storeToRefs(patientStore);

const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const isLoading = ref(false);
const loadError = ref('');

const patients = ref([]);

const displayToast = (msg, type = 'success') => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const filterTabs = ref([
  { id: 'todos', label: 'Todos', active: true },
  { id: 'Crítico', label: 'Crítico', active: false },
  { id: 'Estable', label: 'Estable', active: false },
  { id: 'Recuperación', label: 'Recuperación', active: false }
]);

const selectTab = (id) => {
  filterTabs.value.forEach(tab => tab.active = tab.id === id);
};

const loadData = async (force = false) => {
  const needsLoader = patients.value.length === 0 && !hospitalizationStore.hasCachedOverview;
  if (needsLoader) isLoading.value = true;
  loadError.value = '';
  try {
    const [overview] = await Promise.all([
      hospitalizationStore.fetchOverview({ force }),
      patientStore.fetchPatients({ force })
    ]);
    patients.value = overview.admissions;
  } catch (error) {
    console.error('Error loading hospitalization:', error);
    patients.value = [];
    pendingTasksState.value = [];
    loadError.value = t('clinicManagement.hospitalization.loadError');
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

const getStatusClass = (status) => {
  if (status === 'Crítico') return 'status-critical';
  if (status === 'Estable') return 'status-stable';
  if (status === 'Recuperación') return 'status-recovery';
  return '';
};

const getAvatarImage = (patient, patientId = null) => {
  if (!patient) return null;
  const id = patientId ?? patient.id;
  const apiPatient = apiPatients.value.find(
    (item) => (id != null && item.id === id) || item.name === patient.name
  );

  return resolvePatientImage({
    id: id ?? apiPatient?.id,
    image: apiPatient?.image,
    species: patient.species ?? apiPatient?.species,
    name: patient.name ?? apiPatient?.name
  });
};

const filteredPatients = computed(() => {
  const activeTab = filterTabs.value.find(tab => tab.active);
  if (!activeTab || activeTab.id === 'todos') {
    return patients.value;
  }
  return patients.value.filter(patient => patient.status === activeTab.id);
});

const getTabCount = (tabId) => {
  if (tabId === 'todos') return patients.value.length;
  return patients.value.filter(p => p.status === tabId).length;
};

const patientStatusOptions = ['Crítico', 'Estable', 'Recuperación'];

const showDischargeModal = ref(false);
const patientToDischarge = ref(null);

const openDischargeModal = (item) => {
  patientToDischarge.value = item;
  showDischargeModal.value = true;
};

const closeDischargeModal = () => {
  showDischargeModal.value = false;
  patientToDischarge.value = null;
};

const confirmDischarge = async () => {
  if (!patientToDischarge.value) return;

  const item = patientToDischarge.value;
  const name = item.patient.name;

  try {
    await hospitalizationService.dischargePatient(item.id);
    patients.value = patients.value.filter((p) => p.id !== item.id);
    pendingTasks.value = pendingTasks.value.filter((task) => task.patientId !== item.patientId);
    dailyTracking.value = dailyTracking.value.filter((entry) => entry.patientId !== item.patientId);
    await patientStore.fetchPatients({ force: true });
    closeDischargeModal();
    displayToast(t('clinicManagement.hospitalization.dischargeSuccess', { name }));
  } catch (error) {
    console.error('Error discharging patient:', error);
    displayToast(t('clinicManagement.hospitalization.dischargeError'), 'error');
  }
};


const showViewModal = ref(false);
const showEditModal = ref(false);
const selectedPatient = ref(null);

const openViewModal = (patient) => {
  selectedPatient.value = patient;
  showViewModal.value = true;
};

const editTreatmentsText = ref('');

const openEditModal = (patient) => {
  selectedPatient.value = JSON.parse(JSON.stringify(patient));
  editTreatmentsText.value = (selectedPatient.value.treatments || []).join('\n');
  showEditModal.value = true;
};

const closeModals = () => {
  showViewModal.value = false;
  showEditModal.value = false;
  showRegisterModal.value = false;
  showAddTaskModal.value = false;
  showAddTrackingModal.value = false;
  selectedPatient.value = null;
  editTreatmentsText.value = '';
};

const saveEdit = async () => {
  if (!selectedPatient.value) return;

  const treatments = editTreatmentsText.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  try {
    const updated = await hospitalizationService.updateAdmission(selectedPatient.value.id, {
      status: selectedPatient.value.status,
      diagnosis: selectedPatient.value.diagnosis,
      treatments
    });
    const mapped = mapAdmissionFromApi(updated);
    const index = patients.value.findIndex((item) => item.id === mapped.id);
    if (index !== -1) {
      patients.value[index] = mapped;
    }
    displayToast(t('clinicManagement.hospitalization.modals.saveSuccess'));
    closeModals();
  } catch (error) {
    console.error('Error updating hospitalization:', error);
    displayToast(t('clinicManagement.hospitalization.modals.saveError'), 'error');
  }
};


const showRegisterModal = ref(false);
const newPatientForm = ref({
  patientId: '',
  diagnosis: '',
  status: 'Estable'
});

const openRegisterModal = () => {
  newPatientForm.value = {
    patientId: apiPatients.value[0]?.id ?? '',
    diagnosis: '',
    status: 'Estable'
  };
  showRegisterModal.value = true;
};

const registerPatient = async () => {
  if (!newPatientForm.value.patientId || !newPatientForm.value.diagnosis.trim()) {
    displayToast(t('clinicManagement.hospitalization.modals.register.errorMessage'), 'error');
    return;
  }

  const selected = apiPatients.value.find((p) => p.id === Number(newPatientForm.value.patientId));
  if (!selected) return;

  try {
    await hospitalizationService.admitPatient({
      patientId: newPatientForm.value.patientId,
      status: newPatientForm.value.status,
      diagnosis: newPatientForm.value.diagnosis,
      admissionDate: getTodayIso(),
      treatments: [t('clinicManagement.hospitalization.pendingEvaluation')]
    });

    const patientName = selected.name;
    await hospitalizationService.createTask({
      patientId: newPatientForm.value.patientId,
      status: newPatientForm.value.status === 'Crítico' ? 'critico' : 'urgente',
      title: `${patientName} - ${t('clinicManagement.hospitalization.initialEvaluation')}`,
      description: newPatientForm.value.diagnosis || t('clinicManagement.hospitalization.pendingEvaluation'),
      date: getTodayIso(),
      time: '09:00'
    });

    await loadData(true);
    displayToast(t('clinicManagement.hospitalization.modals.register.successMessage'));
    closeModals();
  } catch (error) {
    console.error('Error registering admission:', error);
    displayToast(t('clinicManagement.hospitalization.modals.register.errorMessage'), 'error');
  }
};


const dailyTracking = ref([]);

const TRACKING_TYPE_ICONS = {
  temperature: 'temperature',
  medication: 'medication',
  food: 'food',
  vitals: 'vitals',
  other: 'vitals'
};

const showAddTrackingModal = ref(false);
const newTrackingForm = ref({
  patientId: '',
  type: 'vitals',
  title: '',
  notes: ''
});

const trackingTypes = ['temperature', 'medication', 'food', 'vitals', 'other'];

const addTrackingEntry = ({ patientId, icon_variant, title, subtitle, author, source = 'manual' }) => {
  const timeRaw = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }).slice(0, 5);
  dailyTracking.value.unshift({
    id: `track_${Date.now()}`,
    patientId,
    date: getTodayIso(),
    icon_variant,
    title,
    subtitle,
    author: author || t('clinicManagement.hospitalization.dailyTracking.defaultAuthor'),
    time: formatTaskTime(timeRaw),
    timeRaw,
    source
  });
};

const todayTracking = computed(() =>
  dailyTracking.value
    .filter((entry) => (entry.date ?? getTodayIso()) === getTodayIso())
    .sort((a, b) => (b.timeRaw ?? '').localeCompare(a.timeRaw ?? ''))
);

const openAddTrackingModal = () => {
  newTrackingForm.value = {
    patientId: patients.value[0]?.id ?? '',
    type: 'vitals',
    title: '',
    notes: ''
  };
  showAddTrackingModal.value = true;
};

const closeAddTrackingModal = () => {
  showAddTrackingModal.value = false;
};

const getTrackingTypeLabel = (type) =>
  t(`clinicManagement.hospitalization.dailyTracking.types.${type}`);

const submitTracking = () => {
  const patient = findPatientById(newTrackingForm.value.patientId);
  if (!patient || !newTrackingForm.value.notes.trim()) {
    displayToast(t('clinicManagement.hospitalization.dailyTracking.addError'), 'error');
    return;
  }

  const type = newTrackingForm.value.type;
  const title = newTrackingForm.value.title.trim()
    || `${patient.patient.name} - ${getTrackingTypeLabel(type)}`;

  addTrackingEntry({
    patientId: patient.id,
    icon_variant: TRACKING_TYPE_ICONS[type] || 'vitals',
    title,
    subtitle: newTrackingForm.value.notes.trim(),
    source: 'manual'
  });

  closeAddTrackingModal();
  displayToast(t('clinicManagement.hospitalization.dailyTracking.addSuccess'));
};

const openTrackingPatient = (entry) => {
  if (!entry.patientId) return;
  const patient = findPatientById(entry.patientId);
  if (patient) openViewModal(patient);
};

const pendingTasks = pendingTasksState;

const formattedToday = computed(() =>
  new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
);

const taskFilter = ref('all');
const showAddTaskModal = ref(false);
const newTaskForm = ref({
  patientId: '',
  title: '',
  description: '',
  status: 'urgente',
  date: getTodayIso(),
  time: '09:00'
});

const taskFilterOptions = [
  { id: 'all', labelKey: 'all' },
  { id: 'critico', labelKey: 'critico' },
  { id: 'urgente', labelKey: 'urgente' },
  { id: 'en_espera', labelKey: 'enEspera' },
  { id: 'en_proceso', labelKey: 'enProceso' },
  { id: 'completed', labelKey: 'completed' }
];

const todayTasks = computed(() => pendingTasks.value.filter(isTaskToday));

const activePendingTasks = computed(() =>
  sortTasksByPriority(todayTasks.value.filter((task) => !task.completed))
);

const completedTasksToday = computed(() =>
  sortTasksByPriority(todayTasks.value.filter((task) => task.completed))
);

const criticoTasksCount = computed(() =>
  activePendingTasks.value.filter((task) => task.status === 'critico').length
);

const tasksTodayCount = computed(() => activePendingTasks.value.length);

const countTasksByStatus = (status) =>
  activePendingTasks.value.filter((task) => task.status === status).length;

const filteredTasks = computed(() => {
  if (taskFilter.value === 'completed') {
    return completedTasksToday.value;
  }
  if (taskFilter.value === 'all') {
    return activePendingTasks.value;
  }
  return activePendingTasks.value.filter((task) => task.status === taskFilter.value);
});

const getFilterCount = (filterId) => {
  if (filterId === 'all') return activePendingTasks.value.length;
  if (filterId === 'completed') return completedTasksToday.value.length;
  return countTasksByStatus(filterId);
};

const findPatientById = (patientId) =>
  patients.value.find((item) => item.patientId === Number(patientId) || item.id === Number(patientId));

const completeTask = async (task) => {
  if (task.completed) return;

  try {
    const updated = await hospitalizationService.toggleTaskComplete(task.id);
    Object.assign(task, updated);

    const patient = findPatientById(task.patientId);
    const patientName = patient?.patient.name ?? task.title.split(' - ')[0];

    addTrackingEntry({
      patientId: task.patientId,
      icon_variant: 'medication',
      title: `${patientName} - ${t('clinicManagement.hospitalization.pendingTasks.completedEntry')}`,
      subtitle: task.description,
      author: t('clinicManagement.hospitalization.pendingTasks.completedByStaff'),
      source: 'task'
    });

    displayToast(t('clinicManagement.hospitalization.pendingTasks.completeSuccess', { title: task.title }));
  } catch (error) {
    console.error('Error completing task:', error);
    displayToast(t('clinicManagement.hospitalization.pendingTasks.toggleError'), 'error');
  }
};

const reopenTask = async (task) => {
  try {
    const updated = await hospitalizationService.toggleTaskComplete(task.id);
    Object.assign(task, updated);
    displayToast(t('clinicManagement.hospitalization.pendingTasks.reopenSuccess'), 'info');
  } catch (error) {
    console.error('Error reopening task:', error);
    displayToast(t('clinicManagement.hospitalization.pendingTasks.toggleError'), 'error');
  }
};

const toggleTask = (task) => {
  if (task.completed) {
    reopenTask(task);
  } else {
    completeTask(task);
  }
};

const openTaskPatient = (task) => {
  const patient = findPatientById(task.patientId);
  if (patient) {
    openViewModal(patient);
  }
};

const openAddTaskModal = () => {
  newTaskForm.value = {
    patientId: patients.value[0]?.patientId ?? apiPatients.value[0]?.id ?? '',
    title: '',
    description: '',
    status: 'urgente',
    date: getTodayIso(),
    time: '09:00'
  };
  showAddTaskModal.value = true;
};

const closeAddTaskModal = () => {
  showAddTaskModal.value = false;
};

const addTask = async () => {
  const patient = findPatientById(newTaskForm.value.patientId)
    ?? apiPatients.value.find((p) => p.id === Number(newTaskForm.value.patientId));

  if (!patient || !newTaskForm.value.title.trim() || !newTaskForm.value.date) {
    displayToast(t('clinicManagement.hospitalization.pendingTasks.addError'), 'error');
    return;
  }

  const patientName = patient.patient?.name ?? patient.name;
  const patientId = patient.patientId ?? patient.id;

  const taskTitle = newTaskForm.value.title.includes(' - ')
    ? newTaskForm.value.title
    : `${patientName} - ${newTaskForm.value.title}`;

  const scheduledDate = newTaskForm.value.date;

  try {
    const created = await hospitalizationService.createTask({
      patientId,
      status: newTaskForm.value.status,
      title: taskTitle,
      description: newTaskForm.value.description.trim() || '—',
      date: scheduledDate,
      time: newTaskForm.value.time
    });

    pendingTasks.value.unshift(created);
    closeAddTaskModal();
    taskFilter.value = 'all';

    if (scheduledDate === getTodayIso()) {
      displayToast(t('clinicManagement.hospitalization.pendingTasks.addSuccess'));
    } else {
      displayToast(
        t('clinicManagement.hospitalization.pendingTasks.addScheduledSuccess', {
          date: formatTaskDate(scheduledDate)
        }),
        'info'
      );
    }
  } catch (error) {
    console.error('Error creating task:', error);
    displayToast(t('clinicManagement.hospitalization.pendingTasks.addError'), 'error');
  }
};

const formatTaskDate = (dateValue) => {
  if (!dateValue) return '—';
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getIconClass = (variant) => {
  const map = {
    temperature: 'pi pi-thermometer',
    medication: 'pi pi-shield',
    food: 'pi pi-apple',
    vitals: 'pi pi-heart-fill'
  };
  return map[variant] || 'pi pi-circle';
};

const getVariantClass = (variant) => {
  return `variant-${variant}`;
};

const selectedRegisterPatient = computed(() =>
  apiPatients.value.find((p) => String(p.id) === String(newPatientForm.value.patientId)) ?? null
);

const selectedTrackingAdmission = computed(() => findPatientById(newTrackingForm.value.patientId));

const selectedTaskAdmission = computed(() => findPatientById(newTaskForm.value.patientId));

const admissionStatusOptions = ['Crítico', 'Estable', 'Recuperación'];

const taskPriorityOptions = ['critico', 'urgente', 'en_espera', 'en_proceso'];

const getAdmissionStatusPillClass = (status) => {
  if (status === 'Crítico') return 'status-pill-critical';
  if (status === 'Recuperación') return 'status-pill-recovery';
  return 'status-pill-stable';
};
</script>

<template>
  <div class="hospitalizacion-view">

    <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : (toastType === 'info' ? 'pi pi-info-circle' : 'pi pi-times-circle')"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
    
    <div class="page-header">
      <div class="header-main">
        <div class="header-icon-wrap">
          <i class="pi pi-home" aria-hidden="true"></i>
        </div>
        <div class="view-info">
          <h1 class="view-title">{{ t('clinicManagement.hospitalization.title') }}</h1>
          <p class="view-description">{{ t('clinicManagement.hospitalization.description') }}</p>
        </div>
      </div>
      <button type="button" class="btn-primary" @click="openRegisterModal">
        <i class="pi pi-plus"></i>
        {{ t('clinicManagement.hospitalization.register') }}
      </button>
    </div>

    <PageViewLoading v-if="isLoading" variant="cards" :card-count="3" />

    <div v-else class="status-cards-row">
      <div class="status-card card-info">
        <div class="card-header-row">
          <div class="icon-circle icon-info">
            <i class="pi pi-building"></i>
          </div>
          <p class="count-number text-info">{{ patients.length }}</p>
        </div>
        <h3 class="card-title title-info">{{ t('clinicManagement.hospitalization.stats.total') }}</h3>
        <p class="card-subtitle subtitle-info">{{ t('clinicManagement.hospitalization.stats.activePatients') }}</p>
      </div>

      <div class="status-card card-danger">
        <div class="card-header-row">
          <div class="icon-circle icon-danger">
            <i class="pi pi-heart-fill"></i>
          </div>
          <p class="count-number text-danger">{{ getTabCount('Crítico') }}</p>
        </div>
        <h3 class="card-title title-danger">{{ t('clinicManagement.hospitalization.stats.critical') }}</h3>
        <p class="card-subtitle subtitle-danger">{{ t('clinicManagement.hospitalization.stats.immediateAttention') }}</p>
      </div>

      <div class="status-card card-warning">
        <div class="card-header-row">
          <div class="icon-circle icon-warning">
            <i class="pi pi-clipboard"></i>
          </div>
          <p class="count-number text-warning">{{ tasksTodayCount }}</p>
        </div>
        <h3 class="card-title title-warning">{{ t('clinicManagement.hospitalization.stats.surgeriesToday') }}</h3>
        <p class="card-subtitle subtitle-warning">{{ t('clinicManagement.hospitalization.stats.scheduledToday') }}</p>
      </div>
    </div>

    <div class="hospital-card">
      <div class="card-header">
        <div class="card-header-left">
          <h2 class="section-title">{{ t('clinicManagement.hospitalization.table.title') }}</h2>
          <span class="results-chip">
            {{ t('clinicManagement.hospitalization.resultsCount', { count: filteredPatients.length }) }}
          </span>
        </div>
      </div>

      <div class="filters-panel">
        <div class="filter-pills" role="tablist" :aria-label="t('clinicManagement.hospitalization.table.title')">
          <button
            v-for="tab in filterTabs"
            :key="tab.id"
            type="button"
            role="tab"
            :class="['filter-pill', { active: tab.active }]"
            :aria-selected="tab.active"
            @click="selectTab(tab.id)"
          >
            {{ tab.id === 'todos' ? t('clinicManagement.hospitalization.tabs.all') : t(`clinicManagement.hospitalization.status.${tab.id}`) }}
            <span class="pill-count">{{ getTabCount(tab.id) }}</span>
          </button>
        </div>
      </div>

      <div class="table-body">
      <PageViewLoading
        v-if="isLoading"
        variant="table"
        :columns="7"
        :table-rows="5"
        :message="t('clinicManagement.hospitalization.loading')"
      />
      <div v-else-if="loadError" class="table-state table-state-error">
        <i class="pi pi-exclamation-triangle"></i>
        <p>{{ loadError }}</p>
        <button type="button" class="btn-retry" @click="loadData">{{ t('clinicManagement.hospitalization.retry') }}</button>
      </div>
      <div v-else-if="filteredPatients.length === 0" class="table-state">
        <i class="pi pi-inbox"></i>
        <p>{{ t('clinicManagement.hospitalization.empty') }}</p>
      </div>

      <table v-else class="patient-table">
        <thead>
          <tr>
            <th style="width: 25%;">{{ t('clinicManagement.hospitalization.table.columns.patient') }}</th>
            <th style="width: 17%;">{{ t('clinicManagement.hospitalization.table.columns.owner') }}</th>
            <th style="width: 10%;">{{ t('clinicManagement.hospitalization.table.columns.status') }}</th>
            <th style="width: 13%;">{{ t('clinicManagement.hospitalization.table.columns.admissionDate') }}</th>
            <th style="width: 15%;">{{ t('clinicManagement.hospitalization.table.columns.diagnosis') }}</th>
            <th style="width: 14%;">{{ t('clinicManagement.hospitalization.table.columns.treatment') }}</th>
            <th style="width: 6%; text-align: center;">{{ t('clinicManagement.hospitalization.table.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredPatients" :key="item.id">
            <td>
              <div class="patient-cell">
                <div :class="['patient-avatar', item.patient.palette]">
                  <img v-if="getAvatarImage(item.patient, item.patientId)" :src="getAvatarImage(item.patient, item.patientId)" :alt="item.patient.name" class="patient-image" />
                  <span v-else class="patient-initial">{{ item.patient.name.charAt(0) }}</span>
                </div>
                <div class="patient-text">
                  <span class="patient-name">{{ item.patient.name }}</span>
                  <span class="patient-subtitle">{{ item.patient.breed }} · {{ item.patient.age }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="owner-cell">
                <span class="owner-name">{{ item.owner.name }}</span>
                <span class="owner-phone">{{ item.owner.phone }}</span>
              </div>
            </td>
            <td>
              <div :class="['status-badge', getStatusClass(item.status)]">
                <span class="status-dot"></span>
                {{ t(`clinicManagement.hospitalization.status.${item.status}`) }}
              </div>
            </td>
            <td>
              <div class="date-cell">
                <span class="date-primary">{{ item.admissionDate.formatted }}</span>
                <span class="date-secondary">{{ item.admissionDate.relative }}</span>
              </div>
            </td>
            <td>
              <span class="diagnosis-text">{{ item.diagnosis }}</span>
            </td>
            <td>
              <div class="treatment-list">
                <span v-for="(treatment, index) in item.treatments" :key="index" class="treatment-item">
                  • {{ treatment }}
                </span>
              </div>
            </td>
            <td>
              <div class="action-buttons">
                <i
                  class="pi pi-pencil action-edit"
                  :title="t('clinicManagement.hospitalization.actions.edit')"
                  @click="openEditModal(item)"
                ></i>
                <i
                  class="pi pi-sign-out action-discharge"
                  :title="t('clinicManagement.hospitalization.actions.discharge')"
                  @click.stop="openDischargeModal(item)"
                ></i>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      </div>
      
      <div class="pagination-bar" v-if="filteredPatients.length > 0">
        <div class="results-summary">
          {{ t('clinicManagement.hospitalization.pagination.showing', { from: 1, to: filteredPatients.length, total: filteredPatients.length }) }}
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

    
    <div class="tracking-tasks-row">
      
      <div class="tracking-card">
        <div class="widget-header tracking-card-header">
          <div class="widget-header-left">
            <div class="widget-icon-wrap widget-icon-info">
              <i class="pi pi-calendar-plus" aria-hidden="true"></i>
            </div>
            <div>
              <h2 class="widget-title">{{ t('clinicManagement.hospitalization.dailyTracking.title') }}</h2>
              <p class="widget-date">{{ formattedToday }}</p>
            </div>
            <span v-if="todayTracking.length" class="widget-count-badge">{{ todayTracking.length }}</span>
          </div>
          <button type="button" class="btn-add-task" @click="openAddTrackingModal">
            <i class="pi pi-plus"></i>
            {{ t('clinicManagement.hospitalization.dailyTracking.addEntry') }}
          </button>
        </div>

        <div v-if="todayTracking.length === 0" class="tasks-empty tracking-empty">
          <i class="pi pi-history"></i>
          <p>{{ t('clinicManagement.hospitalization.dailyTracking.emptyToday') }}</p>
          <span class="empty-hint">{{ t('clinicManagement.hospitalization.dailyTracking.emptyHint') }}</span>
        </div>

        <div v-else class="tracking-list">
          <div
            v-for="item in todayTracking"
            :key="item.id"
            class="tracking-item clickable"
            @click="openTrackingPatient(item)"
          >
            <div class="item-left">
              <div :class="['icon-circle', getVariantClass(item.icon_variant)]">
                <img
                  v-if="item.patientId && getAvatarImage(findPatientById(item.patientId)?.patient)"
                  :src="getAvatarImage(findPatientById(item.patientId)?.patient)"
                  :alt="item.title.split(' - ')[0]"
                  class="patient-image"
                />
                <i v-else :class="getIconClass(item.icon_variant)"></i>
              </div>
              <div class="text-group">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-subtitle">{{ item.subtitle }}</span>
                <span class="item-author">
                  {{ item.author }}
                  <span v-if="item.source === 'task'" class="entry-source">
                    · {{ t('clinicManagement.hospitalization.dailyTracking.fromTask') }}
                  </span>
                </span>
              </div>
            </div>
            <div class="item-right">
              <span class="item-time">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </div>

      
      <div class="tasks-widget">
        <div class="widget-header">
          <div class="widget-header-left">
            <div class="widget-icon-wrap widget-icon-primary">
              <i class="pi pi-clipboard" aria-hidden="true"></i>
            </div>
            <div>
              <h2 class="widget-title">{{ t('clinicManagement.hospitalization.pendingTasks.title') }}</h2>
              <p class="widget-date">{{ formattedToday }}</p>
            </div>
            <span v-if="activePendingTasks.length" class="widget-count-badge">{{ activePendingTasks.length }}</span>
          </div>
          <button type="button" class="btn-add-task" @click="openAddTaskModal">
            <i class="pi pi-plus"></i>
            {{ t('clinicManagement.hospitalization.pendingTasks.addTask') }}
          </button>
        </div>

        <div class="task-filter-tabs">
          <button
            v-for="option in taskFilterOptions"
            :key="option.id"
            :class="['task-filter-tab', { active: taskFilter === option.id }]"
            @click="taskFilter = option.id"
          >
            {{ t(`clinicManagement.hospitalization.pendingTasks.filters.${option.labelKey}`) }}
            <span class="tab-count">({{ getFilterCount(option.id) }})</span>
          </button>
        </div>
        
        <div v-if="filteredTasks.length === 0" class="tasks-empty">
          <i class="pi pi-inbox"></i>
          <p>{{ t('clinicManagement.hospitalization.pendingTasks.emptyToday') }}</p>
        </div>

        <div v-else class="tasks-list">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            :class="['task-card', `task-${task.status}`, { 'task-completed': task.completed }]"
          >
            <div class="task-accent-bar"></div>
            <div class="task-card-inner">
              <button
                type="button"
                :class="['task-checkbox', { checked: task.completed }]"
                :title="task.completed ? t('clinicManagement.hospitalization.pendingTasks.markPending') : t('clinicManagement.hospitalization.pendingTasks.markComplete')"
                @click.stop="toggleTask(task)"
              >
                <i v-if="task.completed" class="pi pi-check"></i>
              </button>
              <div class="task-content" @click="openTaskPatient(task)">
                <span class="task-title">{{ task.title }}</span>
                <span class="task-subtitle">{{ task.description }}</span>
                <div class="task-footer">
                  <span :class="['task-badge', `badge-${task.status}`]">
                    {{ t(`clinicManagement.hospitalization.pendingTasks.status.${task.status}`) }}
                  </span>
                  <span class="task-time">{{ formatTaskTime(task.time) }}</span>
                  <span class="task-view-patient">
                    <i class="pi pi-eye"></i>
                    {{ t('clinicManagement.hospitalization.pendingTasks.viewPatient') }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="modal">
      <div v-if="showViewModal && selectedPatient" class="modal-overlay patient-detail-modal" @click.self="closeModals">
        <div class="modal-container" @click.stop>
          <div class="modal-header">
            <div class="modal-header-icon modal-header-icon-danger">
              <i class="pi pi-building"></i>
            </div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.hospitalization.modals.view.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.hospitalization.modals.view.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeModals"><i class="pi pi-times"></i></button>
          </div>

          <div class="modal-body">
            <div class="detail-section">
              <h3 class="detail-title"><i class="pi pi-user"></i> {{ t('clinicManagement.hospitalization.modals.view.patientSection') }}</h3>
              <div class="detail-patient-row">
                <div :class="['detail-patient-avatar', selectedPatient.patient.palette]">
                  <img
                    v-if="getAvatarImage(selectedPatient.patient)"
                    :src="getAvatarImage(selectedPatient.patient)"
                    :alt="selectedPatient.patient.name"
                    class="patient-image"
                  />
                  <span v-else class="patient-initial">{{ selectedPatient.patient.name.charAt(0) }}</span>
                </div>
                <div class="detail-patient-info">
                  <strong class="detail-patient-name">{{ selectedPatient.patient.name }}</strong>
                  <span class="detail-patient-species">{{ selectedPatient.patient.species }} · {{ selectedPatient.patient.breed }}</span>
                  <span class="detail-patient-meta">{{ selectedPatient.patient.age }}</span>
                </div>
              </div>
            </div>

            <div class="detail-section">
              <h3 class="detail-title"><i class="pi pi-heart-fill"></i> {{ t('clinicManagement.hospitalization.modals.view.hospitalSection') }}</h3>
              <div class="detail-grid">
                <div class="detail-item">
                  <span>{{ t('clinicManagement.hospitalization.modals.view.owner') }}</span>
                  <strong>{{ selectedPatient.owner.name }}</strong>
                </div>
                <div class="detail-item">
                  <span>{{ t('clinicManagement.hospitalization.modals.view.phone') }}</span>
                  <strong>{{ selectedPatient.owner.phone }}</strong>
                </div>
                <div class="detail-item">
                  <span>{{ t('clinicManagement.hospitalization.modals.view.admissionDate') }}</span>
                  <strong>{{ selectedPatient.admissionDate.formatted }}</strong>
                  <span class="detail-item-hint">{{ selectedPatient.admissionDate.relative }}</span>
                </div>
                <div class="detail-item">
                  <span>{{ t('clinicManagement.hospitalization.modals.view.status') }}</span>
                  <div :class="['status-badge', getStatusClass(selectedPatient.status)]">
                    <span class="status-dot"></span>
                    {{ t(`clinicManagement.hospitalization.status.${selectedPatient.status}`) }}
                  </div>
                </div>
                <div class="detail-item span-full">
                  <span>{{ t('clinicManagement.hospitalization.modals.view.diagnosis') }}</span>
                  <strong>{{ selectedPatient.diagnosis }}</strong>
                </div>
                <div class="detail-item span-full">
                  <span>{{ t('clinicManagement.hospitalization.modals.view.treatments') }}</span>
                  <ul class="detail-treatment-list">
                    <li v-for="(treatment, index) in selectedPatient.treatments" :key="index">{{ treatment }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="detail-actions">
              <button type="button" class="btn-cancel" @click="closeModals">
                {{ t('clinicManagement.hospitalization.modals.view.close') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    
    <Transition name="modal">
      <div v-if="showDischargeModal && patientToDischarge" class="modal-overlay discharge-modal" @click.self="closeDischargeModal">
        <div class="modal-container discharge-form-modal" @click.stop>
          <div class="discharge-form-header">
            <div class="discharge-form-icon-wrap">
              <i class="pi pi-sign-out" aria-hidden="true"></i>
            </div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.hospitalization.modals.discharge.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.hospitalization.modals.discharge.subtitle') }}</p>
            </div>
          </div>

          <div class="discharge-form-body">
            <div class="discharge-patient-card">
              <span class="discharge-patient-avatar">
                {{ patientToDischarge.patient.name.charAt(0).toUpperCase() }}
              </span>
              <div class="discharge-patient-info">
                <strong class="discharge-patient-name">{{ patientToDischarge.patient.name }}</strong>
                <span class="discharge-patient-meta">
                  {{ patientToDischarge.patient.species }} · {{ patientToDischarge.diagnosis }}
                </span>
              </div>
              <span :class="['status-badge', getStatusClass(patientToDischarge.status)]">
                <span class="status-dot"></span>
                {{ t(`clinicManagement.hospitalization.status.${patientToDischarge.status}`) }}
              </span>
            </div>

            <div class="discharge-message-card">
              <i class="pi pi-info-circle" aria-hidden="true"></i>
              <p>
                {{ t('clinicManagement.hospitalization.modals.discharge.message', { name: patientToDischarge.patient.name }) }}
              </p>
            </div>
          </div>

          <div class="modal-actions discharge-form-actions">
            <button type="button" class="btn-cancel" @click="closeDischargeModal">
              {{ t('clinicManagement.hospitalization.modals.cancel') }}
            </button>
            <button type="button" class="btn-discharge" @click="confirmDischarge">
              <i class="pi pi-check"></i>
              {{ t('clinicManagement.hospitalization.modals.discharge.confirm') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showEditModal && selectedPatient" class="modal-overlay" @click.self="closeModals">
        <div class="modal-container hospital-form-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-header-icon modal-header-icon-info">
              <i class="pi pi-pencil" aria-hidden="true"></i>
            </div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.hospitalization.modals.edit.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.hospitalization.modals.edit.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeModals"><i class="pi pi-times"></i></button>
          </div>

          <form class="hospital-form" @submit.prevent="saveEdit">
            <div class="hospital-form-content">
              <div class="hospital-intro-card hospital-intro-card-info">
                <div class="hospital-intro-icon hospital-intro-icon-info">
                  <i class="pi pi-heart" aria-hidden="true"></i>
                </div>
                <div class="hospital-intro-patient">
                  <strong>{{ selectedPatient.patient.name }}</strong>
                  <span>{{ selectedPatient.patient.species }} · {{ selectedPatient.patient.breed }}</span>
                </div>
              </div>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon hospital-panel-icon-info"><i class="pi pi-file-edit" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.modals.edit.clinicalSection') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full">
                    <label for="edit-diagnosis">{{ t('clinicManagement.hospitalization.modals.edit.diagnosis') }}</label>
                    <input
                      id="edit-diagnosis"
                      v-model="selectedPatient.diagnosis"
                      type="text"
                      class="hospital-input"
                    />
                  </div>
                  <div class="form-group span-full">
                    <label for="edit-treatment">{{ t('clinicManagement.hospitalization.modals.edit.treatment') }}</label>
                    <textarea
                      id="edit-treatment"
                      v-model="editTreatmentsText"
                      class="hospital-input hospital-textarea"
                      rows="4"
                      :placeholder="t('clinicManagement.hospitalization.modals.edit.treatmentPlaceholder')"
                    ></textarea>
                  </div>
                </div>
              </section>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon hospital-panel-icon-warning"><i class="pi pi-flag" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.modals.edit.status') }}
                </h3>
                <div class="form-group span-full">
                  <div class="status-pills" role="group" :aria-label="t('clinicManagement.hospitalization.modals.edit.status')">
                    <button
                      v-for="status in admissionStatusOptions"
                      :key="status"
                      type="button"
                      class="status-pill"
                      :class="[getAdmissionStatusPillClass(status), { active: selectedPatient.status === status }]"
                      @click="selectedPatient.status = status"
                    >
                      {{ t(`clinicManagement.hospitalization.status.${status}`) }}
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-actions hospital-form-actions">
              <button type="button" class="btn-cancel" @click="closeModals">{{ t('clinicManagement.hospitalization.modals.cancel') }}</button>
              <button type="submit" class="btn-submit">
                <i class="pi pi-check"></i>
                {{ t('clinicManagement.hospitalization.modals.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    
    <Transition name="modal">
      <div v-if="showRegisterModal" class="modal-overlay" @click.self="closeModals">
        <div class="modal-container hospital-form-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-header-icon modal-header-icon-danger">
              <i class="pi pi-sign-in" aria-hidden="true"></i>
            </div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.hospitalization.modals.register.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.hospitalization.modals.register.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeModals"><i class="pi pi-times"></i></button>
          </div>

          <form class="hospital-form" @submit.prevent="registerPatient">
            <div class="hospital-form-content">
              <div class="hospital-intro-card">
                <div class="hospital-intro-icon">
                  <i class="pi pi-building" aria-hidden="true"></i>
                </div>
                <p class="hospital-intro-text">{{ t('clinicManagement.hospitalization.modals.register.subtitle') }}</p>
              </div>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon"><i class="pi pi-heart" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.modals.register.patientSection') }}
                </h3>
                <div class="form-group span-full">
                  <label for="register-patient-select">{{ t('clinicManagement.hospitalization.modals.register.patientName') }} *</label>
                  <select id="register-patient-select" v-model="newPatientForm.patientId" class="hospital-input">
                    <option value="">{{ t('clinicManagement.hospitalization.modals.register.patientNamePlaceholder') }}</option>
                    <option v-for="patient in apiPatients" :key="patient.id" :value="patient.id">
                      {{ patient.name }} ({{ patient.species }})
                    </option>
                  </select>
                  <div v-if="selectedRegisterPatient" class="selected-patient-preview">
                    <span class="selected-patient-avatar">{{ selectedRegisterPatient.name.charAt(0).toUpperCase() }}</span>
                    <span class="selected-patient-text">{{ selectedRegisterPatient.name }} · {{ selectedRegisterPatient.species }}</span>
                  </div>
                </div>
              </section>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon hospital-panel-icon-info"><i class="pi pi-file-edit" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.modals.register.clinicalSection') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full">
                    <label for="register-diagnosis">{{ t('clinicManagement.hospitalization.modals.register.diagnosis') }} *</label>
                    <input
                      id="register-diagnosis"
                      v-model="newPatientForm.diagnosis"
                      type="text"
                      class="hospital-input"
                      :placeholder="t('clinicManagement.hospitalization.modals.register.diagnosisPlaceholder')"
                    />
                  </div>
                  <div class="form-group span-full">
                    <span class="field-label">{{ t('clinicManagement.hospitalization.modals.register.status') }}</span>
                    <div class="status-pills" role="group" :aria-label="t('clinicManagement.hospitalization.modals.register.status')">
                      <button
                        v-for="status in admissionStatusOptions"
                        :key="status"
                        type="button"
                        class="status-pill"
                        :class="[getAdmissionStatusPillClass(status), { active: newPatientForm.status === status }]"
                        @click="newPatientForm.status = status"
                      >
                        {{ t(`clinicManagement.hospitalization.status.${status}`) }}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-actions hospital-form-actions">
              <button type="button" class="btn-cancel" @click="closeModals">{{ t('clinicManagement.hospitalization.modals.cancel') }}</button>
              <button type="submit" class="btn-submit">
                <i class="pi pi-check"></i>
                {{ t('clinicManagement.hospitalization.modals.register.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showAddTrackingModal" class="modal-overlay" @click.self="closeAddTrackingModal">
        <div class="modal-container hospital-form-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-header-icon modal-header-icon-info">
              <i class="pi pi-calendar-plus" aria-hidden="true"></i>
            </div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.hospitalization.dailyTracking.addModal.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.hospitalization.dailyTracking.addModal.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeAddTrackingModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="hospital-form" @submit.prevent="submitTracking">
            <div class="hospital-form-content">
              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon"><i class="pi pi-user" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.dailyTracking.addModal.patient') }}
                </h3>
                <div class="form-group span-full">
                  <label class="visually-hidden" for="tracking-patient-select">
                    {{ t('clinicManagement.hospitalization.dailyTracking.addModal.patient') }}
                  </label>
                  <select id="tracking-patient-select" v-model="newTrackingForm.patientId" class="hospital-input">
                    <option v-for="item in patients" :key="item.id" :value="item.patientId">
                      {{ item.patient.name }} — {{ item.diagnosis }}
                    </option>
                  </select>
                  <div v-if="selectedTrackingAdmission" class="selected-patient-preview">
                    <span class="selected-patient-avatar">{{ selectedTrackingAdmission.patient.name.charAt(0).toUpperCase() }}</span>
                    <span class="selected-patient-text">
                      {{ selectedTrackingAdmission.patient.name }} · {{ selectedTrackingAdmission.diagnosis }}
                    </span>
                  </div>
                </div>
              </section>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon hospital-panel-icon-info"><i class="pi pi-tag" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.dailyTracking.addModal.type') }}
                </h3>
                <div class="form-group span-full">
                  <div class="type-pills" role="group" :aria-label="t('clinicManagement.hospitalization.dailyTracking.addModal.type')">
                    <button
                      v-for="type in trackingTypes"
                      :key="type"
                      type="button"
                      class="type-pill"
                      :class="{ active: newTrackingForm.type === type }"
                      @click="newTrackingForm.type = type"
                    >
                      <i :class="getIconClass(TRACKING_TYPE_ICONS[type] || 'vitals')" aria-hidden="true"></i>
                      {{ getTrackingTypeLabel(type) }}
                    </button>
                  </div>
                </div>
              </section>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon hospital-panel-icon-success"><i class="pi pi-file-edit" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.dailyTracking.addModal.detailsSection') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full">
                    <label for="tracking-title">{{ t('clinicManagement.hospitalization.dailyTracking.addModal.titleLabel') }}</label>
                    <input
                      id="tracking-title"
                      v-model="newTrackingForm.title"
                      type="text"
                      class="hospital-input"
                      :placeholder="t('clinicManagement.hospitalization.dailyTracking.addModal.titlePlaceholder')"
                    />
                  </div>
                  <div class="form-group span-full">
                    <label for="tracking-notes">{{ t('clinicManagement.hospitalization.dailyTracking.addModal.notes') }} *</label>
                    <textarea
                      id="tracking-notes"
                      v-model="newTrackingForm.notes"
                      class="hospital-input hospital-textarea"
                      rows="3"
                      :placeholder="t('clinicManagement.hospitalization.dailyTracking.addModal.notesPlaceholder')"
                    ></textarea>
                  </div>
                </div>
              </section>
            </div>

            <div class="modal-actions hospital-form-actions">
              <button type="button" class="btn-cancel" @click="closeAddTrackingModal">{{ t('clinicManagement.hospitalization.modals.cancel') }}</button>
              <button type="submit" class="btn-submit">
                <i class="pi pi-check"></i>
                {{ t('clinicManagement.hospitalization.dailyTracking.addModal.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="modal">
      <div v-if="showAddTaskModal" class="modal-overlay" @click.self="closeAddTaskModal">
        <div class="modal-container hospital-form-modal" @click.stop>
          <div class="modal-header">
            <div class="modal-header-icon">
              <i class="pi pi-clipboard" aria-hidden="true"></i>
            </div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.hospitalization.pendingTasks.addModal.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.hospitalization.pendingTasks.addModal.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeAddTaskModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="hospital-form" @submit.prevent="addTask">
            <div class="hospital-form-content">
              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon"><i class="pi pi-heart" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.pendingTasks.addModal.patient') }}
                </h3>
                <div class="form-group span-full">
                  <label class="visually-hidden" for="task-patient-select">
                    {{ t('clinicManagement.hospitalization.pendingTasks.addModal.patient') }}
                  </label>
                  <select id="task-patient-select" v-model="newTaskForm.patientId" class="hospital-input">
                    <option v-for="item in patients" :key="item.id" :value="item.patientId">
                      {{ item.patient.name }} — {{ item.diagnosis }}
                    </option>
                  </select>
                  <div v-if="selectedTaskAdmission" class="selected-patient-preview">
                    <span class="selected-patient-avatar">{{ selectedTaskAdmission.patient.name.charAt(0).toUpperCase() }}</span>
                    <span class="selected-patient-text">
                      {{ selectedTaskAdmission.patient.name }} · {{ selectedTaskAdmission.diagnosis }}
                    </span>
                  </div>
                </div>
              </section>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon hospital-panel-icon-info"><i class="pi pi-list" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.pendingTasks.addModal.taskSection') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full">
                    <label for="task-title">{{ t('clinicManagement.hospitalization.pendingTasks.addModal.taskTitle') }}</label>
                    <input
                      id="task-title"
                      v-model="newTaskForm.title"
                      type="text"
                      class="hospital-input"
                      :placeholder="t('clinicManagement.hospitalization.pendingTasks.addModal.taskTitlePlaceholder')"
                    />
                  </div>
                  <div class="form-group span-full">
                    <label for="task-description">{{ t('clinicManagement.hospitalization.pendingTasks.addModal.description') }}</label>
                    <input
                      id="task-description"
                      v-model="newTaskForm.description"
                      type="text"
                      class="hospital-input"
                      :placeholder="t('clinicManagement.hospitalization.pendingTasks.addModal.descriptionPlaceholder')"
                    />
                  </div>
                </div>
              </section>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon"><i class="pi pi-calendar" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.pendingTasks.addModal.scheduleSection') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group">
                    <label for="task-date">{{ t('clinicManagement.hospitalization.pendingTasks.addModal.date') }}</label>
                    <input id="task-date" v-model="newTaskForm.date" type="date" class="hospital-input" />
                  </div>
                  <div class="form-group">
                    <label for="task-time">{{ t('clinicManagement.hospitalization.pendingTasks.addModal.time') }}</label>
                    <input id="task-time" v-model="newTaskForm.time" type="time" class="hospital-input" />
                  </div>
                </div>
                <p v-if="newTaskForm.date && newTaskForm.date !== getTodayIso()" class="schedule-note">
                  {{ t('clinicManagement.hospitalization.pendingTasks.addModal.futureDateNote') }}
                </p>
              </section>

              <section class="hospital-panel">
                <h3 class="hospital-panel-title">
                  <span class="hospital-panel-icon hospital-panel-icon-warning"><i class="pi pi-flag" aria-hidden="true"></i></span>
                  {{ t('clinicManagement.hospitalization.pendingTasks.addModal.priority') }}
                </h3>
                <div class="form-group span-full">
                  <div class="priority-pills" role="group" :aria-label="t('clinicManagement.hospitalization.pendingTasks.addModal.priority')">
                    <button
                      v-for="priority in taskPriorityOptions"
                      :key="priority"
                      type="button"
                      class="priority-pill"
                      :class="[`priority-pill-${priority}`, { active: newTaskForm.status === priority }]"
                      @click="newTaskForm.status = priority"
                    >
                      {{ t(`clinicManagement.hospitalization.pendingTasks.status.${priority}`) }}
                    </button>
                  </div>
                  <p class="priority-hint">
                    {{ t(`clinicManagement.hospitalization.pendingTasks.statusHints.${newTaskForm.status}`) }}
                  </p>
                </div>
              </section>
            </div>

            <div class="modal-actions hospital-form-actions">
              <button type="button" class="btn-cancel" @click="closeAddTaskModal">{{ t('clinicManagement.hospitalization.modals.cancel') }}</button>
              <button type="submit" class="btn-submit">
                <i class="pi pi-plus"></i>
                {{ t('clinicManagement.hospitalization.pendingTasks.addModal.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.hospitalizacion-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
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
  background: var(--color-status-danger-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 22%, transparent);
  color: var(--color-status-danger-indicator);
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

.hospital-card {
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
  padding: 14px 22px 0;
}

.filter-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-main);
  color: var(--color-text-secondary);
  font-size: var(--font-body-main-size);
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
}

.filter-pill:hover:not(.active) {
  color: var(--color-text-primary);
  border-color: color-mix(in srgb, var(--color-primary-main) 20%, var(--color-border-light));
}

.filter-pill.active {
  background: var(--color-primary-main);
  border-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  font-weight: 600;
}

.pill-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: var(--radius-full);
  font-size: var(--font-body-caption-size);
  font-weight: 700;
  background: color-mix(in srgb, currentColor 14%, transparent);
}

.filter-pill.active .pill-count {
  background: color-mix(in srgb, var(--color-primary-contrastText) 22%, transparent);
}

.table-body {
  padding-top: 8px;
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

.patient-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.patient-table th {
  background: color-mix(in srgb, var(--color-background-main) 65%, var(--color-background-surface));
  padding: 12px 22px;
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  border-bottom: 1px solid var(--color-border-light);
}

.patient-table td {
  padding: 16px 22px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
  vertical-align: middle;
}

.patient-table tbody tr:hover {
  background: color-mix(in srgb, var(--color-primary-main) 4%, var(--color-background-surface));
}

.patient-table tbody tr:last-child td {
  border-bottom: none;
}

.patient-cell { display: flex; align-items: center; gap: 12px; }
.patient-avatar {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  overflow: hidden;
}

.patient-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.patient-initial {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 18px;
}

.dog_golden { background-color: #fef3c7; color: #d97706; }
.cat_purple { background-color: #f3e8ff; color: #9333ea; }
.dog_blue   { background-color: #dbeafe; color: #2563eb; }
.cat_pink   { background-color: #fce7f3; color: #db2777; }
.dog_green  { background-color: #dcfce7; color: #16a34a; }

.patient-text { display: flex; flex-direction: column; gap: 2px; }
.patient-name { font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
.patient-subtitle { font-size: 13px; color: var(--color-text-secondary); }

.owner-cell { display: flex; flex-direction: column; gap: 2px; }
.owner-name { font-size: var(--font-body-main-size); font-weight: 500; color: var(--color-text-primary); }
.owner-phone { font-size: 13px; color: var(--color-text-secondary); }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-critical { background: var(--color-status-danger-bg); color: var(--color-status-danger-text); }
.status-critical .status-dot { background: var(--color-status-danger-indicator); }
.status-stable { background: var(--color-status-success-bg); color: var(--color-status-success-text); }
.status-stable .status-dot { background: var(--color-status-success-indicator); }
.status-recovery { background: var(--color-status-warning-bg); color: var(--color-status-warning-text); }
.status-recovery .status-dot { background: var(--color-status-warning-indicator); }

.date-cell { display: flex; flex-direction: column; gap: 2px; }
.date-primary { font-size: var(--font-body-main-size); font-weight: 500; color: var(--color-text-primary); }
.date-secondary { font-size: var(--font-body-caption-size); color: var(--color-text-secondary); }

.diagnosis-text { font-size: var(--font-body-main-size); color: var(--color-text-primary); }
.treatment-list { display: flex; flex-direction: column; gap: 4px; }
.treatment-item { font-size: 13px; color: var(--color-text-secondary); }

.action-buttons { display: flex; align-items: center; justify-content: center; gap: 8px; }
.action-edit,
.action-discharge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}
.action-edit {
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
}
.action-edit:hover {
  color: var(--color-primary-main);
  border-color: color-mix(in srgb, var(--color-primary-main) 24%, transparent);
  background: var(--color-primary-subtle);
}
.action-discharge {
  color: var(--color-status-success-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 24%, transparent);
  background: var(--color-status-success-bg);
}
.action-discharge:hover {
  color: var(--color-status-success-text);
  background: color-mix(in srgb, var(--color-status-success-bg) 70%, var(--color-status-success-indicator) 8%);
}

.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 22px;
  border-top: 1px solid var(--color-border-light);
  flex-wrap: wrap;
  gap: 16px;
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

.pagination-btn, .pagination-nav-btn {
  width: 32px;
  height: 32px;
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

.pagination-btn:hover:not(.active), .pagination-nav-btn:hover:not(.disabled-btn) {
  background: var(--color-background-main);
}

.pagination-btn.active {
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border-color: var(--color-primary-main);
  font-weight: 600;
}

.disabled-btn {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-background-main);
}

.pagination-nav-btn i {
  font-size: 12px;
}


.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(17, 24, 39, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background-color: #ffffff;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}
.modal-header h2 { font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 600; color: #111827; margin: 0; }
.close-icon { color: #6b7280; cursor: pointer; font-size: 16px; transition: color 0.2s; }
.close-icon:hover { color: #111827; }
.modal-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.detail-group label { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 600; color: #4b5563; display: block; margin-bottom: 4px; }
.detail-group p { font-family: 'Inter', sans-serif; font-size: 14px; color: #111827; margin: 0; }
.detail-group ul { margin: 0; padding-left: 20px; font-family: 'Inter', sans-serif; font-size: 14px; color: #111827; }
.form-group label { font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500; color: #374151; display: block; margin-bottom: 8px; }
.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  color: #111827;
  box-sizing: border-box;
}
.form-input:focus { outline: none; border-color: #0284c7; box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1); }
.form-textarea { resize: vertical; min-height: 96px; line-height: 1.5; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px; }
.btn-secondary {
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-secondary:hover { background-color: #f9fafb; }

/* Hospital form modals */
.hospital-form-modal {
  max-width: 560px;
}

.hospital-form-modal .modal-header {
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

.hospital-form-modal .modal-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
}

.hospital-form-modal .modal-header-icon-danger {
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 22%, transparent);
}

.hospital-form-modal .modal-header-icon-info {
  background: var(--color-status-info-bg);
  color: var(--color-status-info-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 22%, transparent);
}

.hospital-form-modal .modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.hospital-form-modal .modal-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

.hospital-form-modal .modal-close {
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

.hospital-form-modal .modal-close:hover {
  background: var(--color-background-main);
  color: var(--color-text-primary);
}

.hospital-form {
  display: flex;
  flex-direction: column;
}

.hospital-form-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 28px 8px;
}

.hospital-intro-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--color-status-danger-indicator) 5%, var(--color-background-surface));
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 14%, var(--color-border-light));
  border-radius: var(--radius-large);
}

.hospital-intro-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-indicator);
  font-size: 17px;
}

.hospital-intro-text {
  margin: 0;
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  line-height: 1.45;
}

.hospital-panel {
  padding: 16px 18px;
  background: color-mix(in srgb, var(--color-background-main) 55%, var(--color-background-surface));
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
}

.hospital-panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 14px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.hospital-panel-icon {
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

.hospital-panel-icon-info {
  background: var(--color-status-info-bg);
  color: var(--color-status-info-indicator);
}

.hospital-panel-icon-success {
  background: var(--color-status-success-bg);
  color: var(--color-status-success-indicator);
}

.hospital-panel-icon-warning {
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-indicator);
}

.hospital-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hospital-form .form-group.span-full {
  grid-column: 1 / -1;
}

.hospital-form .form-group label,
.hospital-form .field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.hospital-form .field-label {
  display: block;
  margin-bottom: 2px;
}

.hospital-input {
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

.hospital-form select.hospital-input {
  cursor: pointer;
  appearance: none;
  padding-right: 32px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.hospital-textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.5;
}

.hospital-input:focus {
  border-color: var(--color-primary-main);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary-main) 14%, transparent);
}

.selected-patient-preview {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-full);
  background: var(--color-status-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
}

.selected-patient-avatar {
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

.selected-patient-text {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-status-success-text);
}

.status-pills,
.type-pills,
.priority-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-pill,
.type-pill,
.priority-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-body-main-size);
  font-weight: 500;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.status-pill:hover:not(.active),
.type-pill:hover:not(.active),
.priority-pill:hover:not(.active) {
  border-color: color-mix(in srgb, var(--color-primary-main) 24%, var(--color-border-light));
  color: var(--color-text-primary);
}

.status-pill.active.status-pill-critical {
  background: var(--color-status-danger-bg);
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 28%, transparent);
  color: var(--color-status-danger-text);
  font-weight: 600;
}

.status-pill.active.status-pill-stable {
  background: var(--color-status-success-bg);
  border-color: color-mix(in srgb, var(--color-status-success-indicator) 28%, transparent);
  color: var(--color-status-success-text);
  font-weight: 600;
}

.status-pill.active.status-pill-recovery {
  background: var(--color-status-warning-bg);
  border-color: color-mix(in srgb, var(--color-status-warning-indicator) 28%, transparent);
  color: var(--color-status-warning-text);
  font-weight: 600;
}

.type-pill.active {
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 28%, transparent);
  color: var(--color-primary-main);
  font-weight: 600;
  box-shadow: 0 1px 2px color-mix(in srgb, var(--color-primary-main) 12%, transparent);
}

.priority-pill.active.priority-pill-critico {
  background: var(--color-status-danger-bg);
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 28%, transparent);
  color: var(--color-status-danger-text);
  font-weight: 600;
}

.priority-pill.active.priority-pill-urgente {
  background: var(--color-status-warning-bg);
  border-color: color-mix(in srgb, var(--color-status-warning-indicator) 28%, transparent);
  color: var(--color-status-warning-text);
  font-weight: 600;
}

.priority-pill.active.priority-pill-en_espera {
  background: var(--color-status-info-bg);
  border-color: color-mix(in srgb, var(--color-status-info-indicator) 28%, transparent);
  color: var(--color-status-info-text);
  font-weight: 600;
}

.priority-pill.active.priority-pill-en_proceso {
  background: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 28%, transparent);
  color: var(--color-primary-main);
  font-weight: 600;
}

.hospital-form-actions {
  margin-top: 0;
  padding: 20px 28px;
  border-top: 1px solid var(--color-border-light);
  position: sticky;
  bottom: 0;
  background: var(--color-background-surface);
  border-radius: 0 0 var(--radius-large) var(--radius-large);
}

.hospital-form-modal .btn-cancel {
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

.hospital-form-modal .btn-cancel:hover {
  background: var(--color-background-main);
  color: var(--color-text-primary);
}

.hospital-form-modal .btn-submit {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.hospital-form-modal .btn-submit:hover {
  background: var(--color-primary-hover);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 28%, transparent);
}

.hospital-form-modal.modal-container {
  background: var(--color-background-surface);
  border-radius: var(--radius-large);
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--color-border-light);
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

.discharge-modal { z-index: 1100; }

.discharge-form-modal {
  max-width: 480px;
  background: var(--color-background-surface);
  border-radius: var(--radius-large);
  border: 1px solid var(--color-border-light);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.discharge-form-modal .modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.discharge-form-modal .modal-subtitle {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

.discharge-form-modal .btn-cancel {
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

.discharge-form-modal .btn-cancel:hover {
  background: var(--color-background-main);
  color: var(--color-text-primary);
}

.discharge-form-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 24px 28px 0;
}

.discharge-form-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-status-success-bg);
  color: var(--color-status-success-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 22%, transparent);
  font-size: 20px;
}

.discharge-form-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 28px 8px;
}

.discharge-patient-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: color-mix(in srgb, var(--color-primary-main) 5%, var(--color-background-surface));
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 14%, var(--color-border-light));
  border-radius: var(--radius-large);
  flex-wrap: wrap;
}

.discharge-patient-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  font-size: var(--font-body-main-size);
  font-weight: 700;
}

.discharge-patient-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.discharge-patient-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.discharge-patient-meta {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.discharge-message-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: var(--color-status-warning-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 22%, transparent);
  border-radius: var(--radius-large);
}

.discharge-message-card i {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--color-status-warning-indicator);
  font-size: 16px;
}

.discharge-message-card p {
  margin: 0;
  font-size: var(--font-body-main-size);
  color: var(--color-status-warning-text);
  line-height: 1.45;
}

.discharge-form-actions {
  margin-top: 0;
  padding: 20px 28px;
  border-top: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
}

.btn-discharge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--color-status-success-indicator);
  color: var(--color-primary-contrastText);
  border: none;
  border-radius: var(--radius-standard);
  padding: 10px 20px;
  font-size: var(--font-body-main-size);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease;
}

.btn-discharge:hover {
  background: color-mix(in srgb, var(--color-status-success-indicator) 88%, var(--color-text-primary));
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-status-success-indicator) 28%, transparent);
}

.hospital-intro-card-info {
  background: color-mix(in srgb, var(--color-status-info-indicator) 5%, var(--color-background-surface));
  border-color: color-mix(in srgb, var(--color-status-info-indicator) 14%, var(--color-border-light));
}

.hospital-intro-icon-info {
  background: var(--color-status-info-bg);
  color: var(--color-status-info-indicator);
}

.hospital-intro-patient {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.hospital-intro-patient strong {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

.hospital-intro-patient span {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
}

.patient-detail-modal {
  z-index: 9000;
  background: rgba(15, 23, 42, 0.75);
  padding: 24px;
}

.patient-detail-modal .modal-container {
  background: #ffffff;
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.patient-detail-modal .modal-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  background: #ffffff;
  z-index: 1;
  border-radius: 16px 16px 0 0;
}

.patient-detail-modal .modal-header-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  flex-shrink: 0;
}

.patient-detail-modal .modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.patient-detail-modal .modal-subtitle {
  font-size: 13px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.patient-detail-modal .modal-close {
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
  color: #64748b;
  font-size: 16px;
  transition: all 0.2s;
}

.patient-detail-modal .modal-close:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.patient-detail-modal .modal-body {
  padding: 24px 28px;
}

.patient-detail-modal .detail-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.patient-detail-modal .detail-section:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.patient-detail-modal .detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.patient-detail-modal .detail-title i {
  color: #0ea5e9;
  font-size: 15px;
}

.patient-detail-modal .detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.patient-detail-modal .detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.patient-detail-modal .detail-item span {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.patient-detail-modal .detail-item strong {
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.patient-detail-modal .detail-item-hint {
  font-size: 12px;
  color: #94a3b8;
  text-transform: none;
  letter-spacing: normal;
  font-weight: 400;
}

.patient-detail-modal .detail-item.span-full {
  grid-column: 1 / -1;
}

.patient-detail-modal .detail-patient-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.patient-detail-modal .detail-patient-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.patient-detail-modal .detail-patient-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.patient-detail-modal .detail-patient-name {
  font-size: 16px;
  color: #0f172a;
}

.patient-detail-modal .detail-patient-species {
  font-size: 13px;
  color: #64748b;
}

.patient-detail-modal .detail-patient-meta {
  font-size: 12px;
  color: #94a3b8;
}

.patient-detail-modal .detail-treatment-list {
  margin: 0;
  padding-left: 18px;
  color: #0f172a;
}

.patient-detail-modal .detail-treatment-list li {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
}

.patient-detail-modal .detail-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
}

.patient-detail-modal .btn-cancel {
  padding: 10px 20px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.patient-detail-modal .btn-cancel:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.modal-enter-active { animation: fadeIn 0.25s ease; }
.modal-leave-active { animation: fadeOut 0.2s ease; }
.modal-enter-active .modal-container { animation: scaleIn 0.25s ease; }
.modal-leave-active .modal-container { animation: scaleOut 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
@keyframes scaleOut { from { transform: scale(1); opacity: 1; } to { transform: scale(0.95); opacity: 0; } }

@media (max-width: 640px) {
  .patient-detail-modal .detail-grid {
    grid-template-columns: 1fr;
  }
}


.tracking-tasks-row {
  display: flex;
  gap: 24px;
  width: 100%;
  flex-wrap: wrap;
}


.tracking-card,
.tasks-widget {
  flex: 1;
  min-width: min(100%, 400px);
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  padding: 20px 22px;
  box-shadow: var(--shadow-card);
  box-sizing: border-box;
}

.tasks-widget {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.widget-header,
.tracking-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border-light);
  flex-wrap: wrap;
}

.widget-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.widget-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
}

.widget-icon-info {
  background: var(--color-status-info-bg);
  color: var(--color-status-info-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 20%, transparent);
}

.widget-icon-primary {
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, transparent);
}

.widget-title {
  font-size: var(--font-cardTitle-size);
  font-weight: var(--font-cardTitle-weight);
  color: var(--color-text-primary);
  margin: 0;
}

.widget-date {
  margin: 2px 0 0;
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  text-transform: capitalize;
}

.widget-count-badge {
  background: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  font-size: var(--font-body-caption-size);
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.tracking-empty .empty-hint {
  font-size: var(--font-body-caption-size);
  color: var(--color-text-muted);
}

.tracking-item.clickable {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.tracking-item.clickable:hover {
  background: color-mix(in srgb, var(--color-primary-main) 4%, var(--color-background-surface));
}

.entry-source {
  color: var(--color-primary-main);
  font-weight: 500;
}

.tracking-list { display: flex; flex-direction: column; gap: 0; }
.tracking-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-light) 80%, transparent);
}
.tracking-item:last-child { border-bottom: none; }

.tracking-item .icon-circle {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  overflow: hidden;
}

.variant-temperature { background: var(--color-status-info-bg); color: var(--color-status-info-indicator); }
.variant-medication { background: var(--color-status-success-bg); color: var(--color-status-success-indicator); }
.variant-food { background: var(--color-status-warning-bg); color: var(--color-status-warning-indicator); }
.variant-vitals { background: color-mix(in srgb, var(--color-primary-subtle) 80%, var(--color-status-info-bg)); color: var(--color-primary-main); }

.item-left { display: flex; align-items: flex-start; gap: 12px; }
.text-group { display: flex; flex-direction: column; gap: 2px; }
.item-title { font-weight: 600; font-size: 15px; color: var(--color-text-primary); }
.item-subtitle { font-size: var(--font-body-main-size); color: var(--color-text-secondary); }
.item-author { font-size: var(--font-body-caption-size); color: var(--color-text-muted); }
.item-right { display: flex; align-items: flex-start; }
.item-time { font-size: 13px; color: var(--color-text-secondary); }

.btn-add-task {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 20%, transparent);
  border-radius: var(--radius-standard);
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
}

.btn-add-task:hover {
  background: color-mix(in srgb, var(--color-primary-subtle) 70%, var(--color-primary-main) 8%);
}

.task-filter-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.task-filter-tab {
  background: var(--color-background-main);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-filter-tab.active {
  background: var(--color-primary-main);
  border-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
}

.tasks-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 16px;
  color: var(--color-text-muted);
  text-align: center;
}

.tasks-empty i {
  font-size: 28px;
}

.tasks-empty p {
  margin: 0;
  font-size: var(--font-body-main-size);
}

.patient-detail-modal .modal-header-icon-danger {
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-indicator);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 22%, transparent);
}

@media (max-width: 1024px) {
  .status-cards-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .tracking-tasks-row {
    flex-direction: column;
  }

  .tracking-card,
  .tasks-widget {
    min-width: 100%;
  }
}

.tab-count {
  opacity: 0.85;
}

.priority-hint {
  margin: 6px 0 0;
  font-size: var(--font-body-caption-size);
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.schedule-note {
  margin: 0 0 8px;
  padding: 10px 12px;
  background: var(--color-status-info-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-info-indicator) 24%, transparent);
  border-radius: var(--radius-standard);
  font-size: 13px;
  color: var(--color-status-info-text);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.tasks-list { display: flex; flex-direction: column; gap: 16px; }
.task-card {
  position: relative;
  border-radius: 10px;
  box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
}

.task-accent-bar {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-top-left-radius: 10px;
  border-bottom-left-radius: 10px;
}

.task-card-inner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  width: 100%;
  margin-left: 4px; 
}

.task-checkbox {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1.5px solid #d1d5db;
  background-color: #ffffff;
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s;
}

.task-checkbox.checked {
  background-color: #16a34a;
  border-color: #16a34a;
  color: #fff;
}

.task-checkbox i {
  font-size: 10px;
}

.task-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  cursor: pointer;
}

.task-content:hover .task-title {
  color: #0284c7;
}

.task-completed {
  opacity: 0.65;
}

.task-completed .task-title,
.task-completed .task-subtitle {
  text-decoration: line-through;
}

.task-view-patient {
  margin-left: auto;
  font-size: 11px;
  color: #0284c7;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.task-title { font-family: 'Inter', sans-serif; font-weight: 600; font-size: 15px; line-height: 22px; letter-spacing: -0.2px; color: #111827; transition: color 0.2s; }
.task-subtitle { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 13px; line-height: 20px; color: #6b7280; }

.task-footer { display: flex; align-items: center; gap: 8px; }
.task-badge {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 11px;
  line-height: 16px;
  letter-spacing: 0.2px;
  padding: 3px 8px;
  border-radius: 6px;
}
.task-time { font-family: 'Inter', sans-serif; font-weight: 400; font-size: 12px; line-height: 16px; color: #6b7280; }


.task-urgente { background-color: #fffbeb; border: 1px solid rgba(245, 158, 11, 0.3); }
.task-urgente .task-accent-bar { background-color: #f59e0b; }
.badge-urgente { background-color: #fef3c7; color: #b45309; }

.task-critico { background-color: #fef2f2; border: 1px solid rgba(239, 68, 68, 0.3); }
.task-critico .task-accent-bar { background-color: #ef4444; }
.badge-critico { background-color: #fee2e2; color: #b91c1c; }

.task-en_espera { background-color: #eff6ff; border: 1px solid rgba(59, 130, 246, 0.3); }
.task-en_espera .task-accent-bar { background-color: #3b82f6; }
.badge-en_espera { background-color: #dbeafe; color: #1d4ed8; }

.task-en_proceso { background-color: #f5f3ff; border: 1px solid rgba(139, 92, 246, 0.3); }
.task-en_proceso .task-accent-bar { background-color: #8b5cf6; }
.badge-en_proceso { background-color: #ede9fe; color: #6d28d9; }

.toast {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}

.toast-success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
.toast-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
.toast-info { background: #E0F2FE; color: #075985; border: 1px solid #BAE6FD; }
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
</style>
