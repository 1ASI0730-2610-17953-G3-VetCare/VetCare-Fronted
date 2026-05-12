<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useClientStore } from '../../application/store/client.store.js';

const { t } = useI18n();
const clientStore = useClientStore();

const searchQuery = ref('');
const filterStatus = ref('Todos');
const showModal = ref(false);
const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const formErrors = reactive({});

const getDefaultForm = () => ({
  fullName: '',
  documentId: '',
  phone: '',
  email: '',
  address: '',
  status: 'Activo'
});
const form = reactive(getDefaultForm());

onMounted(async () => {
  try {
    await clientStore.fetchClients();
  } catch (error) {
    displayToast(t('clinicManagement.clients.registerForm.errorMessage'), 'error');
  }
});

const getStatusClass = (status) => {
  if (status === 'Activo') return 'badge-success';
  if (status === 'Inactivo') return 'badge-warning';
  return 'badge-success';
};

const openModal = () => { Object.assign(form, getDefaultForm()); Object.keys(formErrors).forEach(k => delete formErrors[k]); showModal.value = true; };
const closeModal = () => { showModal.value = false; };

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
    <!-- Toast -->
    <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <!-- Header -->
    <div class="actions-bar">
      <div class="view-info">
        <h1 class="view-title">{{ t('clinicManagement.clients.title') }}</h1>
        <p class="view-description">{{ t('clinicManagement.clients.description') }}</p>
      </div>
      <button class="btn-primary" @click="openModal">
        <i class="pi pi-user-plus"></i>
        {{ t('clinicManagement.clients.register') }}
      </button>
    </div>

    <!-- Status Cards Row -->
    <div class="status-cards-row">
      <!-- Total Card -->
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

      <!-- Active Card -->
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

      <!-- New Card -->
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

    <!-- Filter Action Bar -->
    <div class="filters-card">
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
        <i class="pi pi-chevron-down select-icon"></i>
      </div>
    </div>

    <!-- Clients Table -->
    <div class="table-container">
      <div v-if="clientStore.loading" class="loading-state">
        <i class="pi pi-spin pi-spinner loading-icon"></i>
      </div>
      <table v-else class="clients-table">
        <thead>
          <tr>
            <th>{{ t('clinicManagement.clients.columns.client') }}</th>
            <th>{{ t('clinicManagement.clients.columns.contact') }}</th>
            <th>{{ t('clinicManagement.clients.columns.pets') }}</th>
            <th>{{ t('clinicManagement.clients.columns.lastVisit') }}</th>
            <th>{{ t('clinicManagement.clients.columns.status') }}</th>
            <th>{{ t('clinicManagement.clients.columns.actions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="client in filteredClients" :key="client.id">
            <td>
              <div class="client-cell">
                <div class="avatar-circle">
                  {{ client.fullName.charAt(0).toUpperCase() }}
                </div>
                <div class="client-info">
                  <span class="client-name">{{ client.fullName }}</span>
                  <span class="client-doc">DNI: {{ client.documentId }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="contact-cell">
                <span class="contact-text"><i class="pi pi-phone"></i> {{ client.phone }}</span>
                <span class="contact-text"><i class="pi pi-envelope"></i> {{ client.email || '-' }}</span>
              </div>
            </td>
            <td>
              <span class="pets-count"><i class="pi pi-heart"></i> {{ client.petsCount }}</span>
            </td>
            <td>
              <span class="visit-date">{{ client.lastVisitAt || '-' }}</span>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(client.status)]">
                {{ t(`clinicManagement.clients.status.${client.status}`) }}
              </span>
            </td>
            <td>
              <button class="btn-link">{{ t('clinicManagement.clients.viewDetails') }}</button>
            </td>
          </tr>
          <tr v-if="filteredClients.length === 0">
            <td colspan="6">
              <div class="empty-state">
                <i class="pi pi-inbox empty-icon"></i>
                <p>No se encontraron clientes</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal Registrar Cliente -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-user-plus"></i></div>
            <div>
              <h2 class="modal-title">{{ t('clinicManagement.clients.registerForm.title') }}</h2>
              <p class="modal-subtitle">{{ t('clinicManagement.clients.registerForm.subtitle') }}</p>
            </div>
            <button class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="modal-body" @submit.prevent="submitForm">
            <!-- Personal Info -->
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-id-card"></i> {{ t('clinicManagement.clients.registerForm.personalInfo') }}</h3>
              <div class="form-grid">
                <div class="form-group span-full" :class="{ 'has-error': formErrors.fullName }">
                  <label>{{ t('clinicManagement.clients.registerForm.fullName') }} *</label>
                  <input type="text" v-model="form.fullName" :placeholder="t('clinicManagement.clients.registerForm.fullNamePlaceholder')" />
                  <span v-if="formErrors.fullName" class="error-text">{{ t('clinicManagement.clients.registerForm.required') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': formErrors.documentId }">
                  <label>{{ t('clinicManagement.clients.registerForm.documentId') }} *</label>
                  <input type="text" v-model="form.documentId" :placeholder="t('clinicManagement.clients.registerForm.documentIdPlaceholder')" />
                  <span v-if="formErrors.documentId" class="error-text">{{ t('clinicManagement.clients.registerForm.required') }}</span>
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.clients.registerForm.status') }}</label>
                  <select v-model="form.status">
                    <option value="Activo">{{ t('clinicManagement.clients.status.Activo') }}</option>
                    <option value="Inactivo">{{ t('clinicManagement.clients.status.Inactivo') }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Contact Info -->
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-address-book"></i> {{ t('clinicManagement.clients.registerForm.contactInfo') }}</h3>
              <div class="form-grid">
                <div class="form-group" :class="{ 'has-error': formErrors.phone }">
                  <label>{{ t('clinicManagement.clients.registerForm.phone') }} *</label>
                  <input type="text" v-model="form.phone" :placeholder="t('clinicManagement.clients.registerForm.phonePlaceholder')" />
                  <span v-if="formErrors.phone" class="error-text">{{ t('clinicManagement.clients.registerForm.required') }}</span>
                </div>
                <div class="form-group">
                  <label>{{ t('clinicManagement.clients.registerForm.email') }}</label>
                  <input type="email" v-model="form.email" :placeholder="t('clinicManagement.clients.registerForm.emailPlaceholder')" />
                </div>
                <div class="form-group span-full">
                  <label>{{ t('clinicManagement.clients.registerForm.address') }}</label>
                  <input type="text" v-model="form.address" :placeholder="t('clinicManagement.clients.registerForm.addressPlaceholder')" />
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
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
  </div>
</template>

<style scoped>
.clientes-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
  font-family: 'Inter', system-ui, sans-serif;
}

/* Header */
.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.view-title {
  font-size: 24px;
  font-weight: 600;
  color: #1E293B;
  margin: 0 0 4px 0;
}

.view-description {
  font-size: 14px;
  color: #64748B;
  margin: 0;
}

.btn-primary {
  background: linear-gradient(135deg, #0EA5E9, #0284C7);
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
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(14, 165, 233, 0.2);
}

.btn-primary:hover {
  background: linear-gradient(135deg, #0284C7, #0369A1);
  box-shadow: 0 4px 10px rgba(14, 165, 233, 0.4);
  transform: translateY(-2px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Status Cards Row */
.status-cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
  padding: 20px;
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
  font-size: 28px;
  line-height: 36px;
  font-weight: bold;
  letter-spacing: -0.5px;
  margin: 0;
}

.card-title {
  font-size: 16px;
  line-height: 24px;
  font-weight: 600;
  letter-spacing: -0.5px;
  margin: 4px 0 0 0;
}

.card-subtitle {
  font-size: 13px;
  line-height: 20px;
  font-weight: normal;
  margin: 0;
}

/* Info Variant */
.card-info {
  border: 1px solid #e0f2fe;
  background: linear-gradient(45deg, #f0f9ff 0%, #e0f2fe 100%);
}
.icon-info { background-color: #0ea5e9; }
.text-info { color: #0284c7; }
.title-info { color: #0369a1; }
.subtitle-info { color: #0284c7; }

/* Primary Variant */
.card-primary {
  border: 1px solid #e0e7ff;
  background: linear-gradient(45deg, #eef2ff 0%, #e0e7ff 100%);
}
.icon-primary { background-color: #6366f1; }
.text-primary { color: #4338ca; }
.title-primary { color: #3730a3; }
.subtitle-primary { color: #4338ca; }

/* Danger Variant */
.card-danger {
  border: 1px solid #fecaca;
  background: linear-gradient(45deg, #fef2f2 0%, #fee2e2 100%);
}
.icon-danger { background-color: #ef4444; }
.text-danger { color: #dc2626; }
.title-danger { color: #991b1b; }
.subtitle-danger { color: #dc2626; }

/* Success Variant */
.card-success {
  border: 1px solid #bbf7d0;
  background: linear-gradient(45deg, #f0fdf4 0%, #dcfce7 100%);
}
.icon-success { background-color: #22c55e; }
.text-success { color: #16a34a; }
.title-success { color: #166534; }
.subtitle-success { color: #16a34a; }

/* Filters */
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
  box-sizing: border-box;
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
  box-sizing: border-box;
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

/* Table */
.table-container {
  background-color: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
  overflow-x: auto;
}

.clients-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.clients-table th {
  padding: 16px 24px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1px;
  color: #64748B;
  background-color: #F8FAFC;
  border-bottom: 1px solid #E2E8F0;
  white-space: nowrap;
}

.clients-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #F1F5F9;
  vertical-align: middle;
}

.clients-table tr:last-child td {
  border-bottom: none;
}

.client-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f1f5f9;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.client-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.client-name {
  font-size: 15px;
  font-weight: 500;
  color: #1E293B;
}

.client-doc {
  font-size: 13px;
  font-weight: 400;
  color: #64748B;
}

.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.contact-text {
  font-size: 13px;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
}

.contact-text i {
  color: #94a3b8;
  font-size: 12px;
}

.pets-count {
  font-size: 14px;
  color: #334155;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pets-count i {
  color: #f43f5e;
}

.visit-date {
  font-size: 14px;
  color: #475569;
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

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
  color: #64748b;
}

.loading-icon, .empty-icon {
  font-size: 32px;
  margin-bottom: 16px;
  color: #94a3b8;
}

/* Toast */
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

/* Modal Overlay */
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

/* Modal Container */
.modal-container {
  background: #FFFFFF; border-radius: 16px;
  width: 100%; max-width: 680px; max-height: 90vh;
  overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

/* Modal Header */
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

/* Modal Body */
.modal-body { padding: 24px 28px; }

/* Form Sections */
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

/* Form Grid */
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

/* Validation Errors */
.has-error input, .has-error select { border-color: #EF4444; }
.has-error input:focus, .has-error select:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
.error-text { font-size: 12px; color: #EF4444; font-weight: 500; }

/* Modal Actions */
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
.btn-submit:hover:not(:disabled) { background: linear-gradient(135deg, #0284C7, #0369A1); box-shadow: 0 4px 12px rgba(2,132,199,0.3); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

/* Responsive */
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
