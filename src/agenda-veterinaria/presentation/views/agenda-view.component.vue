<template>
  <PageViewLoading
    v-if="store.loading"
    variant="agenda"
    :message="t('agenda.loading')"
  />
  <div v-else class="agenda-layout">
    <div class="calendar-panel is-light-mode">
      <div class="calendar-shell">
        <Qalendar
          :key="locale"
          :events="formattedEvents"
          :config="config"
        />
      </div>
    </div>
    
    <div class="list-section">
      <div class="list-header">
        <div class="list-header-text">
          <h3 class="list-title">{{ $t('agenda.title') }}</h3>
          <p class="list-subtitle">{{ $t('agenda.sidebarHint') }}</p>
        </div>
        <span class="list-badge">{{ sidebarGroups.length ? store.sidebarCitas.length : 0 }}</span>
      </div>
      
      <div v-if="store.error" class="state-panel state-panel--error">
        <i class="pi pi-exclamation-circle state-icon"></i>
        <span>{{ $t('agenda.error') }}</span>
      </div>
      <div v-else-if="sidebarGroups.length === 0" class="state-panel state-panel--empty">
        <i class="pi pi-calendar empty-icon"></i>
        <p>{{ $t('agenda.empty') }}</p>
      </div>
      
      <div v-else class="appointments-list">
        <div v-for="group in sidebarGroups" :key="group.date" class="day-group">
          <div class="day-group-label">{{ group.label }}</div>
          <div
            v-for="cita in group.citas"
            :key="cita.id"
            class="appointment-card"
            :class="getCardClass(cita.status)"
          >
            <div class="card-top">
              <div class="card-main">
                <span class="patient-name">{{ cita.patientName }}</span>
                <span class="type-text">{{ translateType(cita.type) }}</span>
              </div>
              <span class="status-badge" :class="getBadgeClass(cita.status)">
                {{ translateStatus(cita.status) }}
              </span>
            </div>
            <div class="card-meta">
              <span class="meta-item" :title="cita.ownerName">
                <i class="pi pi-user"></i>
                <span>{{ cita.ownerName }}</span>
              </span>
              <span class="meta-item">
                <i class="pi pi-clock"></i>
                <span>{{ cita.timeStart }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onActivated } from 'vue';
import { useI18n } from 'vue-i18n';
import PageViewLoading from '@/shared/presentation/components/page-view-loading.component.vue';
import { useAgendaStore } from '../../application/agenda.store.js';
import { Qalendar } from "qalendar";
import "qalendar/dist/style.css";

const { t, locale } = useI18n();

const store = useAgendaStore();

const getTodayIso = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysIso = (isoDate, days) => {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDayLabel = (isoDate) => {
  const today = getTodayIso();
  if (isoDate === today) return t('agenda.dayLabels.today');
  if (isoDate === addDaysIso(today, 1)) return t('agenda.dayLabels.tomorrow');

  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale.value === 'es' ? 'es-PE' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  });
};

const sidebarGroups = computed(() => {
  const groups = [];

  for (const cita of store.sidebarCitas) {
    const lastGroup = groups[groups.length - 1];
    if (!lastGroup || lastGroup.date !== cita.date) {
      groups.push({
        date: cita.date,
        label: formatDayLabel(cita.date),
        citas: [cita]
      });
      continue;
    }

    lastGroup.citas.push(cita);
  }

  return groups;
});

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
  return store.calendarCitas.map((cita) => ({
    id: cita.id,
    title: `${cita.patientName} - ${translateType(cita.type)}`,
    with: cita.ownerName,
    time: {
      start: `${cita.date} ${cita.timeStart}`,
      end: `${cita.date} ${cita.timeEnd || cita.timeStart}`
    },
    color: cita.status === 'Confirmada' ? 'green' : (cita.status === 'Pendiente' ? 'yellow' : 'blue'),
    isEditable: true,
    description: `${t('agenda.statusLabel')}: ${translateStatus(cita.status)}`
  }));
});

onActivated(async () => {
  await store.fetchCitas();
});

