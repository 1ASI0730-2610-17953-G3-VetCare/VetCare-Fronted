<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LayoutComponent from './shared/presentation/components/layout.component.vue'

const route = useRoute()

const isPublicRoute = computed(() => {
  return route.meta.requiresAuth === false
})

const keepAliveKey = computed(() => {
  const record = route.matched.find((matched) => matched.components?.default)
  return record?.name ?? record?.path ?? route.fullPath
})
</script>

<template>
  <template v-if="isPublicRoute">
    <router-view />
  </template>
  <LayoutComponent v-else>
    <router-view v-slot="{ Component }">
      <keep-alive :max="10">
        <component :is="Component" v-if="Component" :key="keepAliveKey" />
      </keep-alive>
    </router-view>
  </LayoutComponent>
</template>

<style>
</style>
