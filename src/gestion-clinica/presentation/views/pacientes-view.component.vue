<script setup>
import { ref, computed, reactive, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { PatientService } from '../../infrastructure/services/patient.service.js';

const { t } = useI18n();
const router = useRouter();
const patientService = new PatientService();

const searchQuery = ref('');
const filterStatus = ref('Todos');
const showModal = ref(false);
const isSaving = ref(false);
const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const formErrors = reactive({});

const getDefaultForm = () => ({
  name: '', species: '', breed: '', sex: '',
  birthDate: '', weight: '', ownerName: '',
  ownerPhone: '', ownerEmail: '', allergies: '', notes: ''
});
const form = reactive(getDefaultForm());

const patients = ref([]);

const loadPatients = async () => {
  try {
    patients.value = await patientService.getAllPatients();
  } catch (error) {
    displayToast(t('clinicManagement.patients.registerForm.errorMessage'), 'error');
  }
};

onMounted(() => {
  loadPatients();
});

const filteredPatients = computed(() => {
  return patients.value.filter(p => {
    const s = searchQuery.value.toLowerCase();
    const codeStr = p.code || p.id || '';
    const matchesSearch = p.name.toLowerCase().includes(s) || p.owner.toLowerCase().includes(s) || codeStr.toString().toLowerCase().includes(s);
    return matchesSearch && (filterStatus.value === 'Todos' || p.status === filterStatus.value);
  });
});

const getStatusClass = (status) => {
  if (status === 'Activo') return 'status-active';
  if (status === 'Tratamiento') return 'status-treatment';
  return '';
};

const openModal = () => { Object.assign(form, getDefaultForm()); Object.keys(formErrors).forEach(k => delete formErrors[k]); showModal.value = true; };
const closeModal = () => { showModal.value = false; };

const validateForm = () => {
  Object.keys(formErrors).forEach(k => delete formErrors[k]);
  if (!form.name.trim()) formErrors.name = true;
  if (!form.species) formErrors.species = true;
  if (!form.breed.trim()) formErrors.breed = true;
  if (!form.ownerName.trim()) formErrors.ownerName = true;
  return Object.keys(formErrors).length === 0;
};

const displayToast = (msg, type) => {
  toastMessage.value = msg; toastType.value = type; showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
};

const calcAge = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const years = Math.floor(diff / 31557600000);
  if (years >= 1) return `${years} año${years > 1 ? 's' : ''}`;
  const months = Math.floor(diff / 2629800000);
  return `${months} mes${months !== 1 ? 'es' : ''}`;
};

const viewClinicalHistory = (patient) => {
  router.push({ path: '/gestion-clinica/historial', query: { patientId: patient.id } });
};

