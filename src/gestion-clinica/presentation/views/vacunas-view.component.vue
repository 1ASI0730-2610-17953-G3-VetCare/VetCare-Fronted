<script setup>
import { ref, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const searchQuery = ref('');
const filterStatus = ref('Todos');
const showModal = ref(false);
const isSaving = ref(false);
const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const formErrors = reactive({});

const getDefaultForm = () => ({
  patientName: '',
  species: '',
  vaccineName: '',
  disease: '',
  lastApplication: '',
  nextDose: ''
});
const form = reactive(getDefaultForm());

const vaccines = ref([
  {
    id: 'V-001',
    patientName: 'Max',
    species: 'Perro',
    vaccineName: 'Antirrábica',
    disease: 'Rabia',
    lastApplication: '25 Oct 2022',
    nextDose: '25 Oct 2023',
    status: 'Vencida',
    type: 'danger'
  },
  {
    id: 'V-002',
    patientName: 'Luna',
    species: 'Gato',
    vaccineName: 'Triple Felina',
    disease: 'Panleucopenia, Rinotraqueítis, Calicivirus',
    lastApplication: '30 Oct 2022',
    nextDose: '30 Oct 2023',
    status: 'Próxima',
    type: 'warning'
  },
  {
    id: 'V-003',
    patientName: 'Rocky',
    species: 'Perro',
    vaccineName: 'Parvovirus',
    disease: 'Parvovirosis canina',
    lastApplication: '15 Nov 2022',
    nextDose: '15 Nov 2023',
    status: 'Al Día',
    type: 'success'
  },
  {
    id: 'V-004',
    patientName: 'Bella',
    species: 'Perro',
    vaccineName: 'Séxtuple',
    disease: 'Distemper, Parvovirus, Hepatitis...',
    lastApplication: '22 Oct 2022',
    nextDose: '22 Oct 2023',
    status: 'Vencida',
    type: 'danger'
  },
  {
    id: 'V-005',
    patientName: 'Simba',
    species: 'Gato',
    vaccineName: 'Leucemia',
    disease: 'Leucemia viral felina',
    lastApplication: '02 Nov 2022',
    nextDose: '02 Nov 2023',
    status: 'Próxima',
    type: 'warning'
  }
]);

const getAvatarImage = (patientName) => {
  if (patientName === 'Max') return 'https://placedog.net/150/150?id=30';
  if (patientName === 'Luna') return 'https://placecats.com/neo/150/150';
  if (patientName === 'Rocky') return 'https://placedog.net/150/150?id=32';
  if (patientName === 'Bella') return 'https://placedog.net/150/150?id=34';
  if (patientName === 'Simba') return 'https://placecats.com/millie/150/150';
  return null;
};

const getSpeciesClass = (species) => {
  if (species === 'Perro') return 'species-dog';
  if (species === 'Gato') return 'species-cat';
  return 'species-default';
};

const openModal = () => { Object.assign(form, getDefaultForm()); Object.keys(formErrors).forEach(k => delete formErrors[k]); showModal.value = true; };
const closeModal = () => { showModal.value = false; };

const validateForm = () => {
  Object.keys(formErrors).forEach(k => delete formErrors[k]);
  if (!form.patientName.trim()) formErrors.patientName = true;
  if (!form.species) formErrors.species = true;
  if (!form.vaccineName.trim()) formErrors.vaccineName = true;
  if (!form.lastApplication) formErrors.lastApplication = true;
  return Object.keys(formErrors).length === 0;
};

const displayToast = (msg, type) => {
  toastMessage.value = msg; toastType.value = type; showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const filteredVaccines = computed(() => {
  return vaccines.value.filter(vaccine => {
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

const expiredCount = computed(() => vaccines.value.filter(v => v.status === 'Vencida').length);
const upcomingCount = computed(() => vaccines.value.filter(v => v.status === 'Próxima').length);
const upToDateCount = computed(() => vaccines.value.filter(v => v.status === 'Al Día').length);

const submitForm = async () => {
  if (!validateForm()) return;
  isSaving.value = true;
  
  try {
    await new Promise(resolve => setTimeout(resolve, 800));
    const newId = `V-${String(vaccines.value.length + 1).padStart(3, '0')}`;
    
    let status = 'Al Día';
    let type = 'success';
    if (form.nextDose) {
      const nextDate = new Date(form.nextDose + 'T00:00:00').getTime();
      const now = new Date().getTime();
      const daysDiff = (nextDate - now) / (1000 * 3600 * 24);
      
      if (daysDiff < 0) { status = 'Vencida'; type = 'danger'; }
      else if (daysDiff <= 30) { status = 'Próxima'; type = 'warning'; }
    }
    
    const newVaccine = {
      id: newId,
      patientName: form.patientName,
      species: form.species,
      vaccineName: form.vaccineName,
      disease: form.disease || '-',
      lastApplication: formatDate(form.lastApplication),
      nextDose: form.nextDose ? formatDate(form.nextDose) : '-',
      status, type
    };
    
    vaccines.value.unshift(newVaccine);
    displayToast(t('clinicManagement.vaccines.registerForm.successMessage'), 'success');
    closeModal();
  } catch (e) {
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

    
    <div class="actions-bar">
      <div class="view-info">
        <h1 class="view-title">{{ t('clinicManagement.vaccines.title') }}</h1>
        <p class="view-description">{{ t('clinicManagement.vaccines.description') }}</p>
      </div>
      <button class="btn-primary" @click="openModal">
        <i class="pi pi-plus"></i>
        {{ t('clinicManagement.vaccines.register') }}
      </button>
    </div>

    
    <div class="status-cards-row">
      
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

    
    <div class="filters-card">
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
        <i class="pi pi-chevron-down select-icon"></i>
      </div>
    </div>

    
    <div class="table-container">
      <table class="vaccine-table">
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
          <tr v-for="vaccine in filteredVaccines" :key="vaccine.id">
            <td>
              <div class="patient-cell">
                <div :class="['species-avatar', getSpeciesClass(vaccine.species)]">
                  <img v-if="getAvatarImage(vaccine.patientName)" :src="getAvatarImage(vaccine.patientName)" :alt="vaccine.patientName" class="patient-image" />
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
              <span :class="['vaccine-date', vaccine.status !== 'Al Día' ? `text-${vaccine.type}` : '']" :style="vaccine.status !== 'Al Día' ? 'font-weight: 500;' : ''">{{ vaccine.nextDose }}</span>
            </td>
            <td>
              <span :class="['status-badge', `badge-${vaccine.type}`]">
                {{ t(`clinicManagement.vaccines.status.${vaccine.status}`) }}
              </span>
            </td>
            <td>
              <button class="btn-link">{{ t('clinicManagement.vaccines.viewDetails') }}</button>
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

    
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-shield"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.vaccines.registerForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.vaccines.registerForm.subtitle') }}</p>
            </div>
            <button class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="modal-body" @submit.prevent="submitForm">
            
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-user"></i> {{ t('clinicManagement.vaccines.registerForm.patientInfo') }}</h3>
              <div class="form-grid">
                <div class="form-group" :class="{ 'has-error': formErrors.patientName }">
                  <label>{{ t('clinicManagement.vaccines.registerForm.patientName') }} *</label>
                  <input type="text" v-model="form.patientName" :placeholder="t('clinicManagement.vaccines.registerForm.patientNamePlaceholder')" />
                  <span v-if="formErrors.patientName" class="error-text">{{ t('clinicManagement.vaccines.registerForm.required') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': formErrors.species }">
                  <label>{{ t('clinicManagement.vaccines.registerForm.species') }} *</label>
                  <select v-model="form.species">
                    <option value="">{{ t('clinicManagement.vaccines.registerForm.speciesPlaceholder') }}</option>
                    <option value="Perro">Perro</option>
                    <option value="Gato">Gato</option>
                    <option value="Otro">Otro</option>
                  </select>
                  <span v-if="formErrors.species" class="error-text">{{ t('clinicManagement.vaccines.registerForm.required') }}</span>
                </div>
              </div>
            </div>

            
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-heart-fill"></i> {{ t('clinicManagement.vaccines.registerForm.vaccineInfo') }}</h3>
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
            </div>

            
            <div class="modal-actions">
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
  </div>
</template>

<style scoped>
.vacunas-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'Inter', system-ui, sans-serif;
}


.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.view-title {
  font-size: 20px;
  line-height: 28px;
  font-weight: 700;
  color: #111827;
  letter-spacing: -0.5px;
  margin: 0 0 4px 0;
}

.view-description {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: -0.5px;
  margin: 0;
}

.btn-primary {
  background-color: #0EA5E9;
  color: #FFFFFF;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #0284C7;
}


.status-cards-row {
  display: flex;
  flex-direction: row;
  gap: 24px;
  align-items: stretch;
  width: 100%;
}

.status-card {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 8px;
  padding: 25px;
  flex: 1;
  height: 158px;
  border-radius: 12px;
  box-sizing: border-box;
}

.card-header-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 48px;
}

.icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 9999px;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #ffffff;
  font-size: 20px;
}

.count-number {
  font-size: 30px;
  line-height: 36px;
  font-weight: bold;
  letter-spacing: -0.5px;
  margin: 0;
}

.card-title {
  font-size: 18px;
  line-height: 28px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin: 3px 0 4px 0;
}

.card-subtitle {
  font-size: 14px;
  line-height: 20px;
  font-weight: normal;
  margin: 0;
}


.card-danger {
  border: 1px solid #fecaca;
  background: linear-gradient(45deg, #fef2f2 0%, #fee2e2 100%);
}
.icon-danger { background-color: #ef4444; }
.text-danger { color: #dc2626; }
.title-danger { color: #991b1b; }
.subtitle-danger { color: #dc2626; }


.card-warning {
  border: 1px solid #fef08a;
  background: linear-gradient(45deg, #fefce8 0%, #fef9c3 100%);
}
.icon-warning { background-color: #eab308; }
.text-warning { color: #ca8a04; }
.title-warning { color: #854d0e; }
.subtitle-warning { color: #ca8a04; }


.card-success {
  border: 1px solid #bbf7d0;
  background: linear-gradient(45deg, #f0fdf4 0%, #dcfce7 100%);
}
.icon-success { background-color: #22c55e; }
.text-success { color: #16a34a; }
.title-success { color: #166534; }
.subtitle-success { color: #16a34a; }


.filters-card {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #E2E8F0;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9CA3AF;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 36px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  color: #334155;
  background-color: #FFFFFF;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #0EA5E9;
}

.filter-select-wrapper {
  position: relative;
  min-width: 180px;
}

.filter-select {
  width: 100%;
  padding: 10px 32px 10px 12px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 14px;
  color: #334155;
  background-color: #FFFFFF;
  outline: none;
  appearance: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #0EA5E9;
}

.select-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748B;
  pointer-events: none;
  font-size: 12px;
}


.table-container {
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  overflow: hidden;
}

.vaccine-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.vaccine-table th {
  padding: 16px 24px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: #64748B;
  background-color: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
}

.vaccine-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
}

.vaccine-table tr:last-child td {
  border-bottom: none;
}

.patient-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.species-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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
  font-size: 14px;
}

.species-dog {
  background-color: #dbeafe;
  color: #2563eb;
}

.species-cat {
  background-color: #ffedd5;
  color: #ea580c;
}

.species-default {
  background-color: #dcfce7;
  color: #16a34a;
}

.patient-name {
  font-size: 16px;
  font-weight: 500;
  color: #1E293B;
}

.vaccine-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vaccine-name {
  font-size: 16px;
  font-weight: 500;
  color: #1E293B;
}

.vaccine-disease {
  font-size: 14px;
  font-weight: 400;
  color: #64748B;
}

.vaccine-date {
  font-size: 14px;
  font-weight: 400;
  color: #4b5563;
}

.vaccine-date.text-danger {
  color: #dc2626;
}

.vaccine-date.text-warning {
  color: #ca8a04;
}

.vaccine-date.text-success {
  color: #16a34a;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.badge-danger {
  background-color: #fee2e2;
  color: #b91c1c;
}

.badge-warning {
  background-color: #fef9c3;
  color: #a16207;
}

.badge-success {
  background-color: #dcfce7;
  color: #15803d;
}

.btn-link {
  background: none;
  border: none;
  color: #0ea5e9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.btn-link:hover {
  color: #0284c7;
}


.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 16px;
}

.results-summary {
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  color: #6b7280;
  letter-spacing: -0.5px;
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
  background-color: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(.active), .pagination-nav-btn:hover:not(.disabled-btn) {
  background-color: #f3f4f6;
}

.pagination-btn.active {
  background-color: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  font-weight: 600;
}

.disabled-btn {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #f9fafb;
}

.pagination-dots {
  color: #6b7280;
  font-size: 14px;
  padding: 0 4px;
}

.pagination-nav-btn i {
  font-size: 12px;
}


.toast {
  position: fixed; top: 24px; right: 24px; z-index: 10000;
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  animation: slideIn 0.3s ease;
}
.toast-success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
.toast-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
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
  background: #FFFFFF; border-radius: 16px;
  width: 100%; max-width: 680px; max-height: 90vh;
  overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}


.modal-header {
  display: flex; align-items: center; gap: 16px;
  padding: 24px 28px; border-bottom: 1px solid #E2E8F0;
  position: sticky; top: 0; background: #FFFFFF; z-index: 1;
  border-radius: 16px 16px 0 0;
}
.modal-header-icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg, #0EA5E9, #0284C7);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 20px; flex-shrink: 0;
}
.modal-title { font-size: 18px; font-weight: 700; color: #0F172A; margin: 0; }
.modal-subtitle { font-size: 13px; color: #64748B; margin: 4px 0 0 0; }
.modal-close {
  margin-left: auto; background: none; border: none; cursor: pointer;
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #64748B; font-size: 16px; transition: all 0.2s;
}
.modal-close:hover { background: #F1F5F9; color: #0F172A; }


.modal-body { padding: 24px 28px; }


.form-section {
  margin-bottom: 24px; padding-bottom: 20px;
  border-bottom: 1px solid #F1F5F9;
}
.form-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.section-label {
  font-size: 14px; font-weight: 600; color: #334155;
  margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;
}
.section-label i { color: #0EA5E9; font-size: 15px; }


.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.span-full { grid-column: 1 / -1; }
.form-group label {
  font-size: 13px; font-weight: 500; color: #475569;
}
.form-group input,
.form-group select {
  padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: 8px;
  font-size: 14px; color: #1E293B; background: #FFFFFF;
  outline: none; transition: all 0.2s; font-family: inherit;
  width: 100%; box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus {
  border-color: #0EA5E9; box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
}
.form-group input::placeholder { color: #94A3B8; }
.form-group select { cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
  padding-right: 32px;
}


.has-error input, .has-error select { border-color: #EF4444; }
.has-error input:focus, .has-error select:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
.error-text { font-size: 12px; color: #EF4444; font-weight: 500; }


.modal-actions {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 20px 28px; border-top: 1px solid #E2E8F0;
  position: sticky; bottom: 0; background: #FFFFFF;
  border-radius: 0 0 16px 16px;
}
.btn-cancel {
  padding: 10px 20px; border-radius: 8px; border: 1px solid #E2E8F0;
  background: #FFFFFF; color: #475569; font-size: 14px;
  font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover { background: #F8FAFC; border-color: #CBD5E1; }
.btn-submit {
  padding: 10px 24px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #0EA5E9, #0284C7);
  color: #FFFFFF; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.btn-submit:hover { background: linear-gradient(135deg, #0284C7, #0369A1); box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }


@media (max-width: 640px) {
  .modal-overlay { padding: 12px; }
  .modal-container { max-height: 95vh; }
  .modal-header { padding: 16px 20px; }
  .modal-body { padding: 16px 20px; }
  .modal-actions { padding: 16px 20px; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group.span-full { grid-column: 1; }
}
</style>
