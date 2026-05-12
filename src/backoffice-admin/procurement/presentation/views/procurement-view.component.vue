<script setup>
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProcurementStore } from '../../application/procurement.store.js';

const { t } = useI18n();
const store = useProcurementStore();

const searchQuery = ref('');
const currentPage = ref(1);
const itemsPerPage = 6;

const newOrder = ref({
  supplierId: '',
  total: '',
  notes: '',
  status: 'Pendiente',
  date: new Date().toISOString()
});

const isSaving = ref(false);
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const formErrors = ref({});

onMounted(() => {
  store.fetchSuppliers();
});

const filteredSuppliers = computed(() => {
  return store.suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    s.contact.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const totalPages = computed(() => Math.ceil(filteredSuppliers.value.length / itemsPerPage) || 1);

const paginatedSuppliers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredSuppliers.value.slice(start, start + itemsPerPage);
});

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const setPage = (p) => {
  currentPage.value = p;
};

const displayToast = (msg, type) => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3500);
};

const validateForm = () => {
  const errors = {};
  if (!newOrder.value.supplierId) errors.supplierId = true;
  if (!newOrder.value.total || newOrder.value.total <= 0) errors.total = true;
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const createOrder = async () => {
  if (!validateForm()) return;
  isSaving.value = true;
  
  try {
    await store.createOrder({ ...newOrder.value, total: Number(newOrder.value.total) });
    newOrder.value.supplierId = '';
    newOrder.value.total = '';
    newOrder.value.notes = '';
    formErrors.value = {};
    displayToast(t('procurement.orderForm.successMessage'), 'success');
  } catch (error) {
    displayToast(t('procurement.orderForm.errorMessage'), 'error');
  } finally {
    isSaving.value = false;
  }
};

const getAvatarInitials = (name) => {
  if (!name) return 'S';
  return name.substring(0, 2).toUpperCase();
};

const showSupplierModal = ref(false);
const isSavingSupplier = ref(false);
const supplierFormErrors = ref({});
const supplierForm = ref({
  name: '',
  contact: '',
  phone: '',
  email: '',
  status: 'Activo'
});

const openSupplierModal = () => {
  supplierForm.value = { name: '', contact: '', phone: '', email: '', status: 'Activo' };
  supplierFormErrors.value = {};
  showSupplierModal.value = true;
};

const closeSupplierModal = () => {
  showSupplierModal.value = false;
};

const validateSupplierForm = () => {
  const errors = {};
  if (!supplierForm.value.name.trim()) errors.name = true;
  if (!supplierForm.value.contact.trim()) errors.contact = true;
  if (!supplierForm.value.phone.trim()) errors.phone = true;
  if (!supplierForm.value.email.trim()) errors.email = true;
  supplierFormErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const createSupplier = async () => {
  if (!validateSupplierForm()) return;
  isSavingSupplier.value = true;
  const success = await store.createSupplier({ ...supplierForm.value });
  if (success) {
    displayToast(t('procurement.supplierModal.successMessage'), 'success');
    closeSupplierModal();
  } else {
    displayToast(t('procurement.supplierModal.errorMessage'), 'error');
  }
  isSavingSupplier.value = false;
};
</script>

<template>
  <div class="procurement-view">
    
    <!-- Toast -->
    <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="main-layout">
      <!-- Left Column: Table -->
      <div class="left-panel">
        
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="search-input-wrapper">
            <i class="pi pi-search search-icon"></i>
            <input type="text" v-model="searchQuery" :placeholder="t('procurement.toolbar.search')" class="search-input" />
          </div>
          <button class="btn-primary" @click="openSupplierModal">
            {{ t('procurement.toolbar.newSupplier') }}
          </button>
        </div>

        <!-- Table Container -->
        <div class="table-container">
          <div v-if="store.isLoading" class="loading-state">Cargando...</div>
          <div v-else-if="store.error" class="error-state">Error al cargar proveedores</div>
          <div v-else>
            <table class="data-table">
              <thead>
                <tr>
                  <th width="28%">{{ t('procurement.table.columns.name') }}</th>
                  <th width="20%">{{ t('procurement.table.columns.contact') }}</th>
                  <th width="18%">{{ t('procurement.table.columns.phone') }}</th>
                  <th width="20%">{{ t('procurement.table.columns.email') }}</th>
                  <th width="14%">{{ t('procurement.table.columns.status') }}</th>
                  <th width="5%"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="supplier in paginatedSuppliers" :key="supplier.id">
                  <td>
                    <div class="supplier-cell">
                      <div class="supplier-avatar">{{ getAvatarInitials(supplier.name) }}</div>
                      <div class="supplier-info">
                        <span class="supplier-name">{{ supplier.name }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="plain-text">{{ supplier.contact }}</span>
                  </td>
                  <td>
                    <span class="mono-text">{{ supplier.phone }}</span>
                  </td>
                  <td>
                    <a :href="'mailto:' + supplier.email" class="email-link">{{ supplier.email }}</a>
                  </td>
                  <td>
                    <span :class="['status-badge', supplier.status === 'Activo' ? 'status-active' : 'status-inactive']">
                      <span class="dot"></span> {{ t(`procurement.status.${supplier.status}`, supplier.status) }}
                    </span>
                  </td>
                  <td style="text-align: center;">
                    <button class="kebab-menu">⋮</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Pagination -->
        <div class="table-footer" v-if="!store.isLoading && !store.error">
          <div class="footer-info">
            {{ t('procurement.pagination.showing') }} <strong>{{ filteredSuppliers.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }}-{{ Math.min(currentPage * itemsPerPage, filteredSuppliers.length) }}</strong> {{ t('procurement.pagination.of') }} <strong>{{ filteredSuppliers.length }}</strong> {{ t('procurement.pagination.records') }}
          </div>
          <div class="pagination">
            <button class="page-btn-nav" @click="prevPage" :disabled="currentPage === 1">{{ t('procurement.pagination.previous') }}</button>
            <div class="page-numbers">
              <button 
                v-for="p in totalPages" :key="p" 
                :class="['page-btn', { 'page-btn-active': p === currentPage }]"
                @click="setPage(p)"
              >
                {{ p }}
              </button>
            </div>
            <button class="page-btn-nav" @click="nextPage" :disabled="currentPage === totalPages">{{ t('procurement.pagination.next') }}</button>
          </div>
        </div>
      </div>

      <!-- Right Column: Forms & Summaries -->
      <div class="right-panel">
        
        <!-- New Order Form Card -->
        <div class="order-card">
          <div class="order-card-header">
            <div class="header-icon-box">🗒</div>
            <div class="header-titles">
              <h3>{{ t('procurement.orderForm.title') }}</h3>
              <p>{{ t('procurement.orderForm.subtitle') }}</p>
            </div>
          </div>
          
          <form class="order-form" @submit.prevent="createOrder">
            <div class="form-group" :class="{ 'has-error': formErrors.supplierId }">
              <label><i class="pi pi-th-large form-icon"></i> {{ t('procurement.orderForm.provider') }}</label>
              <div class="select-wrapper">
                <select v-model="newOrder.supplierId">
                  <option value="" disabled>{{ t('procurement.orderForm.providerPlaceholder') }}</option>
                  <option v-for="s in store.suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
                <i class="pi pi-chevron-down select-chevron"></i>
              </div>
              <span v-if="formErrors.supplierId" class="error-text">{{ t('procurement.orderForm.invalidProvider') }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': formErrors.total }">
              <label><i class="pi pi-dollar form-icon"></i> {{ t('procurement.orderForm.total') }}</label>
              <input type="number" step="0.01" min="0" v-model="newOrder.total" :placeholder="t('procurement.orderForm.totalPlaceholder')" />
              <span v-if="formErrors.total" class="error-text">{{ t('procurement.orderForm.invalidTotal') }}</span>
            </div>

            <div class="form-group">
              <label>
                <i class="pi pi-align-left form-icon"></i> 
                {{ t('procurement.orderForm.notes') }} 
                <span class="label-optional">{{ t('procurement.orderForm.notesOptional') }}</span>
              </label>
              <textarea v-model="newOrder.notes" :placeholder="t('procurement.orderForm.notesPlaceholder')" rows="3"></textarea>
            </div>

            <button type="submit" class="submit-btn" :disabled="isSaving">
              <i v-if="isSaving" class="pi pi-spin pi-spinner"></i>
              {{ t('procurement.orderForm.submit') }}
            </button>
            
            <p class="form-hint">
              {{ t('procurement.orderForm.hint').split('{status}')[0] }}
              <span class="hint-highlight">{{ t('procurement.orderForm.hintStatus') }}</span>
              {{ t('procurement.orderForm.hint').split('{status}')[1] }}
            </p>
          </form>
        </div>

        <!-- Month Summary Card -->
        <div class="summary-card">
          <div class="summary-header">
            <span class="summary-icon">🥧</span>
            <h3>{{ t('procurement.summary.title') }}</h3>
          </div>
          <div class="summary-list">
            <div class="summary-item">
              <div class="summary-label">
                <i class="pi pi-shopping-cart summary-item-icon text-blue"></i>
                {{ t('procurement.summary.ordersCreated') }}
              </div>
              <span class="summary-val val-blue">18</span>
            </div>
            <div class="summary-item">
              <div class="summary-label">
                <i class="pi pi-check-circle summary-item-icon text-green"></i>
                {{ t('procurement.summary.completed') }}
              </div>
              <span class="summary-val val-green">14</span>
            </div>
            <div class="summary-item">
              <div class="summary-label">
                <i class="pi pi-clock summary-item-icon text-orange"></i>
                {{ t('procurement.summary.pending') }}
              </div>
              <span class="summary-val val-orange">4</span>
            </div>
            <div class="summary-item item-money">
              <div class="summary-label">
                <i class="pi pi-wallet summary-item-icon text-purple"></i>
                {{ t('procurement.summary.totalSpent') }}
              </div>
              <span class="summary-val val-purple">$48,300</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal Nuevo Proveedor -->
    <Transition name="modal">
      <div v-if="showSupplierModal" class="modal-overlay" @click.self="closeSupplierModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-users"></i></div>
            <div>
              <h2 class="modal-title">{{ t('procurement.supplierModal.title') }}</h2>
              <p class="modal-subtitle">{{ t('procurement.supplierModal.subtitle') }}</p>
            </div>
            <button class="modal-close" @click="closeSupplierModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="modal-body" @submit.prevent="createSupplier">
            <!-- Contact Info -->
            <div class="form-section">
              <h3 class="section-label"><i class="pi pi-address-book"></i> {{ t('procurement.supplierModal.personalInfo') }}</h3>
              <div class="form-grid">
                <div class="form-group span-full" :class="{ 'has-error': supplierFormErrors.name }">
                  <label>{{ t('procurement.supplierModal.name') }} *</label>
                  <input type="text" v-model="supplierForm.name" :placeholder="t('procurement.supplierModal.namePlaceholder')" />
                  <span v-if="supplierFormErrors.name" class="error-text">{{ t('procurement.supplierModal.required') }}</span>
                </div>
                <div class="form-group span-full" :class="{ 'has-error': supplierFormErrors.contact }">
                  <label>{{ t('procurement.supplierModal.contact') }} *</label>
                  <input type="text" v-model="supplierForm.contact" :placeholder="t('procurement.supplierModal.contactPlaceholder')" />
                  <span v-if="supplierFormErrors.contact" class="error-text">{{ t('procurement.supplierModal.required') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': supplierFormErrors.phone }">
                  <label>{{ t('procurement.supplierModal.phone') }} *</label>
                  <input type="text" v-model="supplierForm.phone" :placeholder="t('procurement.supplierModal.phonePlaceholder')" />
                  <span v-if="supplierFormErrors.phone" class="error-text">{{ t('procurement.supplierModal.required') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': supplierFormErrors.email }">
                  <label>{{ t('procurement.supplierModal.email') }} *</label>
                  <input type="email" v-model="supplierForm.email" :placeholder="t('procurement.supplierModal.emailPlaceholder')" />
                  <span v-if="supplierFormErrors.email" class="error-text">{{ t('procurement.supplierModal.required') }}</span>
                </div>
                <div class="form-group">
                  <label>{{ t('procurement.supplierModal.status') }}</label>
                  <select v-model="supplierForm.status">
                    <option value="Activo">{{ t('procurement.supplierModal.statusActive') }}</option>
                    <option value="Inactivo">{{ t('procurement.supplierModal.statusInactive') }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeSupplierModal">{{ t('procurement.supplierModal.cancel') }}</button>
              <button type="submit" class="btn-submit" :disabled="isSavingSupplier">
                <i :class="isSavingSupplier ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ isSavingSupplier ? t('procurement.supplierModal.saving') : t('procurement.supplierModal.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.procurement-view {
  padding: 32px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #111827;
  background-color: #f9fafb;
  min-height: 100vh;
}

.main-layout {
  display: flex;
  gap: 24px;
  flex-direction: row;
}

.left-panel {
  flex: 1;
  min-width: 0; /* Prevents flex item from overflowing */
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.right-panel {
  flex: 0 0 340px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Toolbar & Search */
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.search-input-wrapper {
  position: relative;
  flex-grow: 1;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 14px;
}

.search-input {
  width: 100%;
  height: 40px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px 10px 36px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: border 0.2s;
  box-sizing: border-box;
}
.search-input::placeholder {
  color: #9ca3af;
}
.search-input:focus {
  border-color: #3b82f6;
}

.btn-primary {
  height: 40px;
  background: #2563eb;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: 0px 1px 2px rgba(0,0,0,0.05);
  white-space: nowrap;
}
.btn-primary:hover {
  background: #1d4ed8;
}

/* Table Container */
.table-container {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: transparent;
  color: #6b7280;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  height: 64px;
  box-sizing: border-box;
}

.data-table tbody tr {
  background: #ffffff;
  transition: background 0.15s ease;
}
.data-table tbody tr:hover {
  background: #f9fafb;
}

/* Table Cells */
.supplier-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.supplier-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #dbeafe;
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}
.supplier-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  display: block;
}
.plain-text {
  font-size: 13px;
  color: #374151;
  font-weight: 400;
}
.mono-text {
  font-size: 13px;
  color: #374151;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.email-link {
  font-size: 13px;
  color: #2563eb;
  text-decoration: none;
}
.email-link:hover {
  text-decoration: underline;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 500;
}
.status-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.status-active {
  background: #dcfce7;
  color: #15803d;
}
.status-active .dot {
  background: #22c55e;
}
.status-inactive {
  background: #f3f4f6;
  color: #6b7280;
}
.status-inactive .dot {
  background: #9ca3af;
}

.kebab-menu {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 18px;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.kebab-menu:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Pagination */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 0 0;
  border-top: 1px solid #e5e7eb;
}

.footer-info {
  font-size: 13px;
  color: #6b7280;
}
.footer-info strong {
  font-weight: 700;
  color: #111827;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-numbers {
  display: flex;
  gap: 4px;
}

.page-btn-nav {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.page-btn-nav:hover:not(:disabled) {
  background: #f9fafb;
}
.page-btn-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn {
  width: 36px;
  height: 36px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.page-btn:hover:not(.page-btn-active) {
  background: #f9fafb;
}

.page-btn-active {
  background: #3b82f6;
  color: #ffffff;
  border: 1px solid #3b82f6;
  font-weight: 700;
}

/* Right Panel Cards */
.order-card, .summary-card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

.order-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.header-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.header-titles h3 {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 2px 0;
}
.header-titles p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

/* Order Form */
.order-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-icon {
  color: #9ca3af;
  font-size: 12px;
}
.label-optional {
  font-weight: 400;
  color: #9ca3af;
  text-transform: none;
  letter-spacing: normal;
}
.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  padding: 10px 12px;
  font-size: 14px;
  color: #111827;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.form-group input::placeholder, .form-group textarea::placeholder {
  color: #9ca3af;
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
}
.select-wrapper {
  position: relative;
}
.select-wrapper select {
  appearance: none;
  padding-right: 36px;
  cursor: pointer;
}
.select-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 14px;
  pointer-events: none;
}

.has-error input, .has-error select { border-color: #ef4444; }
.has-error input:focus, .has-error select:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.15); }
.error-text { font-size: 12px; color: #ef4444; font-weight: 500; }

.submit-btn {
  height: 40px;
  border-radius: 10px;
  background: #2563eb;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.15);
}
.submit-btn:hover:not(:disabled) {
  background: #1d4ed8;
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-hint {
  font-size: 13px;
  color: #6b7280;
  margin: 0;
  text-align: center;
  line-height: 1.4;
}
.hint-highlight {
  font-weight: 600;
  color: #f59e0b;
}

/* Summary Card */
.summary-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.summary-icon {
  font-size: 20px;
}
.summary-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}
.summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f9fafb;
}
.item-money {
  background: #faf5ff;
}
.summary-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}
.summary-item-icon {
  font-size: 14px;
}
.text-blue { color: #3b82f6; }
.text-green { color: #22c55e; }
.text-orange { color: #f59e0b; }
.text-purple { color: #a855f7; }

.summary-val {
  font-size: 14px;
  font-weight: 700;
}
.val-blue { color: #2563eb; }
.val-green { color: #16a34a; }
.val-orange { color: #d97706; }
.val-purple { color: #7c3aed; }

/* Toast Notification */
.toast {
  position: fixed; top: 24px; right: 24px; z-index: 10000;
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.toast-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.toast-error { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

/* Modal Overlay */
.modal-overlay {
  position: fixed; inset: 0; z-index: 9000;
  background: rgba(15, 23, 42, 0.65);
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
  width: 100%; max-width: 600px; max-height: 90vh;
  overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

/* Modal Header */
.modal-header {
  display: flex; align-items: center; gap: 16px;
  padding: 24px 28px; border-bottom: 1px solid #e5e7eb;
  position: sticky; top: 0; background: #FFFFFF; z-index: 1;
  border-radius: 16px 16px 0 0;
}
.modal-header-icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 20px; flex-shrink: 0;
}
.modal-title { font-size: 18px; font-weight: 700; color: #111827; margin: 0; }
.modal-subtitle { font-size: 13px; color: #6b7280; margin: 4px 0 0 0; }
.modal-close {
  margin-left: auto; background: none; border: none; cursor: pointer;
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: #6b7280; font-size: 16px; transition: all 0.2s;
}
.modal-close:hover { background: #f3f4f6; color: #111827; }

/* Modal Body */
.modal-body { padding: 24px 28px; }

/* Form Sections */
.form-section {
  margin-bottom: 24px; padding-bottom: 20px;
  border-bottom: 1px solid #f3f4f6;
}
.form-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.section-label {
  font-size: 14px; font-weight: 600; color: #374151;
  margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;
}
.section-label i { color: #3b82f6; font-size: 15px; }

/* Form Grid */
.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.form-group.span-full { grid-column: 1 / -1; }

.modal-body .form-group label {
  font-size: 13px; font-weight: 500; color: #4b5563; text-transform: none; letter-spacing: normal; display: block;
}
.modal-body .form-group input,
.modal-body .form-group select {
  background: #FFFFFF;
}

/* Modal Actions */
.modal-actions {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 20px 28px; border-top: 1px solid #e5e7eb;
  position: sticky; bottom: 0; background: #FFFFFF;
  border-radius: 0 0 16px 16px;
}
.btn-cancel {
  padding: 10px 20px; border-radius: 8px; border: 1px solid #e5e7eb;
  background: #FFFFFF; color: #4b5563; font-size: 14px;
  font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover { background: #f9fafb; border-color: #d1d5db; }
.btn-submit {
  padding: 10px 24px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #FFFFFF; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.btn-submit:hover { background: linear-gradient(135deg, #2563eb, #1d4ed8); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

@media (max-width: 1024px) {
  .main-layout {
    flex-direction: column;
  }
  .right-panel {
    flex: none;
    width: 100%;
  }
}
</style>
