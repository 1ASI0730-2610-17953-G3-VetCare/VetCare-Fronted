<script setup>
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useProcurementStore } from '../../application/procurement.store.js';
import { useAdminDateLabel } from '@/shared/presentation/composables/use-admin-date-label.js';
import { useCurrencyFormat } from '@/shared/presentation/composables/use-currency-format.js';
import AdminLoadingState from '@/shared/presentation/components/admin-loading-state.component.vue';
import AdminErrorState from '@/shared/presentation/components/admin-error-state.component.vue';

const { t } = useI18n();
const store = useProcurementStore();
const { adminDateLabel } = useAdminDateLabel();
const { formatPlainAmount, symbol } = useCurrencyFormat();

const orderTotalHint = computed(() =>
  t('procurement.orderForm.totalHint', { currency: symbol.value === 'S/' ? 'PEN' : 'USD' })
);

const TOTAL_SPENT_USD = 48300;

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
  const q = searchQuery.value.toLowerCase();
  return store.suppliers.filter(s =>
    (s.name ?? '').toLowerCase().includes(q) ||
    (s.email ?? '').toLowerCase().includes(q) ||
    (s.contact ?? '').toLowerCase().includes(q)
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
    
        <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <header class="bi-admin-header">
      <p class="bi-eyebrow">{{ t('layout.adminPanelEyebrow', { date: adminDateLabel }) }}</p>
      <h1 class="bi-admin-title">{{ t('layout.adminPageTitle.procurement') }}</h1>
    </header>

    <div class="main-layout">
            <div class="left-panel">
        
                <div class="toolbar">
          <div class="search-input-wrapper">
            <i class="pi pi-search search-icon"></i>
            <input type="text" v-model="searchQuery" :placeholder="t('procurement.toolbar.search')" class="search-input" />
          </div>
          <button class="btn-primary" @click="openSupplierModal">
            {{ t('procurement.toolbar.newSupplier') }}
          </button>
        </div>

                <div class="table-container">
          <AdminLoadingState
            v-if="store.isLoading"
            compact
            :message="t('procurement.loading')"
          />
          <AdminErrorState
            v-else-if="store.error"
            compact
            :message="t('procurement.error')"
          />
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

            <div class="right-panel">
        
                <div class="order-card">
          <div class="order-card-header">
            <div class="order-card-icon"><i class="pi pi-file-edit"></i></div>
            <div class="header-titles">
              <h3>{{ t('procurement.orderForm.title') }}</h3>
              <p>{{ t('procurement.orderForm.subtitle') }}</p>
            </div>
          </div>
          
          <form class="order-form" @submit.prevent="createOrder">
            <div class="form-group" :class="{ 'has-error': formErrors.supplierId }">
              <label for="order-supplier">{{ t('procurement.orderForm.provider') }}</label>
              <div class="select-wrapper">
                <select id="order-supplier" v-model="newOrder.supplierId">
                  <option value="" disabled>{{ t('procurement.orderForm.providerPlaceholder') }}</option>
                  <option v-for="s in store.suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
                </select>
                <i class="pi pi-chevron-down select-chevron"></i>
              </div>
              <span v-if="formErrors.supplierId" class="error-text">{{ t('procurement.orderForm.invalidProvider') }}</span>
            </div>

            <div class="form-group" :class="{ 'has-error': formErrors.total }">
              <label for="order-total">{{ t('procurement.orderForm.total') }}</label>
              <div class="input-with-prefix">
                <span class="input-prefix">{{ symbol }}</span>
                <input
                  id="order-total"
                  type="number"
                  step="0.01"
                  min="0"
                  v-model="newOrder.total"
                  :placeholder="t('procurement.orderForm.totalPlaceholder')"
                />
              </div>
              <span class="helper-text">{{ orderTotalHint }}</span>
              <span v-if="formErrors.total" class="error-text">{{ t('procurement.orderForm.invalidTotal') }}</span>
            </div>

            <div class="form-group">
              <label for="order-notes">
                {{ t('procurement.orderForm.notes') }}
                <span class="label-optional">{{ t('procurement.orderForm.notesOptional') }}</span>
              </label>
              <textarea
                id="order-notes"
                v-model="newOrder.notes"
                :placeholder="t('procurement.orderForm.notesPlaceholder')"
                rows="3"
              ></textarea>
            </div>

            <button type="submit" class="submit-btn" :disabled="isSaving">
              <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
              {{ isSaving ? t('procurement.supplierModal.saving') : t('procurement.orderForm.submit') }}
            </button>
            
            <p class="form-hint">
              {{ t('procurement.orderForm.hintPrefix') }}
              <span class="hint-badge">{{ t('procurement.orderForm.hintStatus') }}</span>
              {{ t('procurement.orderForm.hintSuffix') }}
            </p>
          </form>
        </div>

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
              <span class="summary-val val-purple">{{ formatPlainAmount(TOTAL_SPENT_USD) }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>

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
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');


.procurement-view {
  --bi-ink: #0f172a;
  --bi-paper: #ffffff;
  --bi-bg: #eef2f6;
  --bi-teal: #0f766e;
  --bi-teal-light: #14b8a6;
  --bi-teal-soft: #ecfdf5;
  --bi-amber: #b45309;
  --bi-amber-soft: #fffbeb;
  --bi-muted: #64748b;
  --bi-border: #e2e8f0;
  --bi-radius: 14px;
  --bi-font-display: 'Fraunces', Georgia, serif;
  --bi-font-body: 'Inter', system-ui, sans-serif;
  font-family: var(--bi-font-body);
  color: var(--bi-ink);
}

.main-layout {
  display: flex;
  gap: 24px;
  flex-direction: row;
}

.left-panel {
  flex: 1;
  min-width: 0; 
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
  color: var(--bi-muted);
  font-size: 14px;
}

.search-input {
  width: 100%;
  height: 40px;
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: 8px;
  padding: 10px 14px 10px 36px;
  font-size: 14px;
  color: var(--bi-ink);
  outline: none;
  transition: border 0.2s;
  box-sizing: border-box;
}
.search-input::placeholder {
  color: var(--bi-muted);
}
.search-input:focus {
  border-color: var(--bi-teal);
}

.btn-primary {
  height: 40px;
  background: var(--bi-teal);
  color: var(--bi-paper);
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  box-shadow: var(--shadow-card);
  white-space: nowrap;
}
.btn-primary:hover {
  background: #0d655e;
}

.table-container {
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: var(--bi-radius);
  padding: 0;
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: transparent;
  color: var(--bi-muted);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 14px 16px;
  border-bottom: 1px solid var(--bi-border);
  text-align: left;
}

.data-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--bi-border);
  vertical-align: middle;
  height: 64px;
  box-sizing: border-box;
}