const submitForm = async () => {
  if (!validateForm()) return;
  isSaving.value = true;
  const code = `#P-${String(patients.value.length + 1).padStart(3, '0')}`;
  const payload = {
    code, name: form.name, species: `${form.species}${form.breed ? ' - ' + form.breed : ''}`,
    status: 'Activo', age: calcAge(form.birthDate),
    weight: form.weight ? `${form.weight} kg` : '', owner: form.ownerName,
    allergies: form.allergies.trim() || null,
    image: `https://placedog.net/150/150?id=${Math.floor(Math.random() * 70)}`
  };
  try {
    const newPatient = await patientService.createPatient(payload);
    patients.value.push(newPatient);
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

    
    <div class="actions-bar">
      <div class="view-info">
        <h1 class="view-title">{{ t('clinicManagement.patients.title') }}</h1>
        <p class="view-description">{{ t('clinicManagement.patients.description') }}</p>
      </div>
      <button class="btn-primary" @click="openModal">
        <i class="pi pi-plus"></i>
        {{ t('clinicManagement.patients.register') }}
      </button>
    </div>

    
    <div class="filters-card">
      <div class="search-box">
        <i class="pi pi-search search-icon"></i>
        <input type="text" v-model="searchQuery" :placeholder="t('clinicManagement.patients.search')" class="search-input" />
      </div>
      <div class="filter-select-wrapper">
        <select v-model="filterStatus" class="filter-select">
          <option value="Todos">{{ t('clinicManagement.patients.allSpecies') }}</option>
          <option value="Activo">{{ t('clinicManagement.patients.status.Activo') }}</option>
          <option value="Tratamiento">{{ t('clinicManagement.patients.status.Tratamiento') }}</option>
        </select>
        <i class="pi pi-chevron-down select-icon"></i>
      </div>
    </div>

    
    <div class="patients-grid">
      <div class="patient-card" v-for="patient in filteredPatients" :key="patient.id">
        <div class="card-header">
          <div class="patient-profile">
            <img :src="patient.image" :alt="patient.name" class="patient-image" />
            <div class="patient-name-container">
              <h2 class="patient-name">{{ patient.name }}</h2>
              <span class="patient-id">{{ patient.code || patient.id }}</span>
            </div>
          </div>
          <span :class="['status-badge', getStatusClass(patient.status)]">{{ t(`clinicManagement.patients.status.${patient.status}`) }}</span>
        </div>
        <div v-if="patient.allergies" class="allergy-alert">
          <i class="pi pi-exclamation-triangle allergy-icon"></i>
          <span><strong>{{ t('clinicManagement.patients.registerForm.allergies') }}:</strong> {{ patient.allergies }}</span>
        </div>
        <div class="card-body">
          <div class="patient-data-list">
            <div class="data-row">
              <span class="data-label"><i class="pi pi-tag data-icon"></i> {{ t('clinicManagement.patients.fields.species') }}:</span>
              <span class="data-value">{{ patient.species }}</span>
            </div>
            <div class="data-row">
              <span class="data-label"><i class="pi pi-calendar data-icon"></i> {{ t('clinicManagement.patients.fields.age') }}:</span>
              <span class="data-value">{{ patient.age }}</span>
            </div>
            <div class="data-row">
              <span class="data-label"><i class="pi pi-chart-line data-icon"></i> {{ t('clinicManagement.patients.fields.weight') }}:</span>
              <span class="data-value">{{ patient.weight }}</span>
            </div>
            <div class="data-row">
              <span class="data-label"><i class="pi pi-user data-icon"></i> {{ t('clinicManagement.patients.fields.owner') }}:</span>
              <span class="data-value">{{ patient.owner }}</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <button class="btn-link" @click="viewClinicalHistory(patient)">
            {{ t('clinicManagement.patients.viewRecord') }}
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>

    
    <div v-if="filteredPatients.length === 0" class="empty-state">
      <i class="pi pi-inbox empty-icon"></i>
      <h3>{{ t('clinicManagement.patients.emptyState.title') }}</h3>
      <p>{{ t('clinicManagement.patients.emptyState.description') }}</p>
    </div>

    
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-heart"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.patients.registerForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.patients.registerForm.subtitle') }}</p>
            </div>
            <button class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="modal-body" @submit.prevent="submitForm">
            
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-github"></i> {{ t('clinicManagement.patients.registerForm.petInfo') }}</h3>
              <div class="form-grid">
                <div class="form-group" :class="{ 'has-error': formErrors.name }">
                  <label>{{ t('clinicManagement.patients.registerForm.name') }} *</label>
                  <input type="text" v-model="form.name" :placeholder="t('clinicManagement.patients.registerForm.namePlaceholder')" />
                  <span v-if="formErrors.name" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': formErrors.species }">
                  <label>{{ t('clinicManagement.patients.registerForm.speciesSelect') }} *</label>
                  <select v-model="form.species">
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
                  <label>{{ t('clinicManagement.patients.registerForm.breed') }} *</label>
                  <input type="text" v-model="form.breed" :placeholder="t('clinicManagement.patients.registerForm.breedPlaceholder')" />
                  <span v-if="formErrors.breed" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.patients.registerForm.sex') }}</label>
                  <select v-model="form.sex">
                    <option value="">{{ t('clinicManagement.patients.registerForm.sexPlaceholder') }}</option>
                    <option value="M">{{ t('clinicManagement.patients.registerForm.sexMale') }}</option>
                    <option value="H">{{ t('clinicManagement.patients.registerForm.sexFemale') }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.patients.registerForm.birthDate') }}</label>
                  <input type="date" v-model="form.birthDate" />
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.patients.registerForm.weight') }}</label>
                  <input type="number" step="0.1" min="0" v-model="form.weight" :placeholder="t('clinicManagement.patients.registerForm.weightPlaceholder')" />
                </div>
              </div>
            </div>

            
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-user"></i> {{ t('clinicManagement.patients.registerForm.ownerInfo') }}</h3>
              <div class="form-grid">
                <div class="form-group" :class="{ 'has-error': formErrors.ownerName }">
                  <label>{{ t('clinicManagement.patients.registerForm.ownerName') }} *</label>
                  <input type="text" v-model="form.ownerName" :placeholder="t('clinicManagement.patients.registerForm.ownerNamePlaceholder')" />
                  <span v-if="formErrors.ownerName" class="error-text">{{ t('clinicManagement.patients.registerForm.required') }}</span>
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.patients.registerForm.ownerPhone') }}</label>
                  <input type="tel" v-model="form.ownerPhone" :placeholder="t('clinicManagement.patients.registerForm.ownerPhonePlaceholder')" />
                </div>
                <div class="form-group span-full">
                  <label>{{ t('clinicManagement.patients.registerForm.ownerEmail') }}</label>
                  <input type="email" v-model="form.ownerEmail" :placeholder="t('clinicManagement.patients.registerForm.ownerEmailPlaceholder')" />
                </div>
              </div>
            </div>


            <div class="form-section">
              <div class="form-grid">
                <div class="form-group span-full allergy-field">
                  <label><i class="pi pi-exclamation-triangle" style="color:#ef4444;margin-right:6px;font-size:13px;"></i>{{ t('clinicManagement.patients.registerForm.allergies') }}</label>
                  <input type="text" v-model="form.allergies" :placeholder="t('clinicManagement.patients.registerForm.allergiesPlaceholder')" />
                </div>
                <div class="form-group span-full">
                  <label>{{ t('clinicManagement.patients.registerForm.notes') }}</label>
                  <textarea v-model="form.notes" :placeholder="t('clinicManagement.patients.registerForm.notesPlaceholder')" rows="3"></textarea>
                </div>
              </div>
            </div>

            
            <div class="modal-actions">
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
  </div>
</template>

<style scoped>
.pacientes-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
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


.filters-card {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
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

.search-input::placeholder {
  color: #9CA3AF;
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


.patients-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.patient-card {
  background-color: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  border: 1px solid #E2E8F0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.patient-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.patient-profile {
  display: flex;
  align-items: center;
  gap: 12px;
}

.patient-image {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #F8FAFC;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}

.status-active {
  background-color: #DCFCE7;
  color: #15803D;
}

.status-treatment {
  background-color: #FEF9C3;
  color: #A16207;
}

.allergy-alert {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-left: 3px solid #ef4444;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: #be123c;
}

.allergy-icon {
  color: #ef4444;
  font-size: 14px;
  flex-shrink: 0;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.patient-name-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.patient-name {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
  margin: 0;
}

.patient-id {
  font-size: 12px;
  color: #64748B;
  background-color: #F1F5F9;
  padding: 2px 6px;
  border-radius: 4px;
}

.patient-data-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-row {
  display: flex;
  font-size: 14px;
  align-items: center;
}

.data-label {
  color: #64748B;
  width: 110px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.data-icon {
  font-size: 12px;
  color: #94A3B8;
}

.data-value {
  color: #334155;
  font-weight: 500;
}

.card-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #F1F5F9;
}

.btn-link {
  background: none;
  border: none;
  color: #0EA5E9;
  font-size: 14px;
  font-weight: 600;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}

.btn-link:hover {
  color: #0284C7;
}

.btn-link i {
  font-size: 12px;
}


.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px dashed #CBD5E1;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: #94A3B8;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 18px;
  color: #1E293B;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: #64748B;
  margin: 0;
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
.form-group select,
.form-group textarea {
  padding: 10px 12px; border: 1px solid #E2E8F0; border-radius: 8px;
  font-size: 14px; color: #1E293B; background: #FFFFFF;
  outline: none; transition: all 0.2s; font-family: inherit;
  width: 100%; box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: #0EA5E9; box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
}
.form-group input::placeholder,
.form-group textarea::placeholder { color: #94A3B8; }
.form-group textarea { resize: vertical; min-height: 72px; }
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
