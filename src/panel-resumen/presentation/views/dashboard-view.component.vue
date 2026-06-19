<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { usePanelResumenStore } from '../../application/panel-resumen.store'
import { useVaccineStore } from '@/gestion-clinica/application/store/vaccine.store.js'
import { useHospitalizationStore } from '@/gestion-clinica/application/store/hospitalization.store.js'
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue'
import { getExpiredVaccines } from '@/gestion-clinica/infrastructure/vaccine.utils.js'
import {
  getCriticalTasksToday,
  formatTaskTime,
  getPatientNameFromTask,
  getTaskLabelFromTask
} from '@/gestion-clinica/infrastructure/hospitalization-task.utils.js'

const { t, locale } = useI18n()
const store = usePanelResumenStore()
const vaccineStore = useVaccineStore()
const hospitalizationStore = useHospitalizationStore()
const router = useRouter()
const isPageLoading = ref(false)

const getTodayIso = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDaysIso = (isoDate, days) => {
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const formatAppointmentDateLabel = (isoDate) => {
  if (!isoDate) return '—'

  const datePart = isoDate.split('T')[0]
  const today = getTodayIso()

  if (datePart === today) return t('agenda.dayLabels.today')
  if (datePart === addDaysIso(today, 1)) return t('agenda.dayLabels.tomorrow')

  const [year, month, day] = datePart.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  })
}

onMounted(async () => {
  const needsLoader = !store.hasCachedDashboard;
  if (needsLoader) isPageLoading.value = true;
  try {
    await Promise.all([
      store.fetchDashboardData(),
      vaccineStore.fetchVaccines().catch((error) => {
        console.error('Error loading vaccine alerts:', error);
      }),
      hospitalizationStore.fetchOverview().catch((error) => {
        console.error('Error loading hospitalization tasks:', error);
      })
    ]);
  } finally {
    isPageLoading.value = false;
  }
});

onActivated(async () => {
  await Promise.all([
    store.fetchDashboardData(),
    vaccineStore.fetchVaccines(),
    hospitalizationStore.fetchOverview()
  ]);
});

const kpiStats = computed(() => {
  return store.kpis.map(kpi => ({
    ...kpi,
    title: t(`dashboard.kpi.${kpi.titleKey}`)
  }))
})

const recentAppointments = computed(() => {
  return store.citas.map(apt => ({
    ...apt,
    dateLabel: formatAppointmentDateLabel(apt.date),
    status: t(`dashboard.appointments.status.${apt.statusKey}`)
  }))
})

const expiredVaccineAlerts = computed(() => getExpiredVaccines())

const criticalTasks = computed(() =>
  getCriticalTasksToday().map((task) => ({
    ...task,
    patientName: getPatientNameFromTask(task),
    taskLabel: getTaskLabelFromTask(task),
    timeLabel: formatTaskTime(task.time)
  }))
)
</script>