const getBadgeClass = (status) => {
  if (status === 'Pendiente')  return 'badge-pending';
  if (status === 'Confirmada') return 'badge-confirmed';
  if (status === 'Completada') return 'badge-completed';
  return '';
};

const getCardClass = (status) => {
  if (status === 'Pendiente') return 'appointment-card--pending';
  if (status === 'Confirmada') return 'appointment-card--confirmed';
  if (status === 'Completada') return 'appointment-card--completed';
  return '';
};

const translateStatus = (status) => t(`agenda.status.${status}`, status);
const translateType   = (type)   => t(`agenda.types.${type}`,   type);
</script>

<style scoped>

.agenda-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 0;
  height: calc(100vh - 128px);
  min-height: 0;
  overflow: hidden;
  margin: -24px;
  width: calc(100% + 48px);
  background:
    radial-gradient(
      color-mix(in srgb, var(--color-primary-main) 6%, transparent) 1px,
      transparent 1px
    ) 0 0 / 22px 22px,
    var(--color-background-main);
}

.calendar-panel {
  min-height: 0;
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.calendar-shell {
  position: relative;
  flex: 1;
  min-height: 720px;
  display: flex;
  flex-direction: column;
}

.calendar-panel :deep(.calendar-root-wrapper) {
  flex: 1;
  min-height: 0;
}

.calendar-panel :deep(.calendar-root) {
  --qalendar-blue: #0084C7;
  --qalendar-theme-color: #0084C7;
  --qalendar-border-radius: 12px;
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  box-shadow: var(--shadow-card);
  background: var(--color-background-surface);
  overflow: hidden;
}

.calendar-panel :deep(.calendar-header) {
  padding: 14px 16px;
  border-bottom: 1px solid var(--color-border-light);
  background: linear-gradient(
    180deg,
    var(--color-background-surface) 0%,
    color-mix(in srgb, var(--color-primary-subtle) 22%, var(--color-background-surface)) 100%
  );
}

.calendar-panel :deep(.calendar-header__chevron-arrow:hover) {
  color: var(--color-primary-main);
}

.calendar-panel :deep(.calendar-header__mode-picker),
.calendar-panel :deep(.date-picker__value-display) {
  border-color: var(--color-border-light);
  border-radius: 8px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.calendar-panel :deep(.calendar-header__mode-picker:hover),
.calendar-panel :deep(.date-picker__value-display:hover) {
  border-color: color-mix(in srgb, var(--color-primary-main) 30%, var(--color-border-light));
}

.calendar-panel :deep(.week-timeline) {
  border-bottom-color: var(--color-border-light);
  background: color-mix(in srgb, var(--color-background-sidebar) 65%, white);
}

.calendar-panel :deep(.week-timeline__day-name) {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.calendar-panel :deep(.week-timeline__date) {
  font-weight: 600;
  color: var(--color-text-primary);
}

.calendar-panel :deep(.is-today .week-timeline__date) {
  background: linear-gradient(
    135deg,
    var(--color-primary-main) 0%,
    var(--color-status-success-indicator) 100%
  );
  color: var(--color-primary-contrastText);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--color-primary-main) 28%, transparent);
}

.calendar-panel :deep(.calendar-week__day),
.calendar-panel :deep(.week-timeline__events) {
  border-color: color-mix(in srgb, var(--color-border-light) 90%, var(--color-primary-subtle)) !important;
}

.calendar-panel :deep(.day-timeline__hour) {
  color: var(--color-text-muted);
}

.calendar-panel :deep(.calendar-week__event) {
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 12%, transparent);
  box-shadow: 0 1px 4px color-mix(in srgb, var(--color-text-primary) 6%, transparent);
}

.calendar-panel :deep(.date-picker .week span.is-today) {
  background-color: var(--color-primary-main);
}

.calendar-panel :deep(.event-flyout) {
  border-radius: 12px;
  border-color: var(--color-border-light);
  box-shadow: 0 16px 40px color-mix(in srgb, var(--color-text-primary) 12%, transparent);
}

