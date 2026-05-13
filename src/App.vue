<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import LayoutComponent from './shared/presentation/components/layout.component.vue'

const route = useRoute()

const isPublicRoute = computed(() => {
  return route.meta.requiresAuth === false
})
</script>

<template>
  <template v-if="isPublicRoute">
    <router-view />
  </template>
  <LayoutComponent v-else>
    <router-view />
  </LayoutComponent>
</template>

<style>
</style>
