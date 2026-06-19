<script setup>
defineProps({
  message: { type: String, required: true },
  compact: { type: Boolean, default: false },
  retryLabel: { type: String, default: '' },
});

const emit = defineEmits(['retry']);
</script>

<template>
  <div
    class="admin-error"
    :class="{ 'admin-error--compact': compact }"
    role="alert"
  >
    <div class="admin-error-icon"><i class="pi pi-exclamation-circle"></i></div>
    <p class="admin-error-text">{{ message }}</p>
    <button
      v-if="retryLabel"
      type="button"
      class="admin-error-retry"
      @click="emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>

<style scoped>
.admin-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 240px;
  padding: 32px 24px;
  background: color-mix(in srgb, #b91c1c 4%, var(--bi-bg));
  border: 1px dashed color-mix(in srgb, #b91c1c 24%, var(--bi-border));
  border-radius: var(--bi-radius, 12px);
  color: #b91c1c;
  text-align: center;
}

.admin-error--compact {
  min-height: 168px;
  padding: 28px 20px;
}

.admin-error-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: color-mix(in srgb, #b91c1c 10%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-error-icon i {
  font-size: 20px;
}

.admin-error-text {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  max-width: 28ch;
}

.admin-error-retry {
  border: 1px solid var(--bi-border);
  background: var(--bi-paper);
  color: var(--bi-ink);
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.admin-error-retry:hover {
  border-color: var(--bi-teal);
  color: var(--bi-teal);
}

.admin-error-retry:focus-visible {
  outline: 2px solid var(--bi-teal);
  outline-offset: 2px;
}
</style>
