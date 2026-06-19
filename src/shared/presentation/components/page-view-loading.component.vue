<script setup>
defineProps({
  variant: {
    type: String,
    default: 'table',
    validator: (value) =>
      ['cards', 'grid', 'table', 'historial', 'dashboard', 'communication', 'agenda', 'profile', 'spinner'].includes(value)
  },
  cardCount: { type: Number, default: 3 },
  tableRows: { type: Number, default: 6 },
  gridItems: { type: Number, default: 6 },
  columns: { type: Number, default: 6 },
  message: { type: String, default: '' }
});
</script>

<template>
  <div
    class="page-loading"
    :class="[`page-loading--${variant}`]"
    role="status"
    :aria-label="message || undefined"
  >
    <template v-if="variant === 'cards'">
      <div class="skeleton-cards-row" :class="{ 'skeleton-cards-row-dynamic': cardCount !== 3 }" :style="cardCount !== 3 ? { gridTemplateColumns: `repeat(${Math.min(cardCount, 4)}, 1fr)` } : undefined">
        <div v-for="n in cardCount" :key="n" class="skeleton-card">
          <div class="skeleton-card-top">
            <span class="skeleton-block skeleton-circle"></span>
            <span class="skeleton-block skeleton-count"></span>
          </div>
          <span class="skeleton-block skeleton-line skeleton-line-md"></span>
          <span class="skeleton-block skeleton-line skeleton-line-sm"></span>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'grid'">
      <div class="skeleton-grid">
        <div v-for="n in gridItems" :key="n" class="skeleton-grid-card">
          <div class="skeleton-grid-header">
            <span class="skeleton-block skeleton-avatar"></span>
            <div class="skeleton-grid-title">
              <span class="skeleton-block skeleton-line skeleton-line-md"></span>
              <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
            </div>
          </div>
          <div class="skeleton-grid-body">
            <span v-for="row in 4" :key="row" class="skeleton-block skeleton-line skeleton-line-sm"></span>
          </div>
          <span class="skeleton-block skeleton-line skeleton-line-action"></span>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'table'">
      <div class="skeleton-table">
        <div class="skeleton-table-head">
          <span v-for="col in columns" :key="`head-${col}`" class="skeleton-block skeleton-line skeleton-line-xs"></span>
        </div>
        <div v-for="row in tableRows" :key="row" class="skeleton-table-row">
          <span
            v-for="col in columns"
            :key="`${row}-${col}`"
            class="skeleton-block skeleton-line"
            :class="col === 1 ? 'skeleton-line-md' : 'skeleton-line-sm'"
          ></span>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'historial'">
      <div class="skeleton-historial">
        <div class="skeleton-panel skeleton-patient-header">
          <span class="skeleton-block skeleton-avatar-lg"></span>
          <div class="skeleton-historial-info">
            <span class="skeleton-block skeleton-line skeleton-line-lg"></span>
            <span class="skeleton-block skeleton-line skeleton-line-sm"></span>
            <span class="skeleton-block skeleton-line skeleton-line-chip"></span>
          </div>
        </div>
        <div class="skeleton-cards-row skeleton-cards-row-4">
          <div v-for="n in 4" :key="`kpi-${n}`" class="skeleton-card skeleton-card-compact">
            <span class="skeleton-block skeleton-circle skeleton-circle-sm"></span>
            <span class="skeleton-block skeleton-line skeleton-line-md"></span>
            <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
          </div>
        </div>
        <div class="skeleton-panel">
          <span class="skeleton-block skeleton-line skeleton-line-md"></span>
          <div v-for="n in 3" :key="`tl-${n}`" class="skeleton-timeline-item">
            <span class="skeleton-block skeleton-timeline-icon"></span>
            <div class="skeleton-timeline-body">
              <span class="skeleton-block skeleton-line skeleton-line-md"></span>
              <span class="skeleton-block skeleton-line skeleton-line-sm"></span>
              <span class="skeleton-block skeleton-line skeleton-line-sm"></span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'dashboard'">
      <div class="skeleton-dashboard">
        <div class="skeleton-actions-row">
          <span v-for="n in 4" :key="`action-${n}`" class="skeleton-block skeleton-action-btn"></span>
        </div>
        <div class="skeleton-cards-row skeleton-cards-row-4">
          <div v-for="n in 4" :key="`dash-kpi-${n}`" class="skeleton-card skeleton-card-compact">
            <div class="skeleton-card-top">
              <span class="skeleton-block skeleton-circle skeleton-circle-sm"></span>
              <span class="skeleton-block skeleton-count skeleton-count-sm"></span>
            </div>
            <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
            <span class="skeleton-block skeleton-line skeleton-line-lg"></span>
          </div>
        </div>
        <div class="skeleton-dashboard-body">
          <div class="skeleton-panel skeleton-dashboard-main">
            <div class="skeleton-panel-head">
              <span class="skeleton-block skeleton-line skeleton-line-md"></span>
              <span class="skeleton-block skeleton-line skeleton-line-chip"></span>
            </div>
            <div v-for="n in 4" :key="`apt-${n}`" class="skeleton-list-row">
              <span class="skeleton-block skeleton-avatar skeleton-avatar-sm"></span>
              <div class="skeleton-list-copy">
                <span class="skeleton-block skeleton-line skeleton-line-md"></span>
                <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
              </div>
              <span class="skeleton-block skeleton-line skeleton-line-chip"></span>
            </div>
          </div>
          <div class="skeleton-dashboard-side">
            <div v-for="n in 2" :key="`side-${n}`" class="skeleton-panel">
              <span class="skeleton-block skeleton-line skeleton-line-md"></span>
              <div v-for="row in 3" :key="row" class="skeleton-block skeleton-line skeleton-line-sm skeleton-side-line"></div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'communication'">
      <div class="skeleton-communication">
        <div class="skeleton-panel skeleton-feed">
          <div class="skeleton-panel-head">
            <span class="skeleton-block skeleton-circle skeleton-circle-sm"></span>
            <div class="skeleton-list-copy">
              <span class="skeleton-block skeleton-line skeleton-line-md"></span>
              <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
            </div>
          </div>
          <div v-for="n in 4" :key="`notif-${n}`" class="skeleton-feed-item">
            <span class="skeleton-block skeleton-circle skeleton-circle-sm"></span>
            <div class="skeleton-list-copy">
              <span class="skeleton-block skeleton-line skeleton-line-md"></span>
              <span class="skeleton-block skeleton-line skeleton-line-sm"></span>
              <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
            </div>
          </div>
        </div>
        <div class="skeleton-panel skeleton-reminders">
          <div class="skeleton-panel-head">
            <span class="skeleton-block skeleton-circle skeleton-circle-sm"></span>
            <span class="skeleton-block skeleton-line skeleton-line-md"></span>
          </div>
          <div v-for="n in 3" :key="`rem-${n}`" class="skeleton-reminder-card">
            <span class="skeleton-block skeleton-line skeleton-line-md"></span>
            <span class="skeleton-block skeleton-line skeleton-line-sm"></span>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'agenda'">
      <div class="skeleton-agenda">
        <div class="skeleton-block skeleton-calendar"></div>
        <div class="skeleton-agenda-sidebar">
          <div class="skeleton-sidebar-head">
            <span class="skeleton-block skeleton-line skeleton-line-md"></span>
            <span class="skeleton-block skeleton-badge"></span>
          </div>
          <div v-for="n in 4" :key="`cita-${n}`" class="skeleton-appointment-card">
            <span class="skeleton-block skeleton-line skeleton-line-md"></span>
            <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
            <div class="skeleton-appointment-meta">
              <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
              <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="variant === 'profile'">
      <div class="skeleton-profile">
        <div class="skeleton-panel skeleton-profile-header">
          <span class="skeleton-block skeleton-avatar-lg"></span>
          <div class="skeleton-historial-info">
            <span class="skeleton-block skeleton-line skeleton-line-lg"></span>
            <span class="skeleton-block skeleton-line skeleton-line-sm"></span>
          </div>
          <span class="skeleton-block skeleton-line skeleton-line-chip"></span>
        </div>
        <div v-for="n in 2" :key="`section-${n}`" class="skeleton-panel">
          <div class="skeleton-panel-head">
            <span class="skeleton-block skeleton-circle skeleton-circle-sm"></span>
            <div class="skeleton-list-copy">
              <span class="skeleton-block skeleton-line skeleton-line-md"></span>
              <span class="skeleton-block skeleton-line skeleton-line-xs"></span>
            </div>
          </div>
          <div class="skeleton-form-grid">
            <span v-for="field in 6" :key="field" class="skeleton-block skeleton-field"></span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="page-loading-spinner-wrap">
        <i class="pi pi-spin pi-spinner page-loading-spinner" aria-hidden="true"></i>
      </div>
    </template>

    <p v-if="message && variant !== 'spinner'" class="page-loading-message">{{ message }}</p>
    <p v-else-if="message && variant === 'spinner'" class="page-loading-message">{{ message }}</p>
  </div>
