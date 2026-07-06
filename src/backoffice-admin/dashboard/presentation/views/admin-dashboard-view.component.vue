<template>
  <div class="bi-dashboard">
    <AdminLoadingState v-if="dashboardStore.loading" :message="t('adminDashboard.loading')" />

    <AdminErrorState
      v-else-if="dashboardStore.error"
      :message="dashboardStore.error"
      :retry-label="t('adminDashboard.retry')"
      @retry="reload"
    />

    <template v-else>
      <header class="bi-header">
        <div>
          <p class="bi-eyebrow">{{ t('layout.adminPanelEyebrow', { date: adminDateLabel }) }}</p>
          <h1 class="bi-title">{{ t('layout.adminPageTitle.dashboard') }}</h1>
        </div>
        <CurrencySwitcher />
      </header>

      <section class="bi-hero" :aria-label="t('adminDashboard.hero.ariaLabel')">
        <div class="bi-hero-main">
          <span class="bi-hero-label">{{ t('adminDashboard.hero.monthRevenue') }}</span>
          <p class="bi-hero-value">{{ formatCurrency(dashboardStore.summary?.monthRevenue || 0) }}</p>
          <p class="bi-hero-sub">
            {{ t('adminDashboard.hero.today') }}: <strong>{{ formatCurrency(dashboardStore.summary?.todayRevenue || 0) }}</strong>
          </p>
        </div>
        <div class="bi-vital" aria-hidden="true">
          <div class="bi-vital-track">
            <div class="bi-vital-pulse"></div>
          </div>
          <span class="bi-vital-caption">{{ t('adminDashboard.hero.cashFlowActive') }}</span>
        </div>
      </section>

      <section class="bi-metrics" :aria-label="t('adminDashboard.metrics.ariaLabel')">
        <article class="bi-metric">
          <span class="bi-metric-label">{{ t('adminDashboard.metrics.appointmentsToday') }}</span>
          <span class="bi-metric-value">{{ dashboardStore.summary?.todayAppointments || 0 }}</span>
          <span class="bi-metric-hint">{{ t('adminDashboard.metrics.appointmentsHint') }}</span>
        </article>
        <article class="bi-metric" :class="{ 'bi-metric--alert': (dashboardStore.summary?.expiringLotsCount || 0) > 0 }">
          <span class="bi-metric-label">{{ t('adminDashboard.metrics.expiringLots') }}</span>
          <span class="bi-metric-value">{{ dashboardStore.summary?.expiringLotsCount || 0 }}</span>
          <span class="bi-metric-hint">{{ t('adminDashboard.metrics.expiringLotsHint') }}</span>
        </article>
        <article class="bi-metric">
          <span class="bi-metric-label">{{ t('adminDashboard.metrics.topProducts') }}</span>
          <span class="bi-metric-value">{{ dashboardStore.topProducts.length }}</span>
          <span class="bi-metric-hint">{{ t('adminDashboard.metrics.topProductsHint') }}</span>
        </article>
      </section>

      <section class="bi-charts">
        <article class="bi-panel bi-panel--wide">
          <header class="bi-panel-head">
            <h2>{{ t('adminDashboard.charts.revenue') }}</h2>
            <span>{{ t('adminDashboard.charts.revenuePeriod') }}</span>
          </header>
          <div class="bi-chart-wrap">
            <Chart
              v-if="chartsVisible"
              type="line"
              :data="revenueChartData"
              :options="revenueChartOptions"
            />
          </div>
        </article>

        <article class="bi-panel">
          <header class="bi-panel-head">
            <h2>{{ t('adminDashboard.charts.products') }}</h2>
            <span>{{ t('adminDashboard.charts.productsTop') }}</span>
          </header>
          <div class="bi-chart-wrap bi-chart-wrap--short">
            <Chart
              v-if="chartsVisible && dashboardStore.topProducts.length"
              type="bar"
              :data="topProductsChartData"
              :options="topProductsChartOptions"
            />
            <p v-else class="bi-empty-chart">{{ t('adminDashboard.charts.noMovements') }}</p>
          </div>
        </article>
      </section>

      <section class="bi-panel bi-panel--table">
        <header class="bi-panel-head">
          <h2>{{ t('adminDashboard.riskInventory.title') }}</h2>
          <span>{{ t('adminDashboard.riskInventory.subtitle') }}</span>
        </header>

        <DataTable
          v-if="dashboardStore.expiringLots.length"
          :value="dashboardStore.expiringLots"
          responsiveLayout="scroll"
          :paginator="dashboardStore.expiringLots.length > 5"
          :rows="5"
          class="bi-table"
        >
          <Column field="productName" :header="t('adminDashboard.riskInventory.columns.product')" sortable />
          <Column field="lotNumber" :header="t('adminDashboard.riskInventory.columns.lot')" />
          <Column field="currentQuantity" :header="t('adminDashboard.riskInventory.columns.stock')" />
          <Column field="expiryDate" :header="t('adminDashboard.riskInventory.columns.expiry')" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.expiryDate) }}
            </template>
          </Column>
          <Column :header="t('adminDashboard.riskInventory.columns.status')">
            <template #body="slotProps">
              <span :class="['bi-tag', `bi-tag--${getExpiryTone(slotProps.data.expiryDate)}`]">
                {{ getExpiryLabel(slotProps.data.expiryDate) }}
              </span>
            </template>
          </Column>
        </DataTable>

        <div v-else class="bi-empty-table">
          <i class="pi pi-check-circle"></i>
          <p>{{ t('adminDashboard.riskInventory.empty') }}</p>
        </div>
      </section>

      <!-- Cierre de Caja -->
      <section class="bi-panel bi-report-panel">
        <header class="bi-panel-head">
          <h2>Cierre de Caja</h2>
          <span>Recaudación por método de pago</span>
        </header>
        <div class="bi-report-controls">
          <div class="bi-report-field">
            <label>Fecha</label>
            <input type="date" v-model="cashClosingDate" class="bi-report-input" />
          </div>
          <button class="bi-report-btn" :disabled="dashboardStore.reportsLoading" @click="runCashClosing">
            <i :class="dashboardStore.reportsLoading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"></i>
            Consultar
          </button>
        </div>
        <div v-if="dashboardStore.cashClosing" class="bi-report-result">
          <div class="bi-report-kpi-row">
            <div class="bi-report-kpi">
              <span class="bi-report-kpi-label">Total recaudado</span>
              <span class="bi-report-kpi-value">{{ formatCurrency(dashboardStore.cashClosing.grandTotal) }}</span>
            </div>
            <div class="bi-report-kpi">
              <span class="bi-report-kpi-label">Métodos usados</span>
              <span class="bi-report-kpi-value">{{ dashboardStore.cashClosing.breakdown.length }}</span>
            </div>
          </div>
          <table class="bi-report-table" v-if="dashboardStore.cashClosing.breakdown.length">
            <thead><tr><th>Método</th><th>Tickets</th><th>Total</th></tr></thead>
            <tbody>
              <tr v-for="item in dashboardStore.cashClosing.breakdown" :key="item.paymentMethod">
                <td>{{ item.paymentMethod }}</td>
                <td>{{ item.count }}</td>
                <td class="bi-report-amount">{{ formatCurrency(item.total) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="bi-report-empty">Sin tickets pagados en esa fecha.</p>
        </div>
      </section>

      <!-- Reporte de Ventas -->
      <section class="bi-panel bi-report-panel">
        <header class="bi-panel-head">
          <h2>Reporte de Ventas</h2>
          <span>Ingresos y egresos por rango de fechas</span>
        </header>
        <div class="bi-report-controls">
          <div class="bi-report-field">
            <label>Desde</label>
            <input type="date" v-model="salesFrom" class="bi-report-input" />
          </div>
          <div class="bi-report-field">
            <label>Hasta</label>
            <input type="date" v-model="salesTo" class="bi-report-input" />
          </div>
          <button class="bi-report-btn" :disabled="dashboardStore.reportsLoading" @click="runSalesReport">
            <i :class="dashboardStore.reportsLoading ? 'pi pi-spin pi-spinner' : 'pi pi-search'"></i>
            Generar
          </button>
        </div>
        <div v-if="dashboardStore.salesReport" class="bi-report-result">
          <div class="bi-report-kpi-row">
            <div class="bi-report-kpi bi-report-kpi--income">
              <span class="bi-report-kpi-label">Ingresos</span>
              <span class="bi-report-kpi-value">{{ formatCurrency(dashboardStore.salesReport.totalRevenue) }}</span>
            </div>
            <div class="bi-report-kpi bi-report-kpi--expense">
              <span class="bi-report-kpi-label">Egresos</span>
              <span class="bi-report-kpi-value">{{ formatCurrency(dashboardStore.salesReport.totalExpenses) }}</span>
            </div>
            <div class="bi-report-kpi">
              <span class="bi-report-kpi-label">Utilidad neta</span>
              <span class="bi-report-kpi-value" :class="dashboardStore.salesReport.netProfit >= 0 ? 'bi-text-income' : 'bi-text-expense'">
                {{ formatCurrency(dashboardStore.salesReport.netProfit) }}
              </span>
            </div>
          </div>
          <table class="bi-report-table" v-if="dashboardStore.salesReport.rows.length">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Total</th></tr></thead>
            <tbody>
              <tr v-for="(row, i) in dashboardStore.salesReport.rows" :key="i">
                <td>{{ row.date }}</td>
                <td><span :class="['bi-tag', row.type === 'Ingreso' ? 'bi-tag--ok' : 'bi-tag--danger']">{{ row.type }}</span></td>
                <td class="bi-report-amount">{{ formatCurrency(row.total) }}</td>
              </tr>
            </tbody>
          </table>
          <p v-else class="bi-report-empty">Sin movimientos en ese período.</p>
        </div>
      </section>

      <!-- Comisiones de Doctor -->
      <section class="bi-panel bi-report-panel">
        <header class="bi-panel-head">
          <h2>Comisiones por Doctor</h2>
          <span>Calcular comisión sobre servicios atendidos</span>
        </header>
        <div class="bi-report-controls">
          <div class="bi-report-field bi-report-field--wide">
            <label>Doctor</label>
            <select v-model="commissionDoctor" class="bi-report-input">
              <option v-if="doctorNames.length === 0" value="" disabled>Sin consultas registradas</option>
              <option v-for="name in doctorNames" :key="name" :value="name">{{ name }}</option>
            </select>
          </div>
          <div class="bi-report-field">
            <label>Comisión (%)</label>
            <input type="number" v-model.number="commissionRate" min="0" max="100" step="1" class="bi-report-input" style="width:80px" />
          </div>
          <button class="bi-report-btn" :disabled="dashboardStore.reportsLoading || !commissionDoctor" @click="runCommissions">
            <i :class="dashboardStore.reportsLoading ? 'pi pi-spin pi-spinner' : 'pi pi-calculator'"></i>
            Calcular
          </button>
        </div>
        <div v-if="dashboardStore.commissions" class="bi-report-result">
          <div class="bi-report-kpi-row">
            <div class="bi-report-kpi">
              <span class="bi-report-kpi-label">Doctor</span>
              <span class="bi-report-kpi-value" style="font-size:1rem">{{ dashboardStore.commissions.doctorName }}</span>
            </div>
            <div class="bi-report-kpi bi-report-kpi--income">
              <span class="bi-report-kpi-label">Total servicios</span>
              <span class="bi-report-kpi-value">{{ formatCurrency(dashboardStore.commissions.servicesTotal) }}</span>
            </div>
            <div class="bi-report-kpi">
              <span class="bi-report-kpi-label">Tasa</span>
              <span class="bi-report-kpi-value">{{ dashboardStore.commissions.commissionRate }}%</span>
            </div>
            <div class="bi-report-kpi bi-report-kpi--income">
              <span class="bi-report-kpi-label">Comisión a pagar</span>
              <span class="bi-report-kpi-value bi-text-income">{{ formatCurrency(dashboardStore.commissions.commissionAmount) }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, computed, ref, nextTick } from 'vue';
import { BaseApi } from '@/shared/infrastructure/base-api.js';

import { useAdminDashboardStore } from '../../application/admin-dashboard.store.js';
import { useAdminDateLabel } from '@/shared/presentation/composables/use-admin-date-label.js';
import { useCurrencyFormat } from '@/shared/presentation/composables/use-currency-format.js';
import CurrencySwitcher from '@/shared/presentation/components/currency-switcher.component.vue';
import AdminLoadingState from '@/shared/presentation/components/admin-loading-state.component.vue';
import AdminErrorState from '@/shared/presentation/components/admin-error-state.component.vue';
import Chart from 'primevue/chart';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useI18n } from 'vue-i18n';
import 'chart.js/auto';

const { t, locale } = useI18n();
const dashboardStore = useAdminDashboardStore();
const { adminDateLabel } = useAdminDateLabel();
const { formatCurrency, axisPrefix } = useCurrencyFormat();
const chartsVisible = ref(false);

const dateLocale = computed(() => (locale.value === 'en' ? 'en-US' : 'es-PE'));

const PALETTE = {
  ink: '#0F172A',
  teal: '#0F766E',
  tealLight: '#14B8A6',
  tealFill: 'rgba(15, 118, 110, 0.14)',
  slate: '#64748B',
  border: '#E2E8F0',
  barShades: ['#0F766E', '#148F85', '#14B8A6', '#2DD4BF', '#5EEAD4']
};

onMounted(async () => {
  await dashboardStore.fetchAll();
  if (!dashboardStore.error) {
    await nextTick();
    chartsVisible.value = true;
  }
  try {
    const res = await BaseApi.get('/consultations');
    const names = (res.data ?? [])
      .map((c) => c.doctorName ?? c.DoctorName ?? '')
      .filter(Boolean);
    doctorNames.value = [...new Set(names)].sort();
    if (doctorNames.value.length > 0) commissionDoctor.value = doctorNames.value[0];
  } catch {
    doctorNames.value = [];
  }
});

onBeforeUnmount(() => {
  chartsVisible.value = false;
});

const reload = () => {
  chartsVisible.value = false;
  dashboardStore.fetchAll().then(async () => {
    if (!dashboardStore.error) {
      await nextTick();
      chartsVisible.value = true;
    }
  });
};

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString(dateLocale.value, { day: '2-digit', month: 'short', year: 'numeric' });

const getDaysUntil = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  const diffDays = Math.ceil(Math.abs(targetDate - today) / (1000 * 60 * 60 * 24));
  return targetDate >= today ? diffDays : -diffDays;
};

