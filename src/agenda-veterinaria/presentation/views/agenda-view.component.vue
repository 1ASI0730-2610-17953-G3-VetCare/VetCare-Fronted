<template>
  <div class="agenda-layout">
    <div class="calendar-panel is-light-mode">
      <Qalendar
        :key="locale"
        :events="formattedEvents"
        :config="config"
      />
    </div>
    
    <div class="list-section">
      <div class="list-header">
        <h3 class="list-title">{{ $t('agenda.title') }}</h3>
        <span class="list-badge">{{ store.citas.length }}</span>
      </div>
      
      <div v-if="store.loading" class="loading-state">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <span style="margin-left: 8px;">{{ $t('agenda.loading') }}</span>
      </div>
      <div v-else-if="store.error" class="error-state">
        {{ $t('agenda.error') }}
      </div>
      
      <div v-else class="appointments-list">
        <div v-for="cita in store.citas" :key="cita.id" class="appointment-card">
          <div class="card-row space-between align-center">
            <span class="patient-name">{{ cita.patientName }}</span>
            <div class="status-badge" :class="getBadgeClass(cita.status)">{{ translateStatus(cita.status) }}</div>
          </div>
          <div class="card-row">
            <span class="owner-name"><i class="pi pi-user mr-1"></i> {{ cita.ownerName }}</span>
          </div>
          <div class="card-row space-between align-center mt-1">
            <span class="time-text"><i class="pi pi-clock mr-1"></i> {{ cita.timeStart }}</span>
            <span class="type-text">{{ translateType(cita.type) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAgendaStore } from '../../application/agenda.store.js';
import { Qalendar } from "qalendar";
import "qalendar/dist/style.css";

const { t, locale } = useI18n();

const store = useAgendaStore();

// Qalendar configuration — locale is reactive
const config = computed(() => ({
  locale: locale.value === 'es' ? 'es-ES' : 'en-US',
  defaultMode: 'week',
  style: {
    fontFamily: 'inherit',
    colorSchemes: {
      green: { backgroundColor: '#DCFCE7', color: '#166534' },
      yellow: { backgroundColor: '#FFEDD5', color: '#9A3412' },
      blue: { backgroundColor: '#E0F2FE', color: '#0084C7' }
    }
  }
}));

const formattedEvents = computed(() => {
  return store.citas.map(cita => ({
    id: cita.id,
    title: `${cita.patientName} - ${translateType(cita.type)}`,
    with: cita.ownerName,
    time: {
      start: `${cita.date} ${cita.timeStart}`,
      end: `${cita.date} ${cita.timeEnd}`
    },
    color: cita.status === 'Confirmada' ? 'green' : (cita.status === 'Pendiente' ? 'yellow' : 'blue'),
    isEditable: true,
    description: `${t('agenda.statusLabel')}: ${translateStatus(cita.status)}`
  }));
});

onMounted(async () => {
  await store.fetchCitas();
});

const getBadgeClass = (status) => {
  if (status === 'Pendiente')  return 'badge-pending';
  if (status === 'Confirmada') return 'badge-confirmed';
  if (status === 'Completada') return 'badge-completed';
  return '';
};

// Translate domain values (stored in Spanish) to the active locale
const translateStatus = (status) => t(`agenda.status.${status}`, status);
const translateType   = (type)   => t(`agenda.types.${type}`,   type);
</script>

<style scoped>
/* Main Layout Mapping */
.agenda-layout {
  display: grid;
  grid-template-columns: 1fr 320px; /* Switch to 1fr 320px for better fit (List on right as usual or inverted based on typical UX) */
  gap: 0;
  height: calc(100vh - 128px);
  overflow: hidden;
  background-color: var(--color-background-main, #f8fafc);
}

/* Calendar View Container */
.calendar-panel {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: var(--p-surface-0, #ffffff);
  border-right: 1px solid var(--p-surface-200, #e2e8f0);
  overflow-y: auto;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 16px;
}

.month-title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary, #1e293b);
}

.header-controls {
  display: flex;
  gap: 16px;
  align-items: center;
}

/* Calendar Grid */
.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--p-surface-200, #e2e8f0);
  border-radius: 12px;
  overflow: hidden;
}

.grid-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background-color: var(--p-surface-50, #f8fafc);
  border-bottom: 1px solid var(--p-surface-200, #e2e8f0);
}

.weekday {
  padding: 12px;
  text-align: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--color-text-secondary, #64748b);
}

.grid-body {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-auto-rows: minmax(120px, auto);
  flex: 1;
}

.grid-cell {
  border-right: 1px solid var(--p-surface-200, #e2e8f0);
  border-bottom: 1px solid var(--p-surface-200, #e2e8f0);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.grid-cell:nth-child(7n) {
  border-right: none;
}

.day-number {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary, #334155);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 4px;
}

.day-number.is-today {
  background-color: var(--p-primary-color, #0ea5e9);
  color: white;
}

/* Event Badges */
.events-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  transition: opacity 0.2s;
}

.event-badge:hover {
  opacity: 0.8;
}

.badge-pending {
  background-color: #FFEDD5;
  color: #9A3412;
}

.badge-confirmed {
  background-color: #DCFCE7;
  color: #166534;
}

/* List Section */
.list-section {
  padding: 32px 24px;
  background-color: var(--p-surface-50, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary, #0f172a);
}

.list-badge {
  background-color: #E0F2FE;
  color: #0084C7;
  border-radius: 9999px;
  padding: 2px 12px;
  font-size: 0.875rem;
  font-weight: 700;
}

/* Appointment Card */
.appointments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.appointment-card {
  background-color: var(--p-surface-0, #ffffff);
  border: 1px solid var(--p-surface-200, #e2e8f0);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.appointment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-row {
  display: flex;
  width: 100%;
}

.space-between { justify-content: space-between; }
.align-center { align-items: center; }
.mt-1 { margin-top: 6px; }
.mr-1 { margin-right: 6px; font-size: 0.9em; }

.status-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.70rem;
  font-weight: 700;
  text-transform: uppercase;
  display: inline-block;
}

.time-text {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text-primary, #0f172a);
}

.patient-name {
  font-weight: 600;
  color: var(--color-text-primary, #334155);
}

.owner-name {
  color: var(--color-text-secondary, #64748b);
}

.separator {
  color: var(--color-text-secondary, #94a3b8);
}

.type-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary, #64748b);
}

.loading-state, .error-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
  color: var(--color-text-secondary, #64748b);
}
</style>