</template>

<style scoped>
.page-loading {
  width: 100%;
}

.skeleton-cards-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
}

.skeleton-cards-row-4 {
  grid-template-columns: repeat(4, 1fr);
}

.skeleton-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px 22px;
  min-height: 130px;
  border-radius: var(--radius-large);
  border: 1px solid var(--color-border-light);
  background: var(--color-background-surface);
  box-shadow: var(--shadow-card);
}

.skeleton-card-compact {
  min-height: 110px;
}

.skeleton-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skeleton-block {
  display: block;
  background: color-mix(in srgb, var(--color-border-light) 72%, var(--color-background-main));
  border-radius: var(--radius-standard);
  animation: page-shimmer 1.4s ease-in-out infinite;
}

.skeleton-circle {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.skeleton-circle-sm {
  width: 36px;
  height: 36px;
}

.skeleton-count {
  width: 48px;
  height: 28px;
}

.skeleton-count-sm {
  width: 40px;
  height: 22px;
}

.skeleton-line {
  height: 14px;
  width: 100%;
}

.skeleton-line-lg {
  height: 22px;
  width: 55%;
}

.skeleton-line-md {
  width: 72%;
}

.skeleton-line-sm {
  width: 48%;
}

.skeleton-line-xs {
  height: 12px;
  width: 36%;
}

.skeleton-line-chip {
  width: 88px;
  height: 28px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.skeleton-line-action {
  height: 36px;
  width: 100%;
  margin-top: 4px;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 0 22px 22px;
}

.skeleton-grid-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  background: var(--color-background-surface);
}

.skeleton-grid-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skeleton-avatar {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-large);
  flex-shrink: 0;
}

