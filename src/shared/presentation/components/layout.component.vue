<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './language-switcher.component.vue'
import { PerfilApi } from '@/perfil/infrastructure/perfil-api.js'
import { useIamStore } from '@/iam/application/iam.store.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const perfilApi = new PerfilApi()
const iamStore = useIamStore()

const userProfile = ref({
  nombre: 'Dra. Ana',
  apellidos: 'López',
  especialidad: 'Veterinario Principal'
})

onMounted(async () => {
  try {
    const data = await perfilApi.getPerfil()
    if (data && data.datosPersonales) {
      userProfile.value = data.datosPersonales
    }
  } catch (error) {
    console.error('Error fetching user profile for sidebar:', error)
  }
})

const handleLogout = async () => {
  await iamStore.logout()
  router.push({ name: 'login' })
}

const headerTitle = computed(() => {
  if (route.path.includes('/dashboard')) return t('layout.headerTitle.dashboard')
  if (route.path.includes('/agenda')) return t('layout.headerTitle.agenda')
  if (route.path.includes('/perfil')) return t('layout.headerTitle.perfil')
  if (route.path.includes('/gestion-clinica')) return t('nav.clinicManagement')
  if (route.path.includes('/comunicacion')) return t('layout.headerTitle.communication')
  if (route.path.includes('/admin/inventory')) return 'Inventario'
  if (route.path.includes('/admin/procurement')) return 'Compras y Proveedores'
  if (route.path.includes('/admin/economics')) return 'Económico'
  return t('layout.headerTitle.default')
})

const headerSubtitle = computed(() => {
  if (route.path.includes('/dashboard')) return t('layout.headerSubtitle.dashboard')
  if (route.path.includes('/agenda')) return t('layout.headerSubtitle.agenda')
  if (route.path.includes('/perfil')) return t('layout.headerSubtitle.perfil')
  if (route.path.includes('/gestion-clinica')) return t('layout.headerSubtitle.clinicManagement')
  if (route.path.includes('/comunicacion')) return t('layout.headerSubtitle.communication')
  if (route.path.includes('/admin')) return 'Administración del sistema'
  return t('layout.headerSubtitle.default')
})

const navLinks = computed(() => {
  const links = [];
  
  if (iamStore.roles.includes('veterinario')) {
    links.push({ id: 'dashboard', label: t('nav.dashboard'),         icon: 'pi-home',     route: '/dashboard' });
    links.push({ id: 'clinic',    label: t('nav.clinicManagement'),  icon: 'pi-heart',    route: '/gestion-clinica' });
    links.push({ id: 'calendar',  label: t('nav.agenda'),            icon: 'pi-calendar', route: '/agenda' });
    links.push({ id: 'communication', label: t('nav.communication'), icon: 'pi-comments', route: '/comunicacion' });
    links.push({ id: 'profile',   label: t('nav.profile'),           icon: 'pi-user',     route: '/perfil' });
  }

  if (iamStore.roles.includes('admin')) {
    links.push({ id: 'admin-inventory', label: 'Inventario', icon: 'pi-box', route: '/admin/inventory' });
    links.push({ id: 'admin-procurement', label: 'Compras', icon: 'pi-shopping-cart', route: '/admin/procurement' });
    links.push({ id: 'admin-economics', label: 'Económico', icon: 'pi-chart-line', route: '/admin/economics' });
  }

  return links;
})
</script>

<template>
  <div class="layout-wrapper">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand text-title">
        <i class="pi pi-briefcase" style="font-size: 1.5rem; color: var(--color-primary-main)"></i>
        VetCare Pro
      </div>

      <nav class="sidebar-nav">
        <ul>
          <li v-for="link in navLinks" :key="link.id">
            <router-link
              :to="link.route"
              class="nav-link"
              active-class="active"
            >
              <i :class="['pi', link.icon, 'nav-icon']"></i>
              <span class="nav-label">{{ link.label }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="sidebar-user-profile" v-if="!iamStore.roles.includes('admin')">
        <div class="avatar">
           <img src="https://i.pravatar.cc/150?img=33" alt="User Avatar" />
        </div>
        <div class="user-info">
          <p class="user-name">{{ userProfile.nombre }} {{ userProfile.apellidos }}</p>
          <p class="user-role text-caption">{{ userProfile.especialidad || $t('layout.userRole') }}</p>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="main-content">
      <header class="main-header">
        <div class="header-info">
          <h2 class="header-title" style="margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--color-text-primary);">{{ headerTitle }}</h2>
          <p class="header-subtitle" style="margin: 4px 0 0; font-size: 0.875rem; color: var(--color-text-secondary);">{{ headerSubtitle }}</p>
        </div>
        <div class="header-actions">
          <!-- Language Switcher -->
          <LanguageSwitcher />

          <!-- Notifications -->
          <button class="action-btn icon-btn" :title="$t('layout.notifications')">
            <i class="pi pi-bell"></i>
          </button>

          <!-- Logout -->
          <button class="action-btn icon-btn" title="Cerrar sesión" @click="handleLogout">
            <i class="pi pi-sign-out"></i>
          </button>
        </div>
      </header>

      <!-- Dynamic View (Dashboard/Agenda/etc) -->
      <main class="page-container">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* --- SIDEBAR --- */
.sidebar {
  width: 260px;
  background-color: var(--color-background-sidebar);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
}

.sidebar-brand {
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 var(--spacing-container-padding);
  gap: 12px;
  color: var(--color-primary-main);
}

.sidebar-nav {
  flex: 1;
  padding: var(--spacing-element-gap) 0;
}

.sidebar-nav ul {
  list-style: none;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 4px 16px;
  text-decoration: none;
  color: var(--color-text-secondary);
  border-radius: 8px;
  font-weight: var(--font-body-main-weight);
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
}

.nav-link:hover {
  background-color: var(--color-border-light);
  color: var(--color-text-primary);
}

.nav-link.active {
  background-color: #E0F2FE;
  color: var(--color-primary-main);
  border-left: 4px solid var(--color-primary-main);
  border-radius: 0 8px 8px 0;
  margin-left: 0;
  padding-left: 32px; /* compensate for margin lost */
}

.nav-icon {
  font-size: 20px;
  margin-right: 12px;
}

.sidebar-user-profile {
  padding: var(--spacing-container-padding);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.sidebar-user-profile:hover {
  background-color: var(--color-border-light);
}

.avatar img {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  object-fit: cover;
}

.user-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
}

/* --- MAIN CONTENT --- */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-main);
  overflow-y: auto;
}

.main-header {
  height: 80px;
  padding: 0 var(--spacing-container-padding);
  background-color: var(--color-background-surface);
  border-bottom: 1px solid var(--color-border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 1.2rem;
  transition: background 0.2s;
}

.icon-btn:hover {
  background-color: var(--color-background-main);
}

.primary-btn {
  background-color: var(--color-primary-main);
  color: var(--color-primary-contrastText);
  padding: 10px 20px;
  border-radius: var(--radius-standard);
  font-weight: 600;
  transition: background 0.2s;
}

.primary-btn:hover {
  background-color: var(--color-primary-hover);
}

.page-container {
  padding: var(--spacing-container-padding);
  flex: 1;
}
</style>
