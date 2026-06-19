<script setup>
import { onMounted, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useInventoryStore } from '../../application/inventory.store.js';
import { BaseApi } from '@/shared/infrastructure/base-api';
import { useAdminDateLabel } from '@/shared/presentation/composables/use-admin-date-label.js';
import { useCurrencyFormat } from '@/shared/presentation/composables/use-currency-format.js';
import AdminLoadingState from '@/shared/presentation/components/admin-loading-state.component.vue';
import AdminErrorState from '@/shared/presentation/components/admin-error-state.component.vue';

const { t, locale } = useI18n();
const store = useInventoryStore();
const { adminDateLabel } = useAdminDateLabel();
const { symbol } = useCurrencyFormat();

const categoryOptions = [
  { value: 'Medicamento', icon: 'pi-heart-fill' },
  { value: 'Alimento', icon: 'pi-shopping-bag' },
  { value: 'Suministro', icon: 'pi-box' }
];

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

const statusFilterOptions = [
  { value: '__all__', labelKey: 'inventory.table.filterAllStatuses', icon: 'pi-list' },
  { value: 'normal', labelKey: 'inventory.table.filterStatusNormal', icon: 'pi-check-circle' },
  { value: 'low', labelKey: 'inventory.table.filterStatusLow', icon: 'pi-exclamation-circle' },
];

const categories = computed(() => {
  const cats = new Set(store.products.map(p => p.category));
  return ['__all__', ...Array.from(cats)];
});

const getCategoryDisplayName = (cat) => {
  if (cat === '__all__') return t('inventory.toolbar.allCategories');
  return t(`inventory.categories.${cat}`, cat);
};

const filteredProducts = computed(() => {
  return store.products
    .filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                        p.code.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchCategory = selectedCategory.value === '__all__' || p.category === selectedCategory.value;
    const isLowStock = p.stock <= (p.minStock || 5);
    const matchStatus = selectedStatus.value === '__all__' ||
                        (selectedStatus.value === 'low' && isLowStock) ||
                        (selectedStatus.value === 'normal' && !isLowStock);
    return matchSearch && matchCategory && matchStatus;
  })
    .sort((a, b) => a.id - b.id);
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
  if (cat === 'medicamento' || cat === 'medicine') return '#ecfdf5';
  if (cat === 'alimento' || cat === 'food') return '#fffbeb';
  if (cat === 'suministro' || cat === 'supply') return '#ecfdf5';
  return '#eef2f6';
};