<template>
  <PageViewLoading
    v-if="isPageLoading"
    variant="dashboard"
    :message="t('dashboard.loading')"
  />
  <div v-else class="dashboard-wrapper">
    <div class="dashboard-header">
      <div class="quick-actions-panel">
        <div class="quick-actions">
          <button type="button" class="action-btn secondary-btn" @click="router.push('/gestion-clinica/clientes')">
            <i class="pi pi-id-card"></i>
            <span>{{ $t('dashboard.actions.registerClient') }}</span>
          </button>
          <button type="button" class="action-btn secondary-btn" @click="router.push('/gestion-clinica/pacientes')">
            <i class="pi pi-user-plus"></i>
            <span>{{ $t('dashboard.actions.registerPatient') }}</span>
          </button>
          <button type="button" class="action-btn secondary-btn" @click="router.push('/gestion-clinica/consultas')">
            <i class="pi pi-folder-open"></i>
            <span>{{ $t('dashboard.actions.newAppointment') }}</span>
          </button>
          <button type="button" class="action-btn primary-btn" @click="router.push('/gestion-clinica/vacunas')">
            <i class="pi pi-shield"></i>
            <span>{{ $t('dashboard.actions.newConsultation') }}</span>
          </button>
        </div>
      </div>
    </div>

        <div class="kpi-grid">
      <div class="stat-card" v-for="stat in kpiStats" :key="stat.id">
        <div class="stat-header">
          <div :class="['icon-badge', `bg-${stat.colorClass}`]">
            <i :class="['pi', stat.icon, `text-${stat.colorClass}`]"></i>
          </div>
          <div :class="['percentage-indicator', stat.isPositive ? 'text-success bg-success' : 'text-danger bg-danger']">
            <i :class="['pi', stat.isPositive ? 'pi-arrow-up' : 'pi-arrow-down', 'trend-icon']"></i>
            {{ stat.trend }}
          </div>
        </div>
        <div class="stat-body">
          <p class="text-subtitle">{{ stat.title }}</p>
          <h2 class="text-title">{{ stat.value }}</h2>
        </div>
      </div>
    </div>

        <div class="dashboard-body">
      
            <section class="main-column">
                <div class="card">
          <div class="card-header">
            <h3 class="text-cardTitle">{{ $t('dashboard.appointments.title') }}</h3>
            <button class="link-btn" @click="router.push('/agenda')">{{ $t('dashboard.appointments.viewAgenda') }}</button>
          </div>
          <div v-if="recentAppointments.length === 0" class="empty-appointments">
            <i class="pi pi-calendar"></i>
            <p>{{ $t('dashboard.appointments.emptyWeek') }}</p>
          </div>
          <div v-else class="data-list">
            <div class="data-row" v-for="apt in recentAppointments" :key="apt.id">
              <div class="row-info">
                <img :src="apt.img" alt="" class="avatar" />
                <div class="row-details">
                  <p class="text-cardTitle">{{ apt.petName }}</p>
                  <p class="text-caption row-reason">
                    <i class="pi pi-tag"></i>
                    {{ $t('dashboard.appointments.reason') }}: {{ apt.type }}
                  </p>
                </div>
              </div>
              <div class="row-meta">
                <div class="appointment-schedule">
                  <p class="text-subtitle">
                    <i class="pi pi-calendar schedule-icon"></i>{{ apt.dateLabel }}
                  </p>
                  <p class="text-subtitle">
                    <i class="pi pi-clock schedule-icon"></i>{{ apt.time }}
                  </p>
                </div>
                <span :class="['status-tag', `bg-${apt.statusClass}`, `text-${apt.statusClass}`]">{{ apt.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

            <section class="side-column">
        
                <div class="card mb-4 alerts-card">
          <div class="card-header alerts-card-header">
            <div class="alerts-title-wrap">
              <h3 class="text-cardTitle alerts-title">{{ $t('dashboard.alerts.title') }}</h3>
              <span v-if="expiredVaccineAlerts.length" class="alerts-count-badge">
                {{ expiredVaccineAlerts.length }}
              </span>
            </div>
            <button
              v-if="expiredVaccineAlerts.length"
              type="button"
              class="link-btn"
              @click="router.push('/gestion-clinica/vacunas')"
            >
              {{ $t('dashboard.alerts.viewAll') }}
            </button>
          </div>

          <div v-if="expiredVaccineAlerts.length === 0" class="alerts-empty">
            <i class="pi pi-check-circle"></i>
            <p>{{ $t('dashboard.alerts.emptyVaccines') }}</p>
          </div>

          <div v-else class="vaccine-alerts-list">
            <div
              v-for="alert in expiredVaccineAlerts"
              :key="alert.id"
              class="vaccine-alert-card"
              @click="router.push('/gestion-clinica/vacunas')"
            >
              <div class="vaccine-alert-icon">
                <i class="pi pi-shield"></i>
              </div>
              <div class="vaccine-alert-body">
                <div class="vaccine-alert-top">
                  <strong class="vaccine-alert-patient">{{ alert.patientName }}</strong>
                  <span class="vaccine-alert-status">{{ $t('clinicManagement.vaccines.status.Vencida') }}</span>
                </div>
                <p class="vaccine-alert-vaccine">{{ alert.vaccineName }}</p>
                <p class="vaccine-alert-meta">
                  <i class="pi pi-calendar"></i>
                  <span>{{ $t('dashboard.alerts.dueDate') }}: {{ alert.nextDose }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

                <div class="card activity-card">
          <div class="card-header activity-card-header">
            <div class="activity-title-wrap">
              <h3 class="text-cardTitle activity-title">{{ $t('dashboard.activity.title') }}</h3>
              <span v-if="criticalTasks.length" class="activity-count-badge">
                {{ criticalTasks.length }}
              </span>
            </div>
            <button
              v-if="criticalTasks.length"
              type="button"
              class="link-btn"
              @click="router.push('/gestion-clinica/hospitalizacion')"
            >
              {{ $t('dashboard.activity.viewAll') }}
            </button>
          </div>

          <div v-if="criticalTasks.length === 0" class="activity-empty">
            <i class="pi pi-check-circle"></i>
            <p>{{ $t('dashboard.activity.emptyCritical') }}</p>
          </div>

          <div v-else class="critical-tasks-list">
            <div
              v-for="task in criticalTasks"
              :key="task.id"
              class="critical-task-card"
              @click="router.push('/gestion-clinica/hospitalizacion')"
            >
              <div class="critical-task-icon">
                <i class="pi pi-clipboard"></i>
              </div>
              <div class="critical-task-body">
                <div class="critical-task-top">
                  <strong class="critical-task-patient">{{ task.patientName }}</strong>
                  <span class="critical-task-status">
                    {{ $t('clinicManagement.hospitalization.pendingTasks.status.critico') }}
                  </span>
                </div>
                <p class="critical-task-label">{{ task.taskLabel }}</p>
                <p class="critical-task-description">{{ task.description }}</p>
                <p class="critical-task-meta">
                  <i class="pi pi-clock"></i>
                  <span>{{ $t('dashboard.activity.scheduledTime') }}: {{ task.timeLabel }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
      </section>
    </div>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: -24px;
  width: calc(100% + 48px);
  min-height: calc(100vh - 128px);
  padding: 24px;
  background:
    radial-gradient(
      color-mix(in srgb, var(--color-primary-main) 5%, transparent) 1px,
      transparent 1px
    ) 0 0 / 24px 24px,
    var(--color-background-main);
}

.dashboard-header {
  display: flex;
  justify-content: stretch;
}

.quick-actions-panel {
  width: 100%;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: var(--shadow-card);
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  font-family: inherit;
}

.action-btn i {
  font-size: 15px;
}

.secondary-btn {
  background-color: var(--color-background-sidebar);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.secondary-btn:hover {
  background-color: var(--color-primary-subtle);
  border-color: color-mix(in srgb, var(--color-primary-main) 20%, var(--color-border-light));
}

.primary-btn {
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border: 1px solid var(--color-primary-main);
  box-shadow: 0 2px 10px color-mix(in srgb, var(--color-primary-main) 24%, transparent);
}

.primary-btn:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.action-btn:focus-visible {
  outline: 2px solid var(--color-primary-main);
  outline-offset: 2px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat-card {
  background-color: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  padding: 20px 22px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;
}

.stat-card:hover {
  box-shadow: 0 8px 20px color-mix(in srgb, var(--color-text-primary) 6%, transparent);
  border-color: color-mix(in srgb, var(--color-primary-main) 14%, var(--color-border-light));
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.icon-badge {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.percentage-indicator {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--font-body-caption-size);
  font-weight: 600;
}

.trend-icon {
  font-size: 10px;
}

.stat-body .text-subtitle {
  margin: 0 0 4px;
}

.stat-body .text-title {
  margin: 0;
  color: var(--color-text-primary);
}

.bg-border-light {
  background-color: var(--color-background-sidebar);
  border: 1px solid var(--color-border-light);
}

.bg-success { background-color: var(--color-status-success-bg); }
.text-success { color: var(--color-status-success-text); }
.bg-warning { background-color: var(--color-status-warning-bg); }
.text-warning { color: var(--color-status-warning-text); }
.bg-info { background-color: var(--color-status-info-bg); }
.text-info { color: var(--color-status-info-text); }
.bg-danger { background-color: var(--color-status-danger-bg); }
.text-danger { color: var(--color-status-danger-text); }

.dashboard-body {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(280px, 1fr);
  gap: 24px;
  align-items: start;
}

.mb-4 { margin-bottom: 24px; }

.card {
  background-color: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 16px;
  box-shadow: var(--shadow-card);
  padding: 22px 24px;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--color-border-light);
}

.card-header .text-cardTitle {
  margin: 0;
}

.link-btn {
  color: var(--color-primary-main);
  font-weight: 600;
  font-size: 13px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background-color 0.2s ease, color 0.2s ease;
  font-family: inherit;
  flex-shrink: 0;
}

.link-btn:hover {
  background: var(--color-primary-subtle);
  text-decoration: none;
}

.empty-appointments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 16px;
  color: var(--color-text-secondary);
  text-align: center;
  border: 1px dashed var(--color-border-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-background-sidebar) 50%, transparent);
}

.empty-appointments i {
  font-size: 1.75rem;
  color: var(--color-text-muted);
}

.empty-appointments p {
  margin: 0;
  font-size: 14px;
  max-width: 28ch;
  line-height: 1.5;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-background-sidebar) 35%, var(--color-background-surface));
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.data-row:hover {
  background-color: var(--color-background-surface);
  border-color: color-mix(in srgb, var(--color-primary-main) 18%, var(--color-border-light));
  box-shadow: 0 4px 14px color-mix(in srgb, var(--color-primary-main) 8%, transparent);
}

.row-info {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
}

.row-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.row-reason {
  display: flex;
  align-items: center;
  gap: 6px;
}

.row-reason i {
  font-size: 10px;
  color: var(--color-primary-main);
  flex-shrink: 0;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--color-background-surface);
  box-shadow: 0 0 0 1px var(--color-border-light);
  flex-shrink: 0;
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.appointment-schedule {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.appointment-schedule .text-subtitle {
  display: flex;
  align-items: center;
  margin: 0;
}

.schedule-icon {
  font-size: 12px;
  margin-right: 6px;
  color: var(--color-primary-main);
  opacity: 0.85;
}

.status-tag {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  min-width: 90px;
  text-align: center;
  border: 1px solid transparent;
}

.alerts-card-header,
.activity-card-header {
  align-items: center;
}

.alerts-title-wrap,
.activity-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.alerts-title {
  color: var(--color-status-danger-text);
  margin: 0;
}

.activity-title {
  color: var(--color-status-warning-text);
  margin: 0;
}

.alerts-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-text);
  font-size: 12px;
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 18%, transparent);
}