.data-table tbody tr {
  background: var(--bi-paper);
  transition: background 0.15s ease;
}
.data-table tbody tr:hover {
  background: var(--bi-bg);
}

.supplier-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}
.supplier-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
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
  color: var(--bi-ink);
  display: block;
}
.plain-text {
  font-size: 13px;
  color: var(--bi-ink);
  font-weight: 400;
}
.mono-text {
  font-size: 13px;
  color: var(--bi-ink);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}
.email-link {
  font-size: 13px;
  color: var(--bi-teal);
  text-decoration: none;
}
.email-link:hover {
  text-decoration: underline;
}

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
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
}
.status-active .dot {
  background: var(--bi-teal-light);
}
.status-inactive {
  background: var(--bi-border);
  color: var(--bi-muted);
}
.status-inactive .dot {
  background: var(--bi-muted);
}

.kebab-menu {
  background: transparent;
  border: none;
  color: var(--bi-muted);
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
  background: var(--bi-border);
  color: var(--bi-ink);
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 0 0;
  border-top: 1px solid var(--bi-border);
}

.footer-info {
  font-size: 13px;
  color: var(--bi-muted);
}
.footer-info strong {
  font-weight: 700;
  color: var(--bi-ink);
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
  background: var(--bi-paper);
  color: var(--bi-ink);
  border: 1px solid var(--bi-border);
  border-radius: 8px;
  padding: 7px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.page-btn-nav:hover:not(:disabled) {
  background: var(--bi-bg);
}
.page-btn-nav:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-btn {
  width: 36px;
  height: 36px;
  background: var(--bi-paper);
  color: var(--bi-ink);
  border: 1px solid var(--bi-border);
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
  background: var(--bi-bg);
}

.page-btn-active {
  background: var(--bi-teal);
  color: var(--bi-paper);
  border: 1px solid var(--bi-teal);
  font-weight: 700;
}

.order-card, .summary-card {
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: var(--bi-radius);
  padding: 24px;
  box-shadow: var(--shadow-card);
}

.order-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--bi-border);
}
.order-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.order-card-icon i {
  font-size: 18px;
}
.header-titles h3 {
  font-size: 14px;
  font-weight: 700;
  color: var(--bi-ink);
  margin: 0 0 2px 0;
}
.header-titles p {
  font-size: 12px;
  color: var(--bi-muted);
  margin: 0;
}

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
  color: var(--bi-muted);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
}
.form-icon {
  color: var(--bi-muted);
  font-size: 12px;
}
.label-optional {
  font-weight: 400;
  color: var(--bi-muted);
  text-transform: none;
  letter-spacing: normal;
}
.form-group input, .form-group textarea, .form-group select {
  width: 100%;
  border: 1px solid var(--bi-border);
  border-radius: 8px;
  background: var(--bi-bg);
  padding: 10px 12px;
  font-size: 14px;
  color: var(--bi-ink);
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
  font-family: inherit;
}
.form-group .input-with-prefix input {
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 10px 12px;
}
.form-group .input-with-prefix input:focus {
  border: none;
  box-shadow: none;
}
.input-with-prefix {
  display: flex;
  align-items: stretch;
  border: 1px solid var(--bi-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bi-paper);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.input-with-prefix:focus-within {
  border-color: var(--bi-teal);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--bi-teal) 12%, transparent);
}
.has-error .input-with-prefix {
  border-color: var(--color-status-danger-indicator);
}
.has-error .input-with-prefix:focus-within {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-status-danger-indicator) 12%, transparent);
}
.input-prefix {
  display: flex;
  align-items: center;
  padding: 0 12px;
  background: var(--bi-bg);
  color: var(--bi-muted);
  font-size: 13px;
  font-weight: 600;
  border-right: 1px solid var(--bi-border);
  flex-shrink: 0;
}
.helper-text {
  font-size: 11px;
  color: var(--bi-muted);
  font-weight: 400;
}
.form-group input::placeholder, .form-group textarea::placeholder {
  color: var(--bi-muted);
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus {
  border-color: var(--bi-teal);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--bi-teal) 15%, transparent);
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
  color: var(--bi-muted);
  font-size: 14px;
  pointer-events: none;
}

