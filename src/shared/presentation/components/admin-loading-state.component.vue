<script setup>
import ProgressSpinner from 'primevue/progressspinner';

defineProps({
  message: { type: String, required: true },
  compact: { type: Boolean, default: false },
});
</script>

<template>
  <div
    class="admin-loading"
    :class="{ 'admin-loading--compact': compact }"
    role="status"
    aria-live="polite"
  >
    <ProgressSpinner strokeWidth="3" class="admin-loading-spinner" />
    <p class="admin-loading-text">{{ message }}</p>
  </div>
</template>

<style scoped>
.admin-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 240px;
  padding: 32px 24px;
  background: var(--bi-bg);
  border: 1px dashed color-mix(in srgb, var(--bi-teal) 18%, var(--bi-border));
  border-radius: var(--bi-radius, 12px);
  color: var(--bi-muted);
}

.admin-loading--compact {
  min-height: 168px;
  padding: 28px 20px;
}

.admin-loading-text {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-align: center;
}

.admin-loading-spinner {
  width: 36px;
  height: 36px;
}

.admin-loading-spinner :deep(.p-progress-spinner-circle) {
  stroke: var(--bi-teal) !important;
  animation: admin-loading-spin 1.4s ease-in-out infinite;
}

@keyframes admin-loading-spin {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -35px;
  }
  100% {
    stroke-dasharray: 89, 200;
    stroke-dashoffset: -124px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .admin-loading-spinner :deep(.p-progress-spinner-circle) {
    animation: none;
  }
}
</style>