.activity-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-text);
  font-size: 12px;
  font-weight: 700;
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 18%, transparent);
}

.alerts-empty,
.activity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 16px;
  text-align: center;
  color: var(--color-text-secondary);
  border: 1px dashed var(--color-border-light);
  border-radius: 12px;
  background: color-mix(in srgb, var(--color-background-sidebar) 45%, transparent);
}

.alerts-empty i,
.activity-empty i {
  font-size: 1.5rem;
  color: var(--color-status-success-indicator);
}

.alerts-empty p,
.activity-empty p {
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
}

.vaccine-alerts-list,
.critical-tasks-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 2px;
}

.vaccine-alert-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-status-danger-indicator) 22%, var(--color-border-light));
  border-left: 3px solid var(--color-status-danger-indicator);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.vaccine-alert-card:hover {
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 35%, var(--color-border-light));
  box-shadow: 0 4px 14px color-mix(in srgb, var(--color-status-danger-indicator) 10%, transparent);
}

.vaccine-alert-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-indicator);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.vaccine-alert-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.vaccine-alert-top,
.critical-task-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.vaccine-alert-patient,
.critical-task-patient {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vaccine-alert-status {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-text);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.vaccine-alert-vaccine {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vaccine-alert-meta,
.critical-task-meta {
  margin: 2px 0 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.vaccine-alert-meta i,
.critical-task-meta i {
  font-size: 11px;
  color: var(--color-text-muted);
}

.critical-task-card {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-status-warning-indicator) 22%, var(--color-border-light));
  border-left: 3px solid var(--color-status-warning-indicator);
  border-radius: 12px;
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.critical-task-card:hover {
  border-color: color-mix(in srgb, var(--color-status-warning-indicator) 35%, var(--color-border-light));
  box-shadow: 0 4px 14px color-mix(in srgb, var(--color-status-warning-indicator) 10%, transparent);
}

.critical-task-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-status-warning-bg);
  color: var(--color-status-warning-indicator);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.critical-task-body {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.critical-task-status {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--color-status-danger-bg);
  color: var(--color-status-danger-text);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.critical-task-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.critical-task-description {
  margin: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (prefers-reduced-motion: reduce) {
  .primary-btn:hover { transform: none; }
}

@media (max-width: 1100px) {
  .dashboard-body {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-wrapper {
    margin: 0;
    width: 100%;
    min-height: 0;
    padding: 0;
    background: var(--color-background-main);
  }

  .kpi-grid {
    grid-template-columns: 1fr;
  }

  .data-row {
    flex-direction: column;
    align-items: stretch;
  }

  .row-meta {
    justify-content: space-between;
    width: 100%;
  }

  .appointment-schedule {
    align-items: flex-start;
  }

  .quick-actions .action-btn {
    flex: 1 1 calc(50% - 5px);
    justify-content: center;
  }
}
</style>