const getExpiryTone = (dateString) => {
  const days = getDaysUntil(dateString);
  if (days < 0) return 'danger';
  if (days <= 7) return 'danger';
  if (days <= 15) return 'warn';
  return 'ok';
};

const getExpiryLabel = (dateString) => {
  const days = getDaysUntil(dateString);
  if (days < 0) return t('adminDashboard.riskInventory.expiryStatus.expired');
  if (days <= 7) return t('adminDashboard.riskInventory.expiryStatus.under7Days');
  if (days <= 15) return t('adminDashboard.riskInventory.expiryStatus.oneTwoWeeks');
  return t('adminDashboard.riskInventory.expiryStatus.twoFourWeeks');
};

const revenueChartData = computed(() => ({
  labels: dashboardStore.revenueChart.map((r) => r.date),
  datasets: [
    {
      label: t('adminDashboard.charts.datasetRevenue'),
      data: dashboardStore.revenueChart.map((r) => r.amount),
      fill: true,
      borderColor: PALETTE.teal,
      backgroundColor: PALETTE.tealFill,
      pointBackgroundColor: PALETTE.teal,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.35,
      borderWidth: 2
    }
  ]
}));

const revenueChartOptions = computed(() => ({
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${formatCurrency(ctx.raw)}`
      }
    }
  },
  scales: {
    x: {
      ticks: { color: PALETTE.slate, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
      grid: { display: false }
    },
    y: {
      ticks: {
        color: PALETTE.slate,
        callback: (v) => `${axisPrefix.value}${v}`
      },
      grid: { color: PALETTE.border }
    }
  },
  maintainAspectRatio: false
}));

const topProductsChartData = computed(() => ({
  labels: dashboardStore.topProducts.map((p) => p.name),
  datasets: [
    {
      label: t('adminDashboard.charts.datasetQuantity'),
      data: dashboardStore.topProducts.map((p) => p.totalConsumed),
      backgroundColor: PALETTE.barShades,
      borderRadius: 4,
      borderWidth: 0
    }
  ]
}));

const topProductsChartOptions = computed(() => ({
  indexAxis: 'y',
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: PALETTE.slate },
      grid: { color: PALETTE.border }
    },
    y: {
      ticks: { color: PALETTE.ink, font: { weight: '500' } },
      grid: { display: false }
    }
  },
  maintainAspectRatio: false
}));

// Cash Closing
const today = new Date().toISOString().split('T')[0];
const cashClosingDate = ref(today);
const runCashClosing = () => {
  dashboardStore.fetchCashClosing(cashClosingDate.value);
};

// Sales Report
const salesFrom = ref(today);
const salesTo = ref(today);
const runSalesReport = () => {
  dashboardStore.fetchSalesReport(salesFrom.value, salesTo.value);
};

// Commissions
const commissionDoctor = ref('');
const commissionRate = ref(10);
const doctorNames = ref([]);
const runCommissions = () => {
  if (!commissionDoctor.value.trim()) return;
  dashboardStore.fetchCommissions(commissionDoctor.value.trim(), commissionRate.value);
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');

.bi-dashboard {
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
  animation: bi-fade-in 0.45s ease-out;
}

@keyframes bi-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (prefers-reduced-motion: reduce) {
  .bi-dashboard { animation: none; }
  .bi-vital-pulse { animation: none; width: 72%; }
}

.bi-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.bi-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bi-teal);
  margin-bottom: 6px;
}

.bi-title {
  font-family: var(--bi-font-display);
  font-size: clamp(1.5rem, 2.5vw, 1.875rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.bi-hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 24px;
  align-items: center;
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: var(--bi-radius);
  padding: 28px 32px;
  margin-bottom: 20px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.bi-hero-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--bi-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bi-hero-value {
  font-family: var(--bi-font-display);
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--bi-teal);
  margin: 4px 0 8px;
  line-height: 1.1;
}

.bi-hero-sub {
  font-size: 14px;
  color: var(--bi-muted);
}

.bi-hero-sub strong {
  color: var(--bi-ink);
  font-weight: 600;
}

.bi-vital {
  min-width: 140px;
  text-align: right;
}

.bi-vital-track {
  height: 4px;
  background: var(--bi-border);
  border-radius: 999px;
  overflow: hidden;
  margin-bottom: 8px;
}

.bi-vital-pulse {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, var(--bi-teal), var(--bi-teal-light, #14b8a6));
  border-radius: 999px;
  animation: bi-pulse-grow 1.2s ease-out 0.3s forwards;
}

@keyframes bi-pulse-grow {
  to { width: 72%; }
}

.bi-vital-caption {
  font-size: 11px;
  color: var(--bi-muted);
  letter-spacing: 0.02em;
}

.bi-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.bi-metric {
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: var(--bi-radius);
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color 0.2s ease;
}

.bi-metric:hover {
  border-color: #cbd5e1;
}

.bi-metric--alert {
  border-color: #fcd34d;
  background: var(--bi-amber-soft);
}

.bi-metric-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--bi-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.bi-metric-value {
  font-family: var(--bi-font-display);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
}

.bi-metric-hint {
  font-size: 12px;
  color: var(--bi-muted);
}

.bi-charts {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.bi-panel {
  background: var(--bi-paper);
  border: 1px solid var(--bi-border);
  border-radius: var(--bi-radius);
  padding: 22px 24px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.bi-panel-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--bi-border);
}

.bi-panel-head h2 {
  font-size: 15px;
  font-weight: 700;
}

.bi-panel-head span {
  font-size: 12px;
  color: var(--bi-muted);
}

.bi-chart-wrap {
  height: 260px;
  position: relative;
}

.bi-chart-wrap--short {
  height: 260px;
}

.bi-empty-chart {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--bi-muted);
  text-align: center;
  padding: 0 16px;
}

.bi-panel--table {
  padding-bottom: 8px;
}

.bi-table :deep(.p-datatable-thead > tr > th) {
  background: var(--bi-bg);
  color: var(--bi-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-color: var(--bi-border);
}

.bi-table :deep(.p-datatable-tbody > tr > td) {
  font-size: 14px;
  border-color: var(--bi-border);
}

.bi-table :deep(.p-datatable-tbody > tr:hover) {
  background: #f8fafc;
}

.bi-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 999px;
}

.bi-tag--ok {
  background: var(--bi-teal-soft);
  color: var(--bi-teal);
}

.bi-tag--warn {
  background: var(--bi-amber-soft);
  color: var(--bi-amber);
}

.bi-tag--danger {
  background: #fef2f2;
  color: #b91c1c;
}

.bi-empty-table {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 16px;
  color: var(--bi-teal);
}

.bi-empty-table i {
  font-size: 1.75rem;
}

.bi-empty-table p {
  font-size: 14px;
  color: var(--bi-muted);
}

@media (max-width: 900px) {
  .bi-hero {
    grid-template-columns: 1fr;
  }

  .bi-vital {
    text-align: left;
  }

  .bi-charts {
    grid-template-columns: 1fr;
  }

  .bi-metrics {
    grid-template-columns: 1fr;
  }
}

.bi-report-panel {
  margin-top: 16px;
}

.bi-report-controls {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.bi-report-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bi-report-field--wide {
  flex: 1;
  min-width: 200px;
}

.bi-report-field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--bi-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.bi-report-input {
  height: 38px;
  padding: 0 12px;
  border: 1px solid var(--bi-border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--bi-ink);
  background: var(--bi-bg);
  outline: none;
  transition: border-color 0.2s;
}

.bi-report-input:focus {
  border-color: var(--bi-teal);
}

.bi-report-btn {
  height: 38px;
  padding: 0 18px;
  background: var(--bi-teal);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.2s;
}

.bi-report-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.bi-report-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bi-report-result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bi-report-kpi-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.bi-report-kpi {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--bi-bg);
  border: 1px solid var(--bi-border);
  border-radius: 10px;
  padding: 14px 18px;
  min-width: 140px;
}

.bi-report-kpi--income {
  background: var(--bi-teal-soft);
  border-color: color-mix(in srgb, var(--bi-teal) 20%, transparent);
}

.bi-report-kpi--expense {
  background: #fef2f2;
  border-color: color-mix(in srgb, #b91c1c 20%, transparent);
}

.bi-report-kpi-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--bi-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.bi-report-kpi-value {
  font-family: var(--bi-font-display);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--bi-ink);
}

.bi-text-income {
  color: var(--bi-teal);
}

.bi-text-expense {
  color: #b91c1c;
}

.bi-report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.bi-report-table th {
  background: var(--bi-bg);
  color: var(--bi-muted);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid var(--bi-border);
}

.bi-report-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--bi-border);
  color: var(--bi-ink);
}

.bi-report-table tr:last-child td {
  border-bottom: none;
}

.bi-report-amount {
  font-weight: 700;
  text-align: right;
}

.bi-report-empty {
  font-size: 13px;
  color: var(--bi-muted);
  text-align: center;
  padding: 16px;
}
</style>