.has-error input, .has-error select { border-color: var(--color-status-danger-indicator); }
.has-error input:focus, .has-error select:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-status-danger-indicator) 15%, transparent); }
.error-text { font-size: 12px; color: var(--color-status-danger-indicator); font-weight: 500; }

.submit-btn {
  height: 40px;
  border-radius: 10px;
  background: var(--bi-teal);
  color: var(--bi-paper);
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
  background: #0d655e;
}
.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.form-hint {
  font-size: 12px;
  color: var(--bi-muted);
  margin: 0;
  text-align: center;
  line-height: 1.5;
}
.hint-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 9999px;
  background: color-mix(in srgb, var(--bi-amber) 18%, transparent);
  color: var(--bi-amber);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

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
  color: var(--bi-ink);
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
  background: var(--bi-bg);
}
.item-money {
  background: var(--bi-teal-soft);
}
.summary-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--bi-ink);
}
.summary-item-icon {
  font-size: 14px;
}
.text-blue { color: var(--bi-teal); }
.text-green { color: var(--bi-teal-light); }
.text-orange { color: var(--bi-amber); }
.text-purple { color: var(--bi-teal-light); }

.summary-val {
  font-size: 14px;
  font-weight: 700;
}
.val-blue { color: var(--bi-teal); }
.val-green { color: var(--bi-teal); }
.val-orange { color: var(--bi-amber); }
.val-purple { color: var(--bi-teal); }