.skeleton-avatar-sm {
  width: 40px;
  height: 40px;
}

.skeleton-avatar-lg {
  width: 72px;
  height: 72px;
  border-radius: var(--radius-large);
  flex-shrink: 0;
}

.skeleton-grid-title,
.skeleton-list-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.skeleton-grid-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-table {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px 22px 22px;
}

.skeleton-table-head,
.skeleton-table-row {
  display: grid;
  grid-template-columns: repeat(v-bind(columns), minmax(0, 1fr));
  gap: 12px;
  align-items: center;
}

.skeleton-table-head {
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border-light);
}

.skeleton-table-row {
  padding: 10px 0;
  border-bottom: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
}

.skeleton-historial,
.skeleton-dashboard,
.skeleton-profile {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.skeleton-panel {
  padding: 18px 20px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  background: var(--color-background-surface);
  box-shadow: var(--shadow-card);
}

.skeleton-patient-header,
.skeleton-profile-header {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.skeleton-historial-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 180px;
}

.skeleton-timeline-item {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.skeleton-timeline-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-large);
  flex-shrink: 0;
}

.skeleton-timeline-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
}

.skeleton-actions-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.skeleton-action-btn {
  height: 38px;
  flex: 1;
  min-width: 140px;
  border-radius: var(--radius-standard);
}

.skeleton-dashboard-body {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(280px, 1fr);
  gap: 20px;
}

.skeleton-dashboard-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-panel-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-list-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
}

.skeleton-list-row:first-of-type {
  border-top: none;
  padding-top: 0;
}

.skeleton-side-line {
  margin-top: 10px;
}

.skeleton-communication {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
}

.skeleton-feed-item {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid color-mix(in srgb, var(--color-border-light) 70%, transparent);
}

.skeleton-feed-item:first-of-type {
  border-top: none;
  padding-top: 0;
}

.skeleton-reminder-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  margin-top: 12px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
  background: color-mix(in srgb, var(--color-background-main) 50%, var(--color-background-surface));
}

.skeleton-agenda {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 0;
  min-height: calc(100vh - 128px);
  margin: -24px;
  width: calc(100% + 48px);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  overflow: hidden;
  background: var(--color-background-surface);
}

.skeleton-calendar {
  min-height: 420px;
  border-right: 1px solid var(--color-border-light);
  border-radius: 0;
}

.skeleton-agenda-sidebar {
  padding: 20px 18px;
  background: var(--color-background-surface);
}

.skeleton-sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.skeleton-badge {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

.skeleton-appointment-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  margin-bottom: 10px;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-standard);
}

.skeleton-appointment-meta {
  display: flex;
  gap: 10px;
}

.skeleton-appointment-meta .skeleton-line {
  width: 72px;
}

.skeleton-form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.skeleton-field {
  height: 42px;
}

.page-loading-spinner-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  text-align: center;
}

.page-loading-spinner {
  font-size: 32px;
  color: var(--color-primary-main);
}

.page-loading-message {
  margin: 12px 0 0;
  font-size: var(--font-body-main-size);
  color: var(--color-text-secondary);
  text-align: center;
}

.page-loading--spinner {
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-large);
  background: var(--color-background-surface);
}

.page-loading--table .page-loading-message,
.page-loading--historial .page-loading-message,
.page-loading--dashboard .page-loading-message,
.page-loading--communication .page-loading-message,
.page-loading--agenda .page-loading-message,
.page-loading--profile .page-loading-message {
  padding: 0 4px 8px;
}

@keyframes page-shimmer {
  0%, 100% { opacity: 0.55; }
  50% { opacity: 1; }
}

@media (max-width: 1100px) {
  .skeleton-cards-row-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .skeleton-dashboard-body,
  .skeleton-communication {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .skeleton-cards-row,
  .skeleton-cards-row-4 {
    grid-template-columns: 1fr;
  }

  .skeleton-table-head,
  .skeleton-table-row {
    grid-template-columns: 1fr 1fr;
  }

  .skeleton-agenda {
    grid-template-columns: 1fr;
    margin: 0;
    width: 100%;
    min-height: 480px;
  }

  .skeleton-calendar {
    min-height: 280px;
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
  }

  .skeleton-form-grid {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block {
    animation: none;
    opacity: 0.75;
  }
}
</style>
