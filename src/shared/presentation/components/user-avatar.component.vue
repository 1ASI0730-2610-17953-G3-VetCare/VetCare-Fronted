<script setup>
import { computed } from 'vue';
import { resolveAvatarUrl } from '@/shared/infrastructure/avatar.utils.js';

const props = defineProps({
  avatarUrl: {
    type: String,
    default: null
  },
  nombre: {
    type: String,
    default: ''
  },
  apellidos: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  },
  cacheKey: {
    type: [Number, String],
    default: null
  }
});

const initials = computed(() => {
  const n = props.nombre ? props.nombre.charAt(0) : '';
  const a = props.apellidos ? props.apellidos.charAt(0) : '';
  return (n + a).toUpperCase() || 'V';
});

const imageSrc = computed(() => resolveAvatarUrl(props.avatarUrl, props.cacheKey));
</script>

<template>
  <div :class="['user-avatar', `user-avatar--${size}`]">
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :alt="`${nombre} ${apellidos}`.trim() || 'Avatar'"
      class="user-avatar__image"
    />
    <span v-else class="user-avatar__initials">{{ initials }}</span>
  </div>
</template>

<style scoped>
.user-avatar {
  border-radius: 9999px;
  background: #e0f2fe;
  color: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  font-weight: 700;
}

.user-avatar--sm {
  width: 40px;
  height: 40px;
  font-size: 14px;
}

.user-avatar--md {
  width: 80px;
  height: 80px;
  font-size: 28px;
}

.user-avatar--lg {
  width: 96px;
  height: 96px;
  font-size: 32px;
}

.user-avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-avatar__initials {
  line-height: 1;
}
</style>
