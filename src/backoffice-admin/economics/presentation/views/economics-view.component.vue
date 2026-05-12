<script setup>
import { onMounted, ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useEconomicsStore } from '../../application/economics.store.js';

const { t } = useI18n();
const store = useEconomicsStore();

const currentPage = ref(1);
const itemsPerPage = 8;

const showFilters = ref(false);
const selectedType = ref('__all__');
const selectedCategory = ref('__all__');

const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref('');

const displayToast = (msg, type) => {
  toastMessage.value = msg;
  toastType.value = type;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3500);
};

const toggleFilters = () => {
  showFilters.value = !showFilters.value;
};

const clearFilters = () => {
  selectedType.value = '__all__';
  selectedCategory.value = '__all__';
};

const categories = computed(() => {
  const cats = new Set(store.entries.map(e => e.category));
  return ['__all__', ...Array.from(cats)];
});

const filteredEntries = computed(() => {
  return store.entries.filter(e => {
    const matchType = selectedType.value === '__all__' || e.type === selectedType.value;
    const matchCategory = selectedCategory.value === '__all__' || e.category === selectedCategory.value;
    return matchType && matchCategory;
  });
});

onMounted(() => {
  store.fetchEntries();
});

const formatMoneyParts = (val) => {
  const num = Number(val) || 0;
  const parts = num.toFixed(2).split('.');
  return {
    int: parseInt(parts[0]).toLocaleString('en-US'),
    dec: '.' + parts[1]
  };
};

const paginatedEntries = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredEntries.value.slice(start, start + itemsPerPage);
});

const totalPages = computed(() => Math.ceil(filteredEntries.value.length / itemsPerPage) || 1);

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++;
};

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--;
};

const setPage = (p) => {
  currentPage.value = p;
};