.list-section {
  min-height: 0;
  padding: 20px 18px 24px;
  background: linear-gradient(
    180deg,
    var(--color-background-sidebar) 0%,
    color-mix(in srgb, var(--color-primary-subtle) 18%, var(--color-background-sidebar)) 100%
  );
  display: flex;
  flex-direction: column;
  gap: 14px;
  overflow: hidden;
  border-left: 1px solid var(--color-border-light);
  box-shadow: inset 1px 0 0 color-mix(in srgb, white 60%, transparent);
}

.list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-light);
}

.list-header-text {
  min-width: 0;
}

.list-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.list-subtitle {
  margin: 4px 0 0;
  font-size: 0.8125rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.list-badge {
  background: linear-gradient(
    135deg,
    var(--color-primary-subtle) 0%,
    var(--color-status-info-bg) 100%
  );
  color: var(--color-primary-main);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 14%, transparent);
  border-radius: 9999px;
  padding: 4px 12px;
  font-size: 0.875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.appointments-list {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding-right: 4px;
  padding-bottom: 8px;
}

.day-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.day-group-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
  padding: 0 4px 8px;
  border-bottom: 1px dashed color-mix(in srgb, var(--color-primary-main) 16%, var(--color-border-light));
  flex-shrink: 0;
}

.appointment-card {
  position: relative;
  background-color: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  border-radius: 12px;
  padding: 14px 14px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-card);
  flex-shrink: 0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
  overflow: hidden;
}

.appointment-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--color-primary-main);
}

.appointment-card--pending::before {
  background: var(--color-status-warning-indicator);
}

.appointment-card--confirmed::before {
  background: var(--color-status-success-indicator);
}

.appointment-card--completed::before {
  background: var(--color-primary-main);
}

.appointment-card:hover {
  border-color: color-mix(in srgb, var(--color-primary-main) 22%, var(--color-border-light));
  box-shadow: 0 6px 18px color-mix(in srgb, var(--color-primary-main) 10%, transparent);
  transform: translateY(-1px);
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.card-main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid color-mix(in srgb, var(--color-border-light) 80%, var(--color-primary-subtle));
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  min-width: 0;
}

.meta-item i {
  font-size: 0.75rem;
  color: var(--color-primary-main);
  flex-shrink: 0;
  opacity: 0.85;
}

.meta-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
  flex-shrink: 0;
}

.patient-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.type-text {
  font-size: 0.8125rem;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-pending {
  background-color: var(--color-status-warning-bg);
  color: var(--color-status-warning-text);
}

.badge-confirmed {
  background-color: var(--color-status-success-bg);
  color: var(--color-status-success-text);
}

.badge-completed {
  background-color: var(--color-status-info-bg);
  color: var(--color-status-info-text);
}

.state-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 16px;
  text-align: center;
  border-radius: 12px;
  border: 1px dashed var(--color-border-light);
  background: color-mix(in srgb, var(--color-background-surface) 72%, transparent);
}

.state-panel--loading {
  color: var(--color-text-secondary);
}

.state-panel--loading .state-icon {
  font-size: 1.75rem;
  color: var(--color-primary-main);
}

.state-panel--error {
  color: var(--color-status-danger-indicator);
  border-color: color-mix(in srgb, var(--color-status-danger-indicator) 24%, var(--color-border-light));
  background: color-mix(in srgb, var(--color-status-danger-bg) 50%, transparent);
}

.state-panel--error .state-icon {
  font-size: 1.5rem;
}

.state-panel--empty {
  color: var(--color-text-secondary);
}

.state-panel--empty p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 22ch;
}

.empty-icon {
  font-size: 1.75rem;
  color: var(--color-text-muted);
}

@media (prefers-reduced-motion: reduce) {
  .appointment-card {
    transition: none;
  }

  .appointment-card:hover {
    transform: none;
  }
}

@media (max-width: 1100px) {
  .agenda-layout {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(480px, 1fr) auto;
    height: auto;
    min-height: calc(100vh - 128px);
    overflow: visible;
    margin: 0;
    width: 100%;
  }

  .list-section {
    max-height: 420px;
    border-left: none;
    border-top: 1px solid var(--color-border-light);
  }
}
</style>
