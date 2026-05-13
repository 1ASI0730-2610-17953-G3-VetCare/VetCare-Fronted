<script setup>
import { onMounted, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useInventoryStore } from '../../application/inventory.store.js';

const { t } = useI18n();
const store = useInventoryStore();

onMounted(() => {
  store.fetchProducts();
});

const searchQuery = ref('');
const selectedCategory = ref('__all__');
const selectedStatus = ref('__all__');
const showFilters = ref(false);
const currentPage = ref(1);
const itemsPerPage = 8;

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const clearFilters = () => {
  searchQuery.value = '';
  selectedCategory.value = '__all__';
  selectedStatus.value = '__all__';
};

const categories = computed(() => {
  const cats = new Set(store.products.map(p => p.category));
  return ['__all__', ...Array.from(cats)];
});

const getCategoryDisplayName = (cat) => {
  if (cat === '__all__') return t('inventory.toolbar.allCategories');
  return t(`inventory.categories.${cat}`, cat);
};

const filteredProducts = computed(() => {
  return store.products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        p.code.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchCategory = selectedCategory.value === '__all__' || p.category === selectedCategory.value;
    const isLowStock = p.stock <= (p.minStock || 5);
    const matchStatus = selectedStatus.value === '__all__' ||
                        (selectedStatus.value === 'low' && isLowStock) ||
                        (selectedStatus.value === 'normal' && !isLowStock);
    return matchSearch && matchCategory && matchStatus;
  });
});

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredProducts.value.slice(start, start + itemsPerPage);
});

const totalProductsCount = computed(() => store.products.length);
const normalStockCount = computed(() => store.products.filter(p => p.stock > (p.minStock || 5)).length);
const lowStockCount = computed(() => store.products.filter(p => p.stock <= (p.minStock || 5)).length);
const categoriesCount = computed(() => new Set(store.products.map(p => p.category)).size);

const updateStock = (id, stock) => {
  store.updateStock(id, stock);
};

const getCategoryIcon = (category) => {
  const cat = category?.toLowerCase();
  if (cat === 'medicamento' || cat === 'medicine') return '💊';
  if (cat === 'alimento' || cat === 'food') return '🍊';
  if (cat === 'suministro' || cat === 'supply') return '💉';
  return '📦';
};

const getCategoryIconBg = (category) => {
  const cat = category?.toLowerCase();
  if (cat === 'medicamento' || cat === 'medicine') return '#EFF6FF';
  if (cat === 'alimento' || cat === 'food') return '#FFF7ED';
  if (cat === 'suministro' || cat === 'supply') return '#ECFDF5';
  return '#F3F4F6';
};

const getCategoryColor = (category) => {
  const cat = category?.toLowerCase();
  if (cat === 'medicamento' || cat === 'medicine') return { bg: '#EFF6FF', text: '#3B82F6', border: '#BFDBFE', label: t('inventory.categories.Medicamento') };
  if (cat === 'alimento' || cat === 'food') return { bg: '#FFF7ED', text: '#F97316', border: '#FED7AA', label: t('inventory.categories.Alimento') };
  if (cat === 'suministro' || cat === 'supply') return { bg: '#ECFDF5', text: '#10B981', border: '#A7F3D0', label: t('inventory.categories.Suministro') };
  return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB', label: category };
};

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage) || 1);

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const setPage = (p) => {
  currentPage.value = p;
};

const alertDismissed = ref(false);
const lowStockProducts = computed(() =>
  store.products.filter(p => p.stock <= (p.minStock || 5))
);

const exportCSV = () => {
  if (filteredProducts.value.length === 0) {
    displayToast(t('inventory.table.exportNoData'), 'error');
    return;
  }
  
  const headers = [
    t('inventory.table.columns.code'),
    t('inventory.table.columns.product'),
    t('inventory.table.columns.category'),
    t('inventory.table.columns.stock'),
    t('inventory.table.columns.status')
  ];
  
  const csvContent = [
    headers.join(','),
    ...filteredProducts.value.map(p => {
      const isLowStock = p.stock <= (p.minStock || 5);
      const statusText = isLowStock ? t('inventory.table.statusLow') : t('inventory.table.statusNormal');
      return [
        `"${p.code}"`,
        `"${p.name}"`,
        `"${p.category}"`,
        p.stock,
        `"${statusText}"`
      ].join(',');
    })
  ].join('\n');
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  displayToast(t('inventory.table.exportSuccess'), 'success');
};

const showModal = ref(false);
const isSaving = ref(false);
const toastMessage = ref('');
const toastType = ref('');
const showToast = ref(false);
const formErrors = ref({});