const getCategoryColor = (category) => {
  const cat = category?.toLowerCase();
  if (cat === 'medicamento' || cat === 'medicine') return { bg: '#ecfdf5', text: '#0f766e', border: '#14b8a6', label: t('inventory.categories.Medicamento') };
  if (cat === 'alimento' || cat === 'food') return { bg: '#fffbeb', text: '#b45309', border: '#fed7aa', label: t('inventory.categories.Alimento') };
  if (cat === 'suministro' || cat === 'supply') return { bg: '#ecfdf5', text: '#14b8a6', border: '#a7f3d0', label: t('inventory.categories.Suministro') };
  return { bg: '#eef2f6', text: '#64748b', border: '#e2e8f0', label: category };
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

const previewCode = computed(() =>
  form.value.name.trim() ? generateCode() : t('inventory.modal.codePreviewEmpty')
);

const previewStockStatus = computed(() => {
  if (form.value.stock === '' || form.value.minStock === '') return null;
  return Number(form.value.stock) <= Number(form.value.minStock) ? 'low' : 'normal';
});

const priceCurrencyLabel = computed(() =>
  t('inventory.modal.priceHint', { currency: symbol.value === 'S/' ? 'PEN' : 'USD' })
);

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

// --- Kardex Logic ---
const showKardexModal = ref(false);
const kardexTransactions = ref([]);
const kardexProduct = ref(null);
const isKardexLoading = ref(false);

const openKardex = async (product) => {
  kardexProduct.value = product;
  isKardexLoading.value = true;
  showKardexModal.value = true;
  
  try {
    const response = await BaseApi.get(`/products/${product.id}/kardex`);
    kardexTransactions.value = response.data;
  } catch (e) {
    displayToast(t('inventory.kardex.loadError'), 'error');
  } finally {
    isKardexLoading.value = false;
  }
};

const closeKardex = () => {
  showKardexModal.value = false;
  kardexTransactions.value = [];
  kardexProduct.value = null;
};

const exportKardexCSV = () => {
  if (kardexTransactions.value.length === 0) {
    displayToast(t('inventory.kardex.exportNoData'), 'error');
    return;
  }
  const headers = [
    t('inventory.kardex.columns.date'),
    t('inventory.kardex.columns.type'),
    t('inventory.kardex.columns.change'),
    t('inventory.kardex.columns.stock'),
    t('inventory.kardex.columns.reason'),
    t('inventory.kardex.columns.responsible')
  ];
  const csvContent = [
    headers.join(','),
    ...kardexTransactions.value.map(tRow => [
      `"${formatKardexDate(tRow.date)}"`,
      `"${getKardexTypeLabel(tRow.type)}"`,
      tRow.quantityChange > 0 ? `+${tRow.quantityChange}` : tRow.quantityChange,
      tRow.newStock,
      `"${tRow.reason}"`,
      `"${tRow.responsibleUser}"`
    ].join(','))
  ].join('\n');
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `kardex_${kardexProduct.value?.code}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'es-PE'));

const formatKardexDate = (dateString) =>
  new Date(dateString).toLocaleString(dateLocale.value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

const getKardexTypeLabel = (type) => t(`inventory.kardex.types.${type}`, type);

const getKardexTypeClass = (type) => {
  if (type === 'Ingreso') return 'kardex-type kardex-type--in';
  if (type === 'Salida') return 'kardex-type kardex-type--out';
  return 'kardex-type kardex-type--adjust';
};

const kardexStats = computed(() => {
  const entries = kardexTransactions.value.filter(row => row.quantityChange > 0).length;
  const exits = kardexTransactions.value.filter(row => row.quantityChange < 0).length;
  return {
    entries,
    exits,
    total: kardexTransactions.value.length
  };
});
</script>

<template>
  <div class="inventory-container">

        <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <header class="bi-admin-header">
      <p class="bi-eyebrow">{{ t('layout.adminPanelEyebrow', { date: adminDateLabel }) }}</p>
      <h1 class="bi-admin-title">{{ t('layout.adminPageTitle.inventory') }}</h1>
    </header>

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
          <div class="icon-box icon-box-teal">
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
          <div class="icon-box icon-box-success">
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
          <div class="icon-box icon-box-warning">
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
          <div class="icon-box icon-box-accent">
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

        <div class="toolbar-panel">
      <div class="toolbar">
        <div class="search-input-wrapper">
          <i class="pi pi-search search-icon"></i>
          <input type="text" v-model="searchQuery" :placeholder="t('inventory.toolbar.search')" class="search-input" />
        </div>

        <div class="toolbar-divider" aria-hidden="true"></div>

        <div class="category-filter-wrapper">
          <select v-model="selectedCategory" class="category-select" :aria-label="t('inventory.toolbar.allCategories')">
            <option v-for="cat in categories" :key="cat" :value="cat">{{ getCategoryDisplayName(cat) }}</option>
          </select>
          <i class="pi pi-chevron-down category-chevron"></i>
        </div>

        <button class="btn-primary" @click="openModal">
          <i class="pi pi-plus"></i>
          {{ t('inventory.toolbar.newProduct') }}
        </button>
      </div>
    </div>

        <div class="table-section">
            <div class="table-header-row">
        <h3 class="table-title">{{ t('inventory.table.title') }}</h3>
        <span class="record-badge">{{ filteredProducts.length }} {{ t('inventory.table.records') }}</span>
      </div>

            <div class="table-actions-row">
        <Transition name="fade">
          <div v-if="showFilters" class="inline-filters">
            <span class="inline-filters-label">{{ t('inventory.table.filterStatus') }}</span>
            <div class="status-filter-chips" role="radiogroup" :aria-label="t('inventory.table.filterStatus')">
              <button
                v-for="option in statusFilterOptions"
                :key="option.value"
                type="button"
                role="radio"
                :aria-checked="selectedStatus === option.value"
                :class="['status-chip', `status-chip--${option.value}`, { 'status-chip--active': selectedStatus === option.value }]"
                @click="selectedStatus = option.value"
              >
                <i :class="['pi', option.icon]"></i>
                <span>{{ t(option.labelKey) }}</span>
              </button>
            </div>
          </div>
        </Transition>

        <div class="table-actions-buttons">
          <button class="btn-ghost" @click="exportCSV">
            <i class="pi pi-download"></i> {{ t('inventory.table.export') }}
          </button>
          <button :class="['btn-ghost', { 'btn-active': showFilters }]" @click="toggleFilters">
            <i class="pi pi-sliders-h"></i> {{ t('inventory.table.filters') }}
          </button>
        </div>
      </div>

      <AdminLoadingState
        v-if="store.isLoading"
        compact
        :message="t('inventory.loading')"
      />
      <AdminErrorState
        v-else-if="store.error"
        compact
        :message="store.error.message || t('inventory.error')"
      />
      
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
                <div style="display:flex; justify-content:center; gap:8px;">
                  <button class="btn-update" @click="updateStock(product.id, product.stock)">{{ t('inventory.table.update') }}</button>
                  <button class="btn-ghost" @click="openKardex(product)" style="padding: 6px; height: 32px;" title="Ver Kardex">
                    <i class="pi pi-book"></i>
                  </button>
                </div>
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
        <div class="modal-container product-modal">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-box"></i></div>
            <div>
              <h2 class="modal-title">{{ t('inventory.modal.title') }}</h2>
              <p class="modal-subtitle">{{ t('inventory.modal.subtitle') }}</p>
            </div>
            <button type="button" class="modal-close" @click="closeModal"><i class="pi pi-times"></i></button>
          </div>

          <form class="product-form" @submit.prevent="submitForm">
            <div class="product-form-body">
              <div class="product-preview">
                <div class="product-preview-main">
                  <span class="product-preview-label">{{ t('inventory.modal.codePreview') }}</span>
                  <span class="product-preview-code">{{ previewCode }}</span>
                </div>
                <span
                  v-if="previewStockStatus"
                  :class="['product-preview-status', previewStockStatus === 'low' ? 'is-low' : 'is-normal']"
                >
                  {{ previewStockStatus === 'low' ? t('inventory.modal.statusPreviewLow') : t('inventory.modal.statusPreviewNormal') }}
                </span>
              </div>

              <section class="form-panel">
                <h3 class="form-panel-title">
                  <i class="pi pi-tag"></i>
                  {{ t('inventory.modal.productInfo') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group span-full" :class="{ 'has-error': formErrors.name }">
                    <label for="product-name">{{ t('inventory.modal.name') }} *</label>
                    <input
                      id="product-name"
                      type="text"
                      v-model="form.name"
                      :placeholder="t('inventory.modal.namePlaceholder')"
                    />
                    <span v-if="formErrors.name" class="error-text">{{ t('inventory.modal.required') }}</span>
                  </div>

                  <div class="form-group span-full" :class="{ 'has-error': formErrors.category }">
                    <label>{{ t('inventory.modal.category') }} *</label>
                    <div class="category-picker" role="radiogroup" :aria-label="t('inventory.modal.category')">
                      <button
                        v-for="option in categoryOptions"
                        :key="option.value"
                        type="button"
                        role="radio"
                        :aria-checked="form.category === option.value"
                        :class="['category-chip', { 'category-chip--active': form.category === option.value }]"
                        @click="form.category = option.value"
                      >
                        <i :class="['pi', option.icon]"></i>
                        <span>{{ t(`inventory.categories.${option.value}`) }}</span>
                      </button>
                    </div>
                    <span v-if="formErrors.category" class="error-text">{{ t('inventory.modal.invalidCategory') }}</span>
                  </div>

                  <div class="form-group span-full" :class="{ 'has-error': formErrors.price }">
                    <label for="product-price">{{ t('inventory.modal.price') }} *</label>
                    <div class="input-with-prefix">
                      <span class="input-prefix">{{ symbol }}</span>
                      <input
                        id="product-price"
                        type="number"
                        step="0.01"
                        min="0"
                        v-model="form.price"
                        :placeholder="t('inventory.modal.pricePlaceholder')"
                      />
                    </div>
                    <span class="helper-text">{{ priceCurrencyLabel }}</span>
                    <span v-if="formErrors.price" class="error-text">{{ t('inventory.modal.invalidPrice') }}</span>
                  </div>
                </div>
              </section>

              <section class="form-panel">
                <h3 class="form-panel-title">
                  <i class="pi pi-chart-bar"></i>
                  {{ t('inventory.modal.stockControl') }}
                </h3>
                <div class="form-grid">
                  <div class="form-group" :class="{ 'has-error': formErrors.stock }">
                    <label for="product-stock">{{ t('inventory.modal.stockQty') }} *</label>
                    <input
                      id="product-stock"
                      type="number"
                      min="0"
                      v-model="form.stock"
                      :placeholder="t('inventory.modal.stockQtyPlaceholder')"
                    />
                    <span v-if="formErrors.stock" class="error-text">{{ t('inventory.modal.invalidStock') }}</span>
                    <span v-else class="helper-text">{{ t('inventory.modal.stockQtyHelper') }}</span>
                  </div>
                  <div class="form-group" :class="{ 'has-error': formErrors.minStock }">
                    <label for="product-min-stock">{{ t('inventory.modal.lowStockAlert') }} *</label>
                    <input
                      id="product-min-stock"
                      type="number"
                      min="0"
                      v-model="form.minStock"
                      :placeholder="t('inventory.modal.lowStockPlaceholder')"
                    />
                    <span v-if="formErrors.minStock" class="error-text">{{ t('inventory.modal.invalidMinStock') }}</span>
                    <span v-else class="helper-text">{{ t('inventory.modal.lowStockHelper') }}</span>
                  </div>
                </div>
              </section>
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

    <Transition name="modal">
      <div v-if="showKardexModal" class="modal-overlay" @click.self="closeKardex">
        <div class="modal-container kardex-modal">
          <div class="modal-header">
            <div class="modal-header-icon"><i class="pi pi-history"></i></div>
            <div>
              <h2 class="modal-title">{{ t('inventory.kardex.title') }}</h2>
              <p class="modal-subtitle">
                {{ t('inventory.kardex.subtitle', { name: kardexProduct?.name, code: kardexProduct?.code }) }}
              </p>
            </div>
            <button class="modal-close" @click="closeKardex"><i class="pi pi-times"></i></button>
          </div>

          <div class="modal-body kardex-modal-body">
            <div class="kardex-toolbar">
              <p class="kardex-description">{{ t('inventory.kardex.description') }}</p>
              <button
                type="button"
                class="btn-ghost kardex-export-btn"
                :disabled="isKardexLoading || kardexTransactions.length === 0"
                @click="exportKardexCSV"
              >
                <i class="pi pi-download"></i> {{ t('inventory.kardex.export') }}
              </button>
            </div>

            <div v-if="!isKardexLoading && kardexTransactions.length > 0" class="kardex-stats">
              <div class="kardex-stat">
                <span class="kardex-stat-label">{{ t('inventory.kardex.stats.currentStock') }}</span>
                <span class="kardex-stat-value">{{ kardexProduct?.stock ?? '—' }}</span>
              </div>
              <div class="kardex-stat">
                <span class="kardex-stat-label">{{ t('inventory.kardex.stats.movements') }}</span>
                <span class="kardex-stat-value">{{ kardexStats.total }}</span>
              </div>
              <div class="kardex-stat kardex-stat--in">
                <span class="kardex-stat-label">{{ t('inventory.kardex.stats.entries') }}</span>
                <span class="kardex-stat-value">{{ kardexStats.entries }}</span>
              </div>
              <div class="kardex-stat kardex-stat--out">
                <span class="kardex-stat-label">{{ t('inventory.kardex.stats.exits') }}</span>
                <span class="kardex-stat-value">{{ kardexStats.exits }}</span>
              </div>
            </div>

            <AdminLoadingState
              v-if="isKardexLoading"
              compact
              :message="t('inventory.kardex.loading')"
            />

            <div v-else-if="kardexTransactions.length === 0" class="kardex-state">
              <i class="pi pi-inbox"></i>
              <p>{{ t('inventory.kardex.empty') }}</p>
            </div>

            <div v-else class="kardex-table-wrap">
              <table class="kardex-table">
                <thead>
                  <tr>
                    <th>{{ t('inventory.kardex.columns.date') }}</th>
                    <th>{{ t('inventory.kardex.columns.type') }}</th>
                    <th class="col-center">{{ t('inventory.kardex.columns.change') }}</th>
                    <th class="col-center">{{ t('inventory.kardex.columns.stock') }}</th>
                    <th>{{ t('inventory.kardex.columns.reason') }}</th>
                    <th>{{ t('inventory.kardex.columns.responsible') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in kardexTransactions" :key="row.id">
                    <td class="cell-date">{{ formatKardexDate(row.date) }}</td>
                    <td>
                      <span :class="getKardexTypeClass(row.type)">
                        <i :class="row.type === 'Ingreso' ? 'pi pi-arrow-up' : row.type === 'Salida' ? 'pi pi-arrow-down' : 'pi pi-sync'"></i>
                        {{ getKardexTypeLabel(row.type) }}
                      </span>
                    </td>
                    <td class="col-center">
                      <span
                        class="kardex-change"
                        :class="{
                          'kardex-change--in': row.quantityChange > 0,
                          'kardex-change--out': row.quantityChange < 0,
                          'kardex-change--neutral': row.quantityChange === 0
                        }"
                      >
                        {{ row.quantityChange > 0 ? '+' + row.quantityChange : row.quantityChange }}
                      </span>
                    </td>
                    <td class="col-center cell-stock">{{ row.newStock }}</td>
                    <td class="cell-reason">{{ row.reason }}</td>
                    <td class="cell-responsible">
                      <span class="kardex-user">
                        <i class="pi pi-user"></i>
                        {{ row.responsibleUser }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="modal-actions kardex-actions">
              <button type="button" class="btn-cancel" @click="closeKardex">{{ t('inventory.kardex.close') }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');


.inventory-container {
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
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.low-stock-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--bi-amber-soft);
  border: 1px solid color-mix(in srgb, var(--bi-amber) 30%, transparent);
  border-left: 4px solid var(--bi-amber);
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
  color: var(--bi-amber);
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.banner-content strong {
  font-size: 14px;
  font-weight: 600;
  color: var(--bi-amber);
  display: block;
}

.banner-products {
  font-size: 13px;
  color: var(--bi-amber);
  display: block;
  margin-top: 2px;
}

.banner-dismiss {
  background: none;
  border: none;
  color: var(--bi-amber);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  flex-shrink: 0;
  transition: background 0.2s;
}

.banner-dismiss:hover {
  background: color-mix(in srgb, var(--bi-amber) 30%, transparent);
}

.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-card {
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: var(--bi-radius);
  padding: 20px 24px;
  box-shadow: var(--shadow-card);
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

.icon-box-teal {
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
}

.icon-box-success {
  background: var(--bi-teal-soft);
  color: var(--bi-teal-light);
}

.icon-box-warning {
  background: var(--bi-amber-soft);
  color: var(--bi-amber);
}

.icon-box-accent {
  background: var(--bi-teal-soft);
  color: var(--bi-teal-light);
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--bi-muted);
}

.stat-badge-danger {
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-indicator);
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
  color: var(--bi-ink);
  margin: 0;
  line-height: 32px;
}

.stat-desc {
  font-size: 12px;
  font-weight: 500;
  color: var(--bi-muted);
}

.toolbar-panel {
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: var(--bi-radius);
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-card);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar-divider {
  width: 1px;
  height: 28px;
  background: var(--bi-border);
  flex-shrink: 0;
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
}
.search-input::placeholder {
  color: var(--bi-muted);
}
.search-input:focus {
  border-color: var(--bi-teal);
}

.category-filter-wrapper {
  position: relative;
  flex-shrink: 0;
}

.category-select {
  height: 40px;
  width: 220px;
  background: var(--bi-bg);
  border: 1px solid var(--bi-border);
  border-radius: 10px;
  padding: 10px 36px 10px 14px;
  font-size: 14px;
  font-weight: 500;
  color: var(--bi-ink);
  outline: none;
  cursor: pointer;
  appearance: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.category-select:focus {
  border-color: var(--bi-teal);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--bi-teal) 12%, transparent);
}

.category-chevron {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--bi-muted);
  font-size: 12px;
  pointer-events: none;
}

.btn-primary {
  height: 40px;
  background: var(--bi-teal);
  color: var(--bi-paper);
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s ease;
  box-shadow: var(--shadow-card);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  white-space: nowrap;
}
.btn-primary i {
  font-size: 13px;
}
.btn-primary:hover {
  background: #0d655e;
}

.table-section {
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: var(--bi-radius);
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
  color: var(--bi-ink);
  margin: 0;
}

.record-badge {
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 20px;
}

.table-actions-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  min-height: 36px;
}

.table-actions-buttons {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.inline-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.inline-filters-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--bi-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.btn-ghost {
  height: 36px;
  background: var(--bi-paper);
  color: var(--bi-ink);
  border: 1px solid var(--bi-border);
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
  background: var(--bi-bg);
}
.btn-ghost i {
  color: var(--bi-muted);
}
.btn-ghost.btn-active {
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
  border-color: var(--bi-teal-soft);
}
.btn-ghost.btn-active i {
  color: var(--bi-teal);
}

.status-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--bi-border);
  border-radius: 9999px;
  background: var(--bi-paper);
  color: var(--bi-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  font-family: inherit;
}
.status-chip i {
  font-size: 13px;
}
.status-chip:hover {
  border-color: color-mix(in srgb, var(--bi-teal) 30%, var(--bi-border));
  color: var(--bi-ink);
}
.status-chip--active {
  background: var(--bi-teal-soft);
  border-color: var(--bi-teal);
  color: var(--bi-teal);
  font-weight: 600;
}
.status-chip--low.status-chip--active {
  background: color-mix(in srgb, var(--bi-amber) 14%, transparent);
  border-color: var(--bi-amber);
  color: var(--bi-amber);
}
.status-chip:focus-visible {
  outline: 2px solid var(--bi-teal);
  outline-offset: 2px;
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
  border-bottom: 1px solid var(--bi-border);
  font-size: 11px;
  font-weight: 500;
  color: var(--bi-muted);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: left;
}

.data-table td {
  padding: 14px 24px;
  border-bottom: 1px solid var(--bi-border);
  vertical-align: middle;
}

.data-table tbody tr {
  background: var(--bi-paper);
  transition: background 0.2s;
  height: 64px;
}
.data-table tbody tr:hover {
  background: var(--bi-bg);
}

.code-cell {
  background: var(--bi-bg);
  border: 1px solid var(--bi-border);
  color: var(--bi-muted);
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
  color: var(--bi-ink);
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
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  color: var(--bi-ink);
  font-weight: 600;
}
.stock-input-normal:focus {
  border-color: var(--bi-teal);
}
.stock-input-low {
  background: var(--color-status-danger-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 30%, transparent);
  color: var(--color-status-danger-indicator);
  font-weight: 700;
}
.stock-input-low:focus {
  border-color: var(--color-status-danger-indicator);
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
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
  border: 1px solid color-mix(in srgb, var(--bi-teal-light) 30%, transparent);
}
.status-bajo {
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-text);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 30%, transparent);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}
.dot-normal {
  background: var(--bi-teal-light);
}
.dot-bajo {
  background: var(--color-status-danger-indicator);
}

.btn-update {
  background: var(--bi-teal);
  color: var(--bi-paper);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.btn-update:hover {
  background: var(--bi-teal);
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0 0 0;
  margin-top: 16px;
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

.kardex-modal {
  max-width: 840px;
}

.kardex-modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.kardex-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.kardex-description {
  margin: 0;
  font-size: 13px;
  color: var(--bi-muted);
  line-height: 1.4;
}

.kardex-export-btn {
  height: 36px;
  padding: 0 14px;
  border-color: var(--bi-border);
  flex-shrink: 0;
}

.kardex-export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.kardex-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.kardex-stat {
  background: var(--bi-bg);
  border: 1px solid var(--bi-border);
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kardex-stat--in {
  background: var(--bi-teal-soft);
  border-color: color-mix(in srgb, var(--bi-teal-light) 25%, var(--bi-border));
}

.kardex-stat--out {
  background: #fef2f2;
  border-color: #fecaca;
}

.kardex-stat-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bi-muted);
}

.kardex-stat-value {
  font-family: var(--bi-font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--bi-ink);
  line-height: 1.2;
}

.kardex-stat--in .kardex-stat-value {
  color: var(--bi-teal);
}

.kardex-stat--out .kardex-stat-value {
  color: #b91c1c;
}

.kardex-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 16px;
  color: var(--bi-muted);
  border: 1px dashed var(--bi-border);
  border-radius: 10px;
  background: var(--bi-bg);
}

.kardex-state i {
  font-size: 1.5rem;
  color: var(--bi-teal);
}

.kardex-state p {
  margin: 0;
  font-size: 14px;
  text-align: center;
}

.kardex-table-wrap {
  max-height: 380px;
  overflow: auto;
  border: 1px solid var(--bi-border);
  border-radius: 10px;
  background: var(--bi-paper);
}

.kardex-table {
  width: 100%;
  border-collapse: collapse;
}

.kardex-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}

.kardex-table th {
  background: var(--bi-bg);
  color: var(--bi-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  text-align: left;
  padding: 12px 14px;
  border-bottom: 1px solid var(--bi-border);
}

.kardex-table td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--bi-border);
  font-size: 13px;
  color: var(--bi-ink);
  vertical-align: middle;
}

.kardex-table tbody tr:hover {
  background: #f8fafc;
}

.kardex-table tbody tr:last-child td {
  border-bottom: none;
}

.kardex-table .col-center,
.kardex-table th.col-center {
  text-align: center;
}

.cell-date {
  white-space: nowrap;
  color: var(--bi-muted);
  font-variant-numeric: tabular-nums;
}

.cell-stock {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.cell-reason {
  color: var(--bi-ink);
  max-width: 220px;
}

.cell-responsible {
  max-width: 180px;
}

.kardex-type {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.kardex-type--in {
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
}

.kardex-type--out {
  background: #fef2f2;
  color: #b91c1c;
}

.kardex-type--adjust {
  background: var(--bi-amber-soft);
  color: var(--bi-amber);
}

.kardex-change {
  display: inline-block;
  min-width: 36px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.kardex-change--in { color: var(--bi-teal); }
.kardex-change--out { color: #b91c1c; }
.kardex-change--neutral { color: var(--bi-muted); }

.kardex-user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--bi-muted);
  word-break: break-all;
}

.kardex-user i {
  font-size: 11px;
  flex-shrink: 0;
}

.kardex-actions {
  margin-top: 4px;
  padding-top: 16px;
  border-top: 1px solid var(--bi-border);
}

.product-modal {
  max-width: 560px;
}

.product-form {
  display: flex;
  flex-direction: column;
}

.product-form-body {
  padding: 20px 28px 8px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.product-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bi-bg);
  border: 1px solid var(--bi-border);
  border-radius: 10px;
}

.product-preview-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.product-preview-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bi-muted);
}

.product-preview-code {
  font-family: var(--bi-font-display);
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--bi-teal);
  letter-spacing: 0.02em;
}

.product-preview-status {
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}

.product-preview-status.is-normal {
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
}

.product-preview-status.is-low {
  background: var(--bi-amber-soft);
  color: var(--bi-amber);
}

.form-panel {
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: 12px;
  padding: 18px 18px 16px;
}

.form-panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--bi-ink);
  letter-spacing: 0.01em;
}

.form-panel-title i {
  color: var(--bi-teal);
  font-size: 14px;
}

.category-picker {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.category-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid var(--bi-border);
  border-radius: 10px;
  background: var(--bi-bg);
  color: var(--bi-muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
  font-family: inherit;
}

.category-chip i {
  font-size: 16px;
}

.category-chip:hover {
  border-color: color-mix(in srgb, var(--bi-teal) 30%, var(--bi-border));
  color: var(--bi-ink);
}

.category-chip--active {
  background: var(--bi-teal-soft);
  border-color: var(--bi-teal);
  color: var(--bi-teal);
}

.category-chip:focus-visible {
  outline: 2px solid var(--bi-teal);
  outline-offset: 2px;
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

.input-with-prefix input {
  flex: 1;
  border: none;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--bi-ink);
  background: transparent;
  outline: none;
  min-width: 0;
  font-family: inherit;
}

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
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.span-full { grid-column: 1 / -1; }
.form-group label {
  font-size: 13px; font-weight: 500; color: var(--bi-muted);
}
.form-group input,
.form-group select {
  padding: 10px 12px; border: 1px solid var(--bi-border); border-radius: 8px;
  font-size: 14px; color: var(--bi-ink); background: var(--bi-paper);
  outline: none; transition: all 0.2s; font-family: inherit;
  width: 100%; box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus {
  border-color: var(--bi-teal); box-shadow: 0 0 0 3px color-mix(in srgb, var(--bi-teal) 12%, transparent);
}
.form-group input::placeholder { color: var(--bi-muted); }
.form-group select {
  cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%2364748B' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 12px center;
  padding-right: 32px;
}

.has-error input, .has-error select { border-color: var(--color-status-danger-indicator); }
.has-error input:focus, .has-error select:focus { box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-status-danger-indicator) 12%, transparent); }
.error-text { font-size: 12px; color: var(--color-status-danger-indicator); font-weight: 500; }
.helper-text { font-size: 11px; color: var(--bi-muted); font-weight: 400; }

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
.btn-submit:hover {
  background: linear-gradient(135deg, var(--bi-teal), #0d655e);
  box-shadow: 0 4px 12px rgba(15, 118, 110, 0.28);
}
.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

@media (max-width: 768px) {
  .stat-cards { grid-template-columns: repeat(2, 1fr); }
  .toolbar { flex-wrap: wrap; }
  .toolbar-divider { display: none; }
  .search-input-wrapper { flex-basis: 100%; }
  .category-filter-wrapper { flex: 1 1 auto; min-width: 0; }
  .category-select { width: 100%; }
  .btn-primary { flex: 1 1 auto; justify-content: center; }
  .table-actions-row { flex-wrap: wrap; align-items: flex-start; }
  .inline-filters { flex-basis: 100%; flex-wrap: wrap; }
  .table-actions-buttons { margin-left: 0; width: 100%; justify-content: flex-end; }
  .status-filter-chips { gap: 6px; }
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
  .kardex-stats { grid-template-columns: repeat(2, 1fr); }
  .kardex-table-wrap { max-height: 300px; }
  .category-picker { grid-template-columns: 1fr; }
  .product-form-body { padding: 16px 20px 8px; }
  .product-preview { flex-direction: column; align-items: flex-start; }
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

