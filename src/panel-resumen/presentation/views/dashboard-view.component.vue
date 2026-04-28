<script setup>
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePanelResumenStore } from '../../application/panel-resumen.store'

const { t } = useI18n()
const store = usePanelResumenStore()

onMounted(() => {
  store.fetchDashboardData()
})

// KPIs — map titleKey from db to translations
const kpiStats = computed(() => {
  return store.kpis.map(kpi => ({
    ...kpi,
    title: t(`dashboard.kpi.${kpi.titleKey}`)
  }))
})

// Citas — map keys to translations
const recentAppointments = computed(() => {
  return store.citas.map(apt => ({
    ...apt,
    reason: t(`dashboard.appointments.status.${apt.reasonKey}`),
    status: t(`dashboard.appointments.status.${apt.statusKey}`)
  }))
})

// Alertas
const alerts = computed(() => {
  return store.alertas.map(alert => ({
    ...alert,
    text: t(`dashboard.alerts.items.${alert.textKey}`)
  }))
})

// Actividad reciente
const activityTimeline = computed(() => {
  return store.actividad.map(activity => ({
    ...activity,
    text: t(`dashboard.activity.items.${activity.textKey}`),
    subtitle: `${t('dashboard.activity.patient')}: ${activity.patient}`
  }))
})
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- Header & Quick Actions -->
    <div class="dashboard-header">
      <div class="quick-actions">
        <button class="action-btn secondary-btn"><i class="pi pi-user-plus"></i> {{ $t('dashboard.actions.registerPatient') }}</button>
        <button class="action-btn secondary-btn"><i class="pi pi-calendar-plus"></i> {{ $t('dashboard.actions.newAppointment') }}</button>
        <button class="action-btn primary-btn"><i class="pi pi-heart-fill" style="margin-right: 8px"></i> {{ $t('dashboard.actions.newConsultation') }}</button>
      </div>
    </div>

    <!-- KPI Stats Grid -->
    <div class="kpi-grid">
      <div class="stat-card" v-for="stat in kpiStats" :key="stat.id">
        <div class="stat-header">
          <div :class="['icon-badge', `bg-${stat.colorClass}`]">
            <i :class="['pi', stat.icon, `text-${stat.colorClass}`]"></i>
          </div>
          <div :class="['percentage-indicator', stat.isPositive ? 'text-success bg-success' : 'text-danger bg-danger']">
            <i :class="['pi', stat.isPositive ? 'pi-arrow-up' : 'pi-arrow-down']" style="font-size: 10px; margin-right: 2px;"></i>
            {{ stat.trend }}
          </div>
        </div>
        <div class="stat-body">
          <p class="text-subtitle">{{ stat.title }}</p>
          <h2 class="text-title">{{ stat.value }}</h2>
        </div>
      </div>
    </div>

    <!-- Main Layout (Asymmetric 70/30) -->
    <div class="dashboard-body">
      
      <!-- Main Content (70%) -->
      <section class="main-column">
        <!-- Próximas Citas -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-cardTitle">{{ $t('dashboard.appointments.title') }}</h3>
            <button class="link-btn">{{ $t('dashboard.appointments.viewAgenda') }}</button>
          </div>
          <div class="data-list">
            <div class="data-row" v-for="apt in recentAppointments" :key="apt.id">
              <div class="row-info">
                <img :src="apt.img" alt="Pet Profile" class="avatar" />
                <div class="row-details">
                  <p class="text-cardTitle">{{ apt.petName }}</p>
                  <p class="text-caption"><i class="pi pi-tag" style="font-size: 10px;"></i> {{ $t('dashboard.appointments.reason') }}: {{ apt.reason }}</p>
                </div>
              </div>
              <div class="row-meta">
                <p class="text-subtitle"><i class="pi pi-clock" style="font-size: 12px; margin-right: 4px;"></i>{{ apt.time }}</p>
                <span :class="['status-tag', `bg-${apt.statusClass}`, `text-${apt.statusClass}`]">{{ apt.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Side Content (30%) -->
      <section class="side-column">
        
        <!-- Alertas -->
        <div class="card mb-4">
          <div class="card-header">
            <h3 class="text-cardTitle" style="color: var(--color-status-danger-text)">{{ $t('dashboard.alerts.title') }}</h3>
          </div>
          <div class="alerts-list">
            <div class="alert-item" v-for="alert in alerts" :key="alert.id">
              <div :class="['alert-icon', `bg-${alert.type}`]">
                <i :class="['pi', alert.icon, `text-${alert.type}`]"></i>
              </div>
              <p class="text-caption alert-text">{{ alert.text }}</p>
            </div>
          </div>
        </div>

        <!-- Actividad Reciente -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-cardTitle">{{ $t('dashboard.activity.title') }}</h3>
          </div>
          <div class="activity-timeline">
            <div class="timeline-item" v-for="activity in activityTimeline" :key="activity.id">
              <div :class="['timeline-indicator', `bg-${activity.type}`]">
                <i :class="['pi', activity.icon, `text-${activity.type}`]"></i>
              </div>
              <div class="timeline-content">
                <p class="text-main" style="font-weight: 600; font-size: 13px;">{{ activity.text }}</p>
                <p class="text-caption">{{ activity.subtitle }} <span class="time-muted">• {{ activity.time }}</span></p>
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
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.secondary-btn, .primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--radius-standard);
  font-weight: 600;
  transition: all 0.2s;
  font-size: 14px;
}