const exportCSV = () => {
  if (filteredEntries.value.length === 0) {
    displayToast(t('economics.table.exportNoData'), 'error');
    return;
  }
  
  const headers = [
    t('economics.table.columns.date'),
    t('economics.table.columns.type'),
    t('economics.table.columns.category'),
    t('economics.table.columns.description'),
    t('economics.table.columns.amount')
  ];
  
  const csvContent = [
    headers.join(','),
    ...filteredEntries.value.map(e => {
      const typeTranslated = e.type === 'Ingreso' ? t('economics.types.income') : t('economics.types.expense');
      return [
        `"${new Date(e.date).toLocaleDateString('es-ES')}"`,
        `"${typeTranslated}"`,
        `"${e.category}"`,
        `"${e.description}"`,
        e.amount
      ].join(',');
    })
  ].join('\n');
  
  const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `movimientos_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  displayToast(t('economics.table.exportSuccess'), 'success');
};

const totalIncomePercent = computed(() => {
  const total = store.totalIncome + store.totalExpense;
  if (total === 0) return 0;
  return Math.round((store.totalIncome / total) * 100);
});

const totalExpensePercent = computed(() => {
  const total = store.totalIncome + store.totalExpense;
  if (total === 0) return 0;
  return Math.round((store.totalExpense / total) * 100);
});
</script>

<template>
  <div class="economics-view">
    <!-- Toast -->
    <Transition name="toast">
      <div v-if="showToast" :class="['toast', `toast-${toastType}`]">
        <i :class="toastType === 'success' ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>

    <div class="kpi-row">
      <!-- Ingresos -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">{{ t('economics.kpi.income') }}</span>
          <div class="kpi-icon-box icon-income"><i class="pi pi-arrow-up-right"></i></div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-val-int">${{ formatMoneyParts(store.totalIncome).int }}</span>
          <span class="kpi-val-dec">{{ formatMoneyParts(store.totalIncome).dec }}</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-badge badge-income">
            <i class="pi pi-arrow-up" style="font-size: 10px;"></i> +12.4%
          </span>
          <span class="kpi-comp-label">{{ t('economics.kpi.vsPreviousMonth') }}</span>
        </div>
      </div>

      <!-- Egresos -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">{{ t('economics.kpi.expense') }}</span>
          <div class="kpi-icon-box icon-expense"><i class="pi pi-arrow-down-right"></i></div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-val-int">${{ formatMoneyParts(store.totalExpense).int }}</span>
          <span class="kpi-val-dec">{{ formatMoneyParts(store.totalExpense).dec }}</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-badge badge-expense">
            <i class="pi pi-arrow-up" style="font-size: 10px;"></i> +3.1%
          </span>
          <span class="kpi-comp-label">{{ t('economics.kpi.vsPreviousMonth') }}</span>
        </div>
      </div>

      <!-- Balance -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-label">{{ t('economics.kpi.balance') }}</span>
          <div class="kpi-icon-box icon-balance"><i class="pi pi-wallet"></i></div>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-val-int">${{ formatMoneyParts(store.balance).int }}</span>
          <span class="kpi-val-dec">{{ formatMoneyParts(store.balance).dec }}</span>
        </div>
        <div class="kpi-footer">
          <span class="kpi-badge badge-balance">
            <i class="pi pi-arrow-up" style="font-size: 10px;"></i> +8.7%
          </span>
          <span class="kpi-comp-label">{{ t('economics.kpi.vsPreviousMonth') }}</span>
        </div>
      </div>
    </div>

    <div class="dashboard-body">
      <section class="main-column">
        <div class="recent-transactions-panel">
          <div class="panel-header-container">
            <div class="table-header-row">
              <h3 class="table-title">{{ t('economics.table.title') }}</h3>
              <span class="record-badge">{{ filteredEntries.length }} {{ t('economics.table.records') }}</span>
            </div>

            <div class="table-actions-row">
              <button class="btn-ghost" @click="exportCSV">
                <i class="pi pi-download"></i> {{ t('economics.table.export') }}
              </button>
              <button :class="['btn-ghost', { 'btn-active': showFilters }]" @click="toggleFilters">
                <i class="pi pi-sliders-h"></i> {{ t('economics.table.filters') }}
              </button>
            </div>
            
            <!-- Extended Filters -->
            <Transition name="fade">
              <div v-if="showFilters" class="extended-filters">
                <div class="filter-group">
                  <label>{{ t('economics.table.filterType') }}</label>
                  <select v-model="selectedType" class="category-select">
                    <option value="__all__">{{ t('economics.table.filterAllTypes') }}</option>
                    <option value="Ingreso">{{ t('economics.types.income') }}</option>
                    <option value="Egreso">{{ t('economics.types.expense') }}</option>
                  </select>
                </div>
                <div class="filter-group">
                  <label>{{ t('economics.table.filterCategory') }}</label>
                  <select v-model="selectedCategory" class="category-select">
                    <option v-for="cat in categories" :key="cat" :value="cat">
                      {{ cat === '__all__' ? t('economics.table.filterAllCategories') : cat }}
                    </option>
                  </select>
                </div>
                <button class="btn-ghost" @click="clearFilters" style="height: 40px; margin-top: auto;">
                  <i class="pi pi-filter-slash"></i> {{ t('economics.table.filterClear') }}
                </button>
              </div>
            </Transition>
          </div>
          
          <div class="table-wrapper">
            <div v-if="store.isLoading" class="p-4">Cargando...</div>
            <table v-else class="transactions-table">
              <thead>
                <tr>
                  <th class="col-fecha">{{ t('economics.table.columns.date') }}</th>
                  <th class="col-tipo">{{ t('economics.table.columns.type') }}</th>
                  <th class="col-categoria">{{ t('economics.table.columns.category') }}</th>
                  <th class="col-descripcion">{{ t('economics.table.columns.description') }}</th>
                  <th class="col-monto">{{ t('economics.table.columns.amount') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(entry, index) in paginatedEntries" :key="entry.id" :class="index % 2 === 0 ? 'row-even' : 'row-odd'">
                  <td class="cell-fecha">{{ new Date(entry.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) }}</td>
                  <td class="cell-tipo">
                    <span :class="['badge-tipo', entry.type === 'Ingreso' ? 'badge-ingreso' : 'badge-egreso']">
                      {{ entry.type === 'Ingreso' ? t('economics.types.income') : t('economics.types.expense') }}
                    </span>
                  </td>
                  <td class="cell-categoria">{{ entry.category }}</td>
                  <td class="cell-descripcion">{{ entry.description }}</td>
                  <td :class="['cell-monto', entry.type === 'Ingreso' ? 'monto-positivo' : 'monto-negativo']">
                    {{ entry.type === 'Ingreso' ? '+' : '-' }}${{ entry.amount.toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer / Pagination -->
          <div class="table-footer" v-if="!store.isLoading">
            <div class="footer-info">
              {{ t('economics.pagination.showing') }} <strong>{{ filteredEntries.length ? (currentPage - 1) * itemsPerPage + 1 : 0 }}–{{ Math.min(currentPage * itemsPerPage, filteredEntries.length) }}</strong> {{ t('economics.pagination.of') }} <strong>{{ filteredEntries.length }}</strong> {{ t('economics.pagination.records') }}
            </div>
            <div class="pagination">
              <button class="page-btn-nav" @click="prevPage" :disabled="currentPage === 1">{{ t('economics.pagination.previous') }}</button>
              
              <button 
                v-for="p in totalPages" :key="p" 
                :class="['page-btn', { 'page-btn-active': p === currentPage }]"
                @click="setPage(p)"
              >
                {{ p }}
              </button>
              
              <button class="page-btn-nav" @click="nextPage" :disabled="currentPage === totalPages">{{ t('economics.pagination.next') }}</button>
            </div>
          </div>
        </div>
      </section>

      <section class="side-column">
        <div class="summary-card">
          <h3 class="summary-title">{{ t('economics.summary.title') }}</h3>
          
          <div class="summary-metrics">
            <!-- Ingresos -->
            <div class="summary-metric">
              <div class="metric-label-row">
                <span class="metric-label">{{ t('economics.summary.income') }}</span>
                <span class="metric-percentage percentage-positive">{{ totalIncomePercent }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-income" :style="{ width: totalIncomePercent + '%' }"></div>
              </div>
            </div>
            
            <!-- Egresos -->
            <div class="summary-metric">
              <div class="metric-label-row">
                <span class="metric-label">{{ t('economics.summary.expense') }}</span>
                <span class="metric-percentage percentage-negative">{{ totalExpensePercent }}%</span>
              </div>
              <div class="progress-track">
                <div class="progress-fill fill-expense" :style="{ width: totalExpensePercent + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="summary-balance-row">
            <span class="balance-label">{{ t('economics.summary.netBalance') }}</span>
            <span class="balance-value">${{ store.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.economics-view {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.kpi-row {
  display: flex;
  flex-direction: row;
  width: 100%;
  gap: 16px;
  justify-content: space-between;
  align-items: stretch;
}
@media (max-width: 768px) {
  .kpi-row { flex-direction: column; }
}

.kpi-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: calc((100% - 32px) / 3);
  min-width: 250px;
  height: 146px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #f3f4f6;
  background: #ffffff;
  box-sizing: border-box;
  transition: box-shadow 0.2s ease;
}
.kpi-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.kpi-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-start;
}

.kpi-label {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
}

.kpi-icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}
.icon-income { background: #f0fdf4; color: #22c55e; }
.icon-expense { background: #fef2f2; color: #ef4444; }
.icon-balance { background: #eff6ff; color: #2563eb; }

.kpi-value-row {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  margin-top: 4px;
  margin-bottom: 12px;
}

.kpi-val-int {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 30px;
  line-height: 36px;
  letter-spacing: -0.2px;
  color: #111827;
}

.kpi-val-dec {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 18px;
  line-height: 28px;
  color: #111827;
}

.kpi-footer {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.kpi-badge {
  height: 22px;
  padding: 3px 8px;
  border-radius: 999px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.badge-income { background: #f0fdf4; color: #16a34a; }
.badge-expense { background: #fef2f2; color: #dc2626; }
.badge-balance { background: #eff6ff; color: #2563eb; }

.kpi-comp-label {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 12px;
  line-height: 16px;
  color: #9ca3af;
}

.dashboard-body {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 24px;
  align-items: start;
}

/* Recent Transactions Panel */
.recent-transactions-panel {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  box-shadow: 0px 1px 2px rgba(0,0,0,0.05);
  overflow: hidden;
}

.panel-header-container {
  padding: 24px 24px 0 24px;
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

/* Extended Filters */
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
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%236b7280' fill='none' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}
.category-select:focus {
  border-color: #3b82f6;
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

/* Toast */
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

.table-wrapper {
  overflow-x: auto;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table thead {
  background: #f9fafb;
}

.transactions-table th {
  height: 40px;
  border-bottom: 1px solid #f3f4f6;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 11px;
  line-height: 16px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
}

.col-fecha { padding: 12px 24px; width: 110px; }
.col-tipo { padding: 12px 16px; width: 90px; }
.col-categoria { padding: 12px 16px; width: 110px; }
.col-descripcion { padding: 12px 16px; }
.col-monto { padding: 12px 24px; width: 120px; text-align: right !important; }

.transactions-table tbody tr {
  height: 56px;
  border-bottom: 1px solid #f3f4f6;
}
.transactions-table tbody tr:last-child {
  border-bottom: none;
}

.row-even { background: #ffffff; }
.row-odd { background: rgba(249,250,251,0.4); }

.cell-fecha {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #4b5563;
  padding: 16px 24px;
}

.cell-tipo {
  padding: 16px 16px;
}

.badge-tipo {
  border-radius: 9999px;
  padding: 3.5px 10px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 12px;
  line-height: 16px;
  display: inline-block;
}

.badge-ingreso {
  background: #dcfce7;
  color: #15803d;
}

.badge-egreso {
  background: #fee2e2;
  color: #b91c1c;
}

.cell-categoria {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  line-height: 20px;
  color: #374151;
  padding: 16px 16px;
}

.cell-descripcion {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #6b7280;
  padding: 16px 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-monto {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 14px;
  line-height: 20px;
  padding: 16px 24px;
  text-align: right;
}

.monto-positivo { color: #16a34a; }
.monto-negativo { color: #ef4444; }

/* Table Footer / Pagination */
.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid #f3f4f6;
  background: #ffffff;
}

.footer-info {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 20px;
  color: #9ca3af;
}
.footer-info strong {
  font-weight: 600;
  color: #4b5563;
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
  background: #2563eb;
  color: #ffffff;
  border: 1px solid #2563eb;
  font-weight: 700;
}

/* Summary Card */
.summary-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #f3f4f6;
  border-radius: 16px;
  box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.05);
}

.summary-title {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  color: #1f2937;
  margin: 0;
  flex: 1 0 0;
}

.summary-metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-label-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.metric-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 16px;
  color: #6b7280;
}

.metric-percentage {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
}
.percentage-positive { color: #16a34a; }
.percentage-negative { color: #ef4444; }

.progress-track {
  height: 6px;
  border-radius: 9999px;
  background: #f3f4f6;
  width: 100%;
  overflow: hidden;
}

.progress-fill {
  height: 6px;
  border-radius: 9999px;
}
.fill-income { background: #22c55e; }
.fill-expense { background: #f87171; }

.summary-balance-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #f3f4f6;
  padding-top: 12px;
  margin-top: 4px;
}

.balance-label {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: #6b7280;
}

.balance-value {
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  color: #2563eb;
}
</style>