const getDefaultForm = () => ({
  name: '', category: 'Medicamento', stock: 0, minStock: 5, price: 0
});
const form = ref(getDefaultForm());

const openModal = () => {
  form.value = getDefaultForm();
  formErrors.value = {};
  showModal.value = true;
};
const closeModal = () => { showModal.value = false; };

const displayToast = (msg, type) => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3500);
};

const validateForm = () => {
  const errors = {};
  if (!form.value.name.trim()) errors.name = true;
  if (!form.value.category) errors.category = true;
  if (form.value.stock < 0 || form.value.stock === '') errors.stock = true;
  if (form.value.minStock < 0 || form.value.minStock === '') errors.minStock = true;
  if (form.value.price < 0 || form.value.price === '') errors.price = true;
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const generateCode = () => {
  const prefixes = { 'Medicamento': 'MED', 'Alimento': 'ALI', 'Suministro': 'SUM' };
  const prefix = prefixes[form.value.category] || 'PRD';
  const num = String(store.products.length + 1).padStart(3, '0');
  return `${prefix}-${num}`;
};

const submitForm = async () => {
  if (!validateForm()) return;
  isSaving.value = true;
  const code = generateCode();
  const status = form.value.stock <= form.value.minStock ? 'Bajo Stock' : 'Normal';
  const payload = {
    code,
    name: form.value.name,
    category: form.value.category,
    stock: Number(form.value.stock),
    minStock: Number(form.value.minStock),
    price: Number(form.value.price),
    status
  };
  const success = await store.createProduct(payload);
  if (success) {
    displayToast(t('inventory.modal.successMessage'), 'success');
    closeModal();
  } else {
    displayToast(t('inventory.modal.errorMessage'), 'error');
  }
  isSaving.value = false;
};
</script>

<template>
  <div class="inventory-container">

        <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

        <Transition name="fade">
      <div v-if="lowStockProducts.length > 0 && !alertDismissed" class="low-stock-banner">
        <div class="banner-content">
          <i class="pi pi-exclamation-triangle banner-icon"></i>
          <div>
            <strong>{{ t('inventory.lowStockBanner.title') }}</strong>
            <span class="banner-products">{{ lowStockProducts.map(p => p.name).join(' · ') }}</span>
          </div>
        </div>
        <button class="banner-dismiss" @click="alertDismissed = true" :title="t('inventory.lowStockBanner.dismiss')">
          <i class="pi pi-times"></i>
        </button>
      </div>
    </Transition>

        <div class="stat-cards">
            <div class="stat-card">
        <div class="stat-top">
          <div class="icon-box" style="background: #eff6ff; color: #3b82f6;">
            <i class="pi pi-box"></i>
          </div>
          <span class="stat-label">{{ t('inventory.stats.total') }}</span>
        </div>
        <div class="stat-value-row">
          <h2 class="stat-number">{{ totalProductsCount }}</h2>
          <span class="stat-desc">{{ t('inventory.stats.totalDesc') }}</span>
        </div>
      </div>
      
            <div class="stat-card">
        <div class="stat-top">
          <div class="icon-box" style="background: #f0fdf4; color: #22c55e;">
            <i class="pi pi-check-circle"></i>
          </div>
          <span class="stat-label">{{ t('inventory.stats.stock') }}</span>
        </div>
        <div class="stat-value-row">
          <h2 class="stat-number">{{ normalStockCount }}</h2>
          <span class="stat-desc">{{ t('inventory.stats.stockDesc') }}</span>
        </div>
      </div>

            <div class="stat-card">
        <div class="stat-top">
          <div class="icon-box" style="background: #fff7ed; color: #f97316;">
            <i class="pi pi-exclamation-triangle"></i>
          </div>
          <span class="stat-badge-danger">{{ t('inventory.stats.alert') }}</span>
        </div>
        <div class="stat-value-row">
          <h2 class="stat-number">{{ lowStockCount }}</h2>
          <span class="stat-desc">{{ t('inventory.stats.alertDesc') }}</span>
        </div>
      </div>

            <div class="stat-card">
        <div class="stat-top">
          <div class="icon-box" style="background: #faf5ff; color: #a855f7;">
            <i class="pi pi-tags"></i>
          </div>
          <span class="stat-label">{{ t('inventory.stats.categories') }}</span>
        </div>
        <div class="stat-value-row">
          <h2 class="stat-number">{{ categoriesCount }}</h2>
          <span class="stat-desc">{{ t('inventory.stats.categoriesDesc') }}</span>
        </div>
      </div>
    </div>

        <div class="toolbar">
      <div class="search-input-wrapper">
        <i class="pi pi-search search-icon"></i>
        <input type="text" v-model="searchQuery" :placeholder="t('inventory.toolbar.search')" class="search-input" />
      </div>
      
      <div class="category-filter-wrapper">
        <select v-model="selectedCategory" class="category-select">
          <option v-for="cat in categories" :key="cat" :value="cat">{{ getCategoryDisplayName(cat) }}</option>
        </select>
      </div>

      <button class="btn-primary" @click="openModal">
        {{ t('inventory.toolbar.newProduct') }}
      </button>
    </div>

        <div class="table-section">
            <div class="table-header-row">
        <h3 class="table-title">{{ t('inventory.table.title') }}</h3>
        <span class="record-badge">{{ filteredProducts.length }} {{ t('inventory.table.records') }}</span>
      </div>

            <div class="table-actions-row">
        <button class="btn-ghost" @click="exportCSV">
          <i class="pi pi-download"></i> {{ t('inventory.table.export') }}
        </button>
        <button :class="['btn-ghost', { 'btn-active': showFilters }]" @click="toggleFilters">
          <i class="pi pi-sliders-h"></i> {{ t('inventory.table.filters') }}
        </button>
      </div>

            <Transition name="fade">
        <div v-if="showFilters" class="extended-filters">
          <div class="filter-group">
            <label>{{ t('inventory.table.filterStatus') }}</label>
            <select v-model="selectedStatus" class="category-select">
              <option value="__all__">{{ t('inventory.table.filterAllStatuses') }}</option>
              <option value="normal">{{ t('inventory.table.filterStatusNormal') }}</option>
              <option value="low">{{ t('inventory.table.filterStatusLow') }}</option>
            </select>
          </div>
          <button class="btn-ghost" @click="clearFilters" style="height: 40px; margin-top: auto;">
            <i class="pi pi-filter-slash"></i> {{ t('inventory.table.filterClear') }}
          </button>
        </div>
      </Transition>

      <div v-if="store.isLoading" class="loading-state">{{ t('inventory.loading') }}</div>
      <div v-else-if="store.error" class="error-state">{{ store.error.message || t('inventory.error') }}</div>
      
      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th width="10%">{{ t('inventory.table.columns.code') }}</th>
              <th width="35%">{{ t('inventory.table.columns.product') }}</th>
              <th width="15%">{{ t('inventory.table.columns.category') }}</th>
              <th width="12%" style="text-align: center;">{{ t('inventory.table.columns.stock') }}</th>
              <th width="14%" style="text-align: center;">{{ t('inventory.table.columns.status') }}</th>
              <th width="14%" style="text-align: center;">{{ t('inventory.table.columns.actions') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in paginatedProducts" :key="product.id">
              <td>
                <span class="code-cell">{{ product.code }}</span>
              </td>
              <td>
                <div class="product-cell">
                  <div class="product-icon" :style="{ background: getCategoryIconBg(product.category) }">
                    {{ getCategoryIcon(product.category) }}
                  </div>
                  <span class="product-name">{{ product.name }}</span>
                </div>
              </td>
              <td>
                <span class="category-badge" :style="{
                  backgroundColor: getCategoryColor(product.category).bg,
                  color: getCategoryColor(product.category).text,
                  border: getCategoryColor(product.category).border
                }">
                  {{ getCategoryColor(product.category).label }}
                </span>
              </td>
              <td style="text-align: center;">
                <input 
                  type="number" 
                  v-model="product.stock" 
                  :class="['stock-input', product.stock <= (product.minStock || 5) ? 'stock-input-low' : 'stock-input-normal']"
                />
              </td>
              <td style="text-align: center;">
                <div class="status-wrapper">
                  <span v-if="product.stock <= (product.minStock || 5)" class="status-badge status-bajo">
                    <span class="dot dot-bajo"></span> {{ t('inventory.table.statusLow') }}
                  </span>
                  <span v-else class="status-badge status-normal">
                    <span class="dot dot-normal"></span> {{ t('inventory.table.statusNormal') }}
                  </span>
                </div>
              </td>
              <td style="text-align: center;">
                <button class="btn-update" @click="updateStock(product.id, product.stock)">{{ t('inventory.table.update') }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

            <div class="table-footer" v-if="!store.isLoading && !store.error">
        <div class="footer-info">
          {{ t('inventory.pagination.showing') }} <strong>{{ filteredProducts.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }}-{{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }}</strong> {{ t('inventory.pagination.of') }} <strong>{{ filteredProducts.length }}</strong> {{ t('inventory.pagination.records') }}
        </div>
        <div class="pagination">
          <button class="page-btn-nav" @click="prevPage" :disabled="currentPage === 1">{{ t('inventory.pagination.previous') }}</button>
          
          <button 
            v-for="p in totalPages" :key="p" 
            :class="['page-btn', { 'page-btn-active': p === currentPage }]"
            @click="setPage(p)"
          >
            {{ p }}
          </button>
          
          <button class="page-btn-nav" @click="nextPage" :disabled="currentPage === totalPages">{{ t('inventory.pagination.next') }}</button>
        </div>
      </div>

    </div>

        <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-box"></i></div>
            <div>
              <h2 class="modal-title">{{ t('inventory.modal.title') }}</h2>
              <p class="modal-subtitle">{{ t('inventory.modal.subtitle') }}</p>
            </div>
            <button class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="modal-body" @submit.prevent="submitForm">
                        <div class="form-section">
              <h3 class="section-label"><i class="pi pi-tag"></i> {{ t('inventory.modal.productInfo') }}</h3>
              <div class="form-grid">
                <div class="form-group span-full" :class="{ 'has-error': formErrors.name }">
                  <label>{{ t('inventory.modal.name') }} *</label>
                  <input type="text" v-model="form.name" :placeholder="t('inventory.modal.namePlaceholder')" />
                  <span v-if="formErrors.name" class="error-text">{{ t('inventory.modal.required') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': formErrors.category }">
                  <label>{{ t('inventory.modal.category') }} *</label>
                  <select v-model="form.category">
                    <option value="Medicamento">💊 {{ t('inventory.categories.Medicamento') }}</option>
                    <option value="Alimento">🍊 {{ t('inventory.categories.Alimento') }}</option>
                    <option value="Suministro">💉 {{ t('inventory.categories.Suministro') }}</option>
                  </select>
                  <span v-if="formErrors.category" class="error-text">{{ t('inventory.modal.invalidCategory') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': formErrors.price }">
                  <label>{{ t('inventory.modal.price') }} *</label>
                  <input type="number" step="0.01" min="0" v-model="form.price" :placeholder="t('inventory.modal.pricePlaceholder')" />
                  <span v-if="formErrors.price" class="error-text">{{ t('inventory.modal.invalidPrice') }}</span>
                </div>
              </div>
            </div>

                        <div class="form-section">
              <h3 class="section-label"><i class="pi pi-chart-bar"></i> {{ t('inventory.modal.stockControl') }}</h3>
              <div class="form-grid">
                <div class="form-group" :class="{ 'has-error': formErrors.stock }">
                  <label>{{ t('inventory.modal.stockQty') }} *</label>
                  <input type="number" min="0" v-model="form.stock" :placeholder="t('inventory.modal.stockQtyPlaceholder')" />
                  <span v-if="formErrors.stock" class="error-text">{{ t('inventory.modal.invalidStock') }}</span>
                  <span v-else class="helper-text">{{ t('inventory.modal.stockQtyHelper') }}</span>
                </div>
                <div class="form-group" :class="{ 'has-error': formErrors.minStock }">
                  <label>{{ t('inventory.modal.lowStockAlert') }} *</label>
                  <input type="number" min="0" v-model="form.minStock" :placeholder="t('inventory.modal.lowStockPlaceholder')" />
                  <span v-if="formErrors.minStock" class="error-text">{{ t('inventory.modal.invalidMinStock') }}</span>
                  <span v-else class="helper-text">{{ t('inventory.modal.lowStockHelper') }}</span>
                </div>
              </div>
            </div>

                        <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeModal">{{ t('inventory.modal.cancel') }}</button>
              <button type="submit" class="btn-submit" :disabled="isSaving">
                <i :class="isSaving ? 'pi pi-spin pi-spinner' : 'pi pi-check'"></i>
                {{ isSaving ? t('inventory.modal.saving') : t('inventory.modal.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.inventory-container {
  padding: 32px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #111827;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.low-stock-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff7ed;
  border: 1px solid #fed7aa;
  border-left: 4px solid #f97316;
  border-radius: 10px;
  padding: 14px 20px;
  gap: 12px;
}

.banner-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.banner-icon {
  color: #f97316;
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.banner-content strong {
  font-size: 14px;
  font-weight: 600;
  color: #9a3412;
  display: block;
}

.banner-products {
  font-size: 13px;
  color: #c2410c;
  display: block;
  margin-top: 2px;
}

.banner-dismiss {
  background: none;
  border: none;
  color: #f97316;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  flex-shrink: 0;
  transition: background 0.2s;
}

.banner-dismiss:hover {
  background: #fed7aa;
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-card {
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0px 1px 2px rgba(0,0,0,0.05);
  min-width: 240px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.icon-box {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.stat-badge-danger {
  background: #fef2f2;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
}

.stat-value-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  line-height: 32px;
}

.stat-desc {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
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
}
.search-input::placeholder {
  color: #9ca3af;
}
.search-input:focus {
  border-color: #3b82f6;
}

.category-filter-wrapper {
  position: relative;
}

.category-select {
  height: 40px;
  width: 220px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: #374151;
  outline: none;
  cursor: pointer;
  appearance: none;
}
.category-select:focus {
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
}
.btn-primary:hover {
  background: #1d4ed8;
}

.table-section {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  overflow: hidden;
}

.table-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-title {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.record-badge {
  background: #eff6ff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
}

.table-actions-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 16px;
}

.btn-ghost {
  height: 36px;
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: background 0.2s;
}
.btn-ghost:hover {
  background: #f9fafb;
}
.btn-ghost i {
  color: #6b7280;
}
.btn-ghost.btn-active {
  background: #eff6ff;
  color: #2563eb;
  border-color: #bfdbfe;
}
.btn-ghost.btn-active i {
  color: #3b82f6;
}

.extended-filters {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.filter-group label {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 0 0 10px 0;
  border-bottom: 1px solid #f3f4f6;
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: left;
}

.data-table td {
  padding: 14px 24px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
}

.data-table tbody tr {
  background: #ffffff;
  transition: background 0.2s;
  height: 64px;
}
.data-table tbody tr:hover {
  background: #f9fafb;
}

.code-cell {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  display: inline-block;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.product-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  line-height: 1.4;
}

.category-badge {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  display: inline-block;
}

.stock-input {
  width: 72px;
  text-align: center;
  padding: 6px 12px;
  font-size: 14px;
  border-radius: 8px;
  outline: none;
}
.stock-input-normal {
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #111827;
  font-weight: 600;
}
.stock-input-normal:focus {
  border-color: #3b82f6;
}
.stock-input-low {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #ef4444;
  font-weight: 700;
}
.stock-input-low:focus {
  border-color: #ef4444;
}

.status-wrapper {
  display: flex;
  justify-content: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
}
.status-normal {
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}
.status-bajo {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-normal {
  background: #10b981;
}
.dot-bajo {
  background: #ef4444;
}

.btn-update {
  background: #3b82f6;
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-update:hover {
  background: #2563eb;
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 0 0;
  margin-top: 16px;
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

.toast {
  position: fixed; top: 24px; right: 24px; z-index: 10000;
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 10px;
  font-size: 14px; font-weight: 500;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.toast-success { background: #DCFCE7; color: #166534; border: 1px solid #BBF7D0; }
.toast-error { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
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
  background: #FFFFFF; border-radius: 16px;
  width: 100%; max-width: 600px; max-height: 90vh;
  overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

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

.modal-body { padding: 24px 28px; }

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

.form-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.span-full { grid-column: 1 / -1; }
.form-group label {
  font-size: 13px; font-weight: 500; color: #4b5563;
}
.form-group input,
.form-group select {
  padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 8px;
  font-size: 14px; color: #111827; background: #FFFFFF;
  outline: none; transition: all 0.2s; font-family: inherit;
  width: 100%; box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus {
  border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12);
}
.form-group input::placeholder { color: #9ca3af; }
.form-group select {
  cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236b7280' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
  padding-right: 32px;
}

.has-error input, .has-error select { border-color: #ef4444; }
.has-error input:focus, .has-error select:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.12); }
.error-text { font-size: 12px; color: #ef4444; font-weight: 500; }
.helper-text { font-size: 11px; color: #9ca3af; font-weight: 400; }

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

@media (max-width: 768px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .toolbar { flex-wrap: wrap; }
  .search-input-wrapper { flex-basis: 100%; }
  .category-select { width: 100%; }
}
@media (max-width: 640px) {
  .inventory-container { padding: 16px; }
  .stat-cards { grid-template-columns: 1fr; }
  .modal-overlay { padding: 12px; }
  .modal-container { max-height: 95vh; }
  .modal-header { padding: 16px 20px; }
  .modal-body { padding: 16px 20px; }
  .modal-actions { padding: 16px 20px; }
  .form-grid { grid-template-columns: 1fr; }
  .form-group.span-full { grid-column: 1; }
}
</style>