.toast {
  position: fixed; top: 24px; right: 24px; z-index: 10000;
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.toast-success { background: var(--bi-teal-soft); color: var(--bi-teal); border: 1px solid color-mix(in srgb, var(--bi-teal-light) 30%, transparent); }
.toast-error { background: var(--color-status-danger-bg); color: var(--color-status-danger-text); border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 30%, transparent); }
.toast-enter-active { animation: slideIn 0.3s ease; }
.toast-leave-active { animation: slideOut 0.3s ease; }
@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
@keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }

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

.modal-container {
  background: var(--bi-paper); border-radius: var(--bi-radius);
  width: 100%; max-width: 600px; max-height: 90vh;
  overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.modal-header {
  display: flex; align-items: center; gap: 16px;
  padding: 24px 28px; border-bottom: 1px solid var(--bi-border);
  position: sticky; top: 0; background: var(--bi-paper); z-index: 1;
  border-radius: 16px 16px 0 0;
}
.modal-header-icon {
  width: 44px; height: 44px; border-radius: 10px;
  background: linear-gradient(135deg, var(--bi-teal), var(--bi-teal));
  display: flex; align-items: center; justify-content: center;
  color: var(--bi-paper); font-size: 20px; flex-shrink: 0;
}
.modal-title { font-size: 18px; font-weight: 700; color: var(--bi-ink); margin: 0; }
.modal-subtitle { font-size: 13px; color: var(--bi-muted); margin: 4px 0 0 0; }
.modal-close {
  margin-left: auto; background: none; border: none; cursor: pointer;
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  color: var(--bi-muted); font-size: 16px; transition: all 0.2s;
}
.modal-close:hover { background: var(--bi-border); color: var(--bi-ink); }

.modal-body { padding: 24px 28px; }

.form-section {
  margin-bottom: 24px; padding-bottom: 20px;
  border-bottom: 1px solid var(--bi-border);
}
.form-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.section-label {
  font-size: 14px; font-weight: 600; color: var(--bi-ink);
  margin: 0 0 16px 0; display: flex; align-items: center; gap: 8px;
}
.section-label i { color: var(--bi-teal); font-size: 15px; }

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.form-group.span-full { grid-column: 1 / -1; }

.modal-body .form-group label {
  font-size: 13px; font-weight: 500; color: var(--bi-muted); text-transform: none; letter-spacing: normal; display: block;
}
.modal-body .form-group input,
.modal-body .form-group select {
  background: var(--bi-paper);
}

.modal-actions {
  display: flex; justify-content: flex-end; gap: 12px;
  padding: 20px 28px; border-top: 1px solid var(--bi-border);
  position: sticky; bottom: 0; background: var(--bi-paper);
  border-radius: 0 0 16px 16px;
}
.btn-cancel {
  padding: 10px 20px; border-radius: 8px; border: 1px solid var(--bi-border);
  background: var(--bi-paper); color: var(--bi-muted); font-size: 14px;
  font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.btn-cancel:hover { background: var(--bi-bg); border-color: var(--bi-border); }
.btn-submit {
  padding: 10px 24px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, var(--bi-teal), var(--bi-teal));
  color: var(--bi-paper); font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 8px;
}
.btn-submit:hover { background: linear-gradient(135deg, var(--bi-teal), #0d655e); box-shadow: 0 4px 12px rgba(37,99,235,0.3); }
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

.bi-admin-header {
  margin-bottom: 28px;
}

.bi-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bi-teal);
  margin: 0 0 6px;
}

.bi-admin-title {
  font-family: var(--bi-font-display);
  font-size: clamp(1.5rem, 2.5vw, 1.875rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--bi-ink);
  margin: 0;
}

.kpi-val-int,
.kpi-val-dec,
.stat-number,
.table-title,
.summary-title,
.modal-title,
.supplier-name,
.product-name,
.header-titles h3,
.summary-header h3 {
  font-family: var(--bi-font-display);
}

.kpi-val-int,
.kpi-val-dec,
.stat-number {
  color: var(--bi-teal);
}
</style>