.secondary-btn {
  background-color: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  color: var(--color-text-primary);
}

.secondary-btn:hover {
  background-color: var(--color-border-light);
}

.primary-btn {
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  border: 1px solid var(--color-primary-main);
  box-shadow: 0 4px 6px -1px rgba(0, 132, 199, 0.2);
}

.primary-btn:hover {
  background-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

/* --- KPI GRID --- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  background-color: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  padding: 24px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: box-shadow 0.2s;
}

.stat-card:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.icon-badge {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
}

.percentage-indicator {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: var(--font-body-caption-size);
  font-weight: 600;
  color: var(--color-text-secondary);
}

.bg-border-light { background-color: var(--color-background-sidebar); border: 1px solid var(--color-border-light); }

/* Utility colors */
.bg-success { background-color: var(--color-status-success-bg); }
.text-success { color: var(--color-status-success-text); }
.bg-warning { background-color: var(--color-status-warning-bg); }
.text-warning { color: var(--color-status-warning-text); }
.bg-info { background-color: var(--color-status-info-bg); }
.text-info { color: var(--color-status-info-text); }
.bg-danger { background-color: var(--color-status-danger-bg); }
.text-danger { color: var(--color-status-danger-text); }

/* --- ASYMMETRIC GRID --- */
.dashboard-body {
  display: grid;
  grid-template-columns: 7fr 3fr;
  gap: 24px;
  align-items: start;
}

.mb-4 { margin-bottom: 24px; }

.card {
  background-color: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  box-shadow: var(--shadow-card);
  padding: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-background-main);
}

.link-btn {
  color: var(--color-primary-main);
  font-weight: 600;
  font-size: 13px;
}

.link-btn:hover {
  text-decoration: underline;
}

/* --- CITAS (DATA ROW) --- */
.data-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid var(--color-border-light);
  transition: background-color 0.2s;
}

.data-row:hover {
  background-color: var(--color-background-sidebar);
  border-radius: 8px;
  padding: 16px 12px;
  margin: 0 -12px;
}

.data-row:last-child {
  border-bottom: none;
}

.row-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.row-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  object-fit: cover;
  border: 2px solid var(--color-border-light);
}

.row-meta {
  display: flex;
  align-items: center;
  gap: 24px;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  min-width: 90px;
  text-align: center;
}

/* --- ALERTAS --- */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: var(--color-background-sidebar);
  border-radius: 8px;
  border-left: 3px solid var(--color-border-light);
}

.alert-item:nth-child(1) { border-left-color: var(--color-status-danger-indicator); }
.alert-item:nth-child(2) { border-left-color: var(--color-status-warning-indicator); }
.alert-item:nth-child(3) { border-left-color: var(--color-status-info-indicator); }

.alert-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}

.alert-text {
  color: var(--color-text-primary);
  font-weight: 500;
  line-height: 1.4;
}

/* --- ACTIVITY TIMELINE --- */
.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
}

/* The vertical line */
.activity-timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 10px;
  bottom: 20px;
  width: 2px;
  background-color: var(--color-border-light);
}

.timeline-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  position: relative;
}

.timeline-indicator {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  border: 3px solid var(--color-background-surface);
}

.timeline-content {
  padding-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.time-muted {
  color: var(--color-text-muted);
}
</style>
