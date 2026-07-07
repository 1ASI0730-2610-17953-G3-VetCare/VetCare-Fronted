<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './language-switcher.component.vue'
import CurrencySwitcher from './currency-switcher.component.vue'
import UserAvatar from './user-avatar.component.vue'
import { useIamStore } from '@/iam/application/iam.store.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const iamStore = useIamStore()

const showPlanPanel = ref(false)
const sidebarProfileRef = ref(null)

const planFeatures = computed(() => [
  t('layout.subscriptionPlan.features.clinical'),
  t('layout.subscriptionPlan.features.agenda'),
  t('layout.subscriptionPlan.features.records'),
  t('layout.subscriptionPlan.features.support')
])

const togglePlanPanel = () => {
  showPlanPanel.value = !showPlanPanel.value
}

const onDocumentClick = (event) => {
  if (!showPlanPanel.value || !sidebarProfileRef.value) return
  if (!sidebarProfileRef.value.contains(event.target)) {
    showPlanPanel.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

const userProfile = computed(() => ({
  nombre: iamStore.user?.nombre ?? t('layout.defaultUser'),
  apellidos: iamStore.user?.apellidos ?? '',
  especialidad: t('layout.userRole')
}))

const handleLogout = async () => {
  await iamStore.logout()
  router.push({ name: 'login' })
}

const headerTitle = computed(() => {
  if (route.path.includes('/admin/dashboard')) return t('nav.adminDashboard');
  if (route.path.includes('/dashboard')) return t('layout.headerTitle.dashboard')
  if (route.path.includes('/agenda')) return t('layout.headerTitle.agenda')
  if (route.path.includes('/perfil')) return t('layout.headerTitle.perfil')
  if (route.path.includes('/gestion-clinica')) return t('nav.clinicManagement')
  if (route.path.includes('/comunicacion')) return t('layout.headerTitle.communication')
  if (route.path.includes('/admin/inventory')) return t('layout.headerTitle.inventory')
  if (route.path.includes('/admin/procurement')) return t('layout.headerTitle.procurement')
  if (route.path.includes('/admin/economics')) return t('layout.headerTitle.economics')
  if (route.path.includes('/admin/usuarios')) return 'Usuarios'
  return t('layout.headerTitle.default')
})

const headerSubtitle = computed(() => {
  if (route.path.includes('/dashboard')) return t('layout.headerSubtitle.dashboard')
  if (route.path.includes('/agenda')) return t('layout.headerSubtitle.agenda')
  if (route.path.includes('/perfil')) return t('layout.headerSubtitle.perfil')
  if (route.path.includes('/gestion-clinica')) return t('layout.headerSubtitle.clinicManagement')
  if (route.path.includes('/comunicacion')) return t('layout.headerSubtitle.communication')
  if (route.path.includes('/admin')) return t('layout.headerSubtitle.admin')
  return t('layout.headerSubtitle.default')
})

const isAdminLayout = computed(() => route.path.includes('/admin'))

const hasPageCurrencySwitcher = computed(() =>
  route.path.includes('/admin/dashboard') || route.path.includes('/admin/economics')
)

const adminShellEyebrow = computed(() => {
  if (route.path.includes('/admin/dashboard')) return t('layout.adminShellEyebrow.dashboard')
  if (route.path.includes('/admin/inventory')) return t('layout.adminShellEyebrow.inventory')
  if (route.path.includes('/admin/procurement')) return t('layout.adminShellEyebrow.procurement')
  if (route.path.includes('/admin/economics')) return t('layout.adminShellEyebrow.economics')
  if (route.path.includes('/admin/usuarios')) return 'Administración del sistema'
  return t('layout.headerSubtitle.admin')
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
    links.push({ id: 'admin-dashboard', label: t('nav.adminDashboard'), icon: 'pi-chart-bar', route: '/admin/dashboard' });
    links.push({ id: 'admin-inventory', label: t('nav.inventory'), icon: 'pi-box', route: '/admin/inventory' });
    links.push({ id: 'admin-procurement', label: t('nav.procurement'), icon: 'pi-shopping-cart', route: '/admin/procurement' });
    links.push({ id: 'admin-economics', label: t('nav.economics'), icon: 'pi-chart-line', route: '/admin/economics' });
    links.push({ id: 'admin-usuarios', label: 'Usuarios', icon: 'pi-users', route: '/admin/usuarios' });
  }

  return links;
})
</script>

<template>
  <div class="layout-wrapper" :class="{ 'layout--admin': isAdminLayout }">
    <aside class="sidebar">
      <div class="sidebar-brand" :class="{ 'text-title': !isAdminLayout }">
        <div v-if="isAdminLayout" class="brand-mark" aria-hidden="true">
          <i class="pi pi-heart-fill"></i>
        </div>
        <div v-else class="brand-mark brand-mark--vet">
          <img
            src="/vetcare-logo-mark.svg"
            alt=""
            class="brand-logo-img"
            width="42"
            height="42"
          />
        </div>
        <div class="brand-text">
          <span v-if="isAdminLayout" class="brand-eyebrow">{{ t('layout.sidebar.brandEyebrow.admin') }}</span>
          <span v-else class="brand-eyebrow brand-eyebrow--vet">{{ t('layout.sidebar.brandEyebrow.vet') }}</span>
          <span class="brand-name" :class="{ 'brand-name--vet': !isAdminLayout }">{{ t('layout.sidebar.brandName') }}</span>
        </div>
      </div>

      <nav class="sidebar-nav" :aria-label="t('layout.sidebar.navAriaLabel')">
        <p v-if="isAdminLayout" class="nav-section-label">{{ t('layout.sidebar.navSection.admin') }}</p>
        <p v-else class="nav-section-label nav-section-label--vet">{{ t('layout.sidebar.navSection.vet') }}</p>
        <ul>
          <li v-for="link in navLinks" :key="link.id">
            <router-link
              :to="link.route"
              class="nav-link"
              active-class="active"
            >
              <span class="nav-icon-wrap">
                <i :class="['pi', link.icon, 'nav-icon']"></i>
              </span>
              <span class="nav-label">{{ link.label }}</span>
            </router-link>
          </li>
        </ul>
      </nav>

      <div
        v-if="!iamStore.roles.includes('admin')"
        ref="sidebarProfileRef"
        class="sidebar-user-profile"
      >
        <Transition name="plan-panel">
          <article
            v-if="showPlanPanel"
            class="subscription-plan-card"
            :aria-label="t('layout.subscriptionPlan.planName')"
          >
            <div class="plan-card-accent" aria-hidden="true"></div>

            <header class="plan-card-header">
              <div class="plan-card-heading">
                <p class="plan-card-eyebrow">{{ t('layout.subscriptionPlan.eyebrow') }}</p>
                <h3 class="plan-card-title">{{ t('layout.subscriptionPlan.planName') }}</h3>
              </div>
              <span class="plan-status-badge">
                <i class="pi pi-check-circle" aria-hidden="true"></i>
                {{ t('layout.subscriptionPlan.statusActive') }}
              </span>
            </header>

            <p class="plan-card-description">{{ t('layout.subscriptionPlan.description') }}</p>

            <ul class="plan-feature-list">
              <li v-for="feature in planFeatures" :key="feature" class="plan-feature-item">
                <span class="plan-feature-icon" aria-hidden="true">
                  <i class="pi pi-check"></i>
                </span>
                <span>{{ feature }}</span>
              </li>
            </ul>

            <div class="plan-card-meta plan-card-meta--footer">
              <p class="plan-renewal">
                {{ t('layout.subscriptionPlan.renewal', { date: t('layout.subscriptionPlan.renewalDate') }) }}
              </p>
              <p class="plan-billing">{{ t('layout.subscriptionPlan.billingCycle') }}</p>
            </div>
          </article>
        </Transition>

        <button
          type="button"
          class="user-profile-card"
          :aria-expanded="showPlanPanel"
          :aria-label="showPlanPanel ? t('layout.subscriptionPlan.toggleCollapse') : t('layout.subscriptionPlan.toggleExpand')"
          @click.stop="togglePlanPanel"
        >
          <div class="user-avatar-wrap">
            <UserAvatar
              :avatar-url="iamStore.user?.avatarUrl"
              :nombre="userProfile.nombre"
              :apellidos="userProfile.apellidos"
              :cache-key="iamStore.avatarVersion"
              size="sm"
            />
            <span class="user-status-dot" aria-hidden="true"></span>
          </div>
          <div class="user-info">
            <p class="user-name">{{ userProfile.nombre }} {{ userProfile.apellidos }}</p>
            <p class="user-role text-caption">{{ userProfile.especialidad || $t('layout.userRole') }}</p>
          </div>
          <i
            class="pi user-profile-chevron"
            :class="showPlanPanel ? 'pi-chevron-down' : 'pi-chevron-right'"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </aside>

    <div class="main-content">
      <header class="main-header">
        <div class="header-info">
          <template v-if="isAdminLayout">
            <p class="header-eyebrow">{{ adminShellEyebrow }}</p>
            <h2 class="header-title">{{ headerTitle }}</h2>
          </template>
          <template v-else>
            <h2 class="header-title">{{ headerTitle }}</h2>
            <p class="header-subtitle">{{ headerSubtitle }}</p>
          </template>
        </div>
        <div class="header-actions">
          <CurrencySwitcher v-if="isAdminLayout && !hasPageCurrencySwitcher" />
          <LanguageSwitcher :variant="isAdminLayout ? 'admin' : 'default'" />

          <button class="action-btn icon-btn" :title="$t('layout.notifications')">
            <i class="pi pi-bell"></i>
          </button>

          <button class="action-btn icon-btn" :title="t('layout.logout')" @click="handleLogout">
            <i class="pi pi-sign-out"></i>
          </button>
        </div>
      </header>

      <main class="page-container">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');

.layout-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100%;
}

/* ── Admin shell: aligned with BI backoffice views ── */
.layout--admin {
  --bi-ink: #0f172a;
  --bi-paper: #ffffff;
  --bi-bg: #eef2f6;
  --bi-teal: #0f766e;
  --bi-teal-light: #14b8a6;
  --bi-teal-soft: #ecfdf5;
  --bi-muted: #64748b;
  --bi-border: #e2e8f0;
  --bi-font-display: 'Fraunces', Georgia, serif;
  --bi-font-body: 'Inter', system-ui, sans-serif;
}

.layout--admin .sidebar {
  background-color: var(--bi-paper);
  border-right: 1px solid var(--bi-border);
}

.layout--admin .main-content {
  background-color: var(--bi-bg);
}

.layout--admin .main-header {
  height: 72px;
  background-color: var(--bi-paper);
  border-bottom: 1px solid var(--bi-border);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.layout--admin .icon-btn {
  border: 1px solid var(--bi-border);
  background: var(--bi-paper);
  color: var(--bi-muted);
}

.layout--admin .icon-btn:hover {
  background: var(--bi-bg);
  color: var(--bi-teal);
  border-color: color-mix(in srgb, var(--bi-teal) 25%, var(--bi-border));
}

.layout--admin .icon-btn:focus-visible {
  outline: 2px solid var(--bi-teal);
  outline-offset: 2px;
}

.layout--admin .header-actions {
  gap: 10px;
}

.layout--admin .header-actions :deep(.currency-switcher) {
  height: 40px;
  padding: 6px 14px;
  justify-content: center;
}

.sidebar {
  width: 260px;
  background-color: var(--color-background-sidebar);
  border-right: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  isolation: isolate;
}

.layout-wrapper:not(.layout--admin) .sidebar {
  background: linear-gradient(
    180deg,
    var(--color-background-sidebar) 0%,
    color-mix(in srgb, var(--color-primary-subtle) 28%, var(--color-background-sidebar)) 100%
  );
}

.layout-wrapper:not(.layout--admin) .sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: radial-gradient(
    color-mix(in srgb, var(--color-primary-main) 7%, transparent) 1px,
    transparent 1px
  );
  background-size: 22px 22px;
  mask-image: linear-gradient(180deg, black 0%, transparent 78%);
  opacity: 0.85;
}

.sidebar-brand {
  position: relative;
  z-index: 1;
  height: 80px;
  display: flex;
  align-items: center;
  padding: 0 20px;
  gap: 12px;
  color: var(--color-primary-main);
  border-bottom: 1px solid transparent;
}

.layout-wrapper:not(.layout--admin) .sidebar-brand {
  border-bottom-color: var(--color-border-light);
}

.layout--admin .sidebar-brand {
  height: 72px;
  border-bottom-color: var(--bi-border);
  color: var(--bi-ink);
}

.brand-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--bi-teal), #0d655e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1rem;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(15, 118, 110, 0.25);
}

.brand-mark--vet {
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  background: transparent;
  font-size: 1.125rem;
  box-shadow: none;
  overflow: hidden;
  flex-shrink: 0;
}

.brand-logo-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.brand-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.brand-eyebrow {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bi-teal);
  line-height: 1.2;
}

.brand-eyebrow--vet {
  color: var(--color-primary-main);
}

.brand-name {
  font-family: var(--bi-font-display);
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--bi-ink);
  line-height: 1.2;
}

.brand-name--vet {
  font-family: var(--font-family);
  font-size: var(--font-title-size);
  font-weight: var(--font-title-weight);
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.sidebar-nav {
  position: relative;
  z-index: 1;
  flex: 1;
  padding: var(--spacing-element-gap) 0;
  overflow-y: auto;
}

.layout-wrapper:not(.layout--admin) .sidebar-nav {
  padding: 12px 0 16px;
}

.layout--admin .sidebar-nav {
  flex: 0 1 auto;
  padding: 20px 0 16px;
}

.nav-section-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bi-muted);
  padding: 0 20px 10px;
  margin: 0;
}

.nav-section-label--vet {
  color: var(--color-text-muted);
  padding: 0 20px 12px;
}

.sidebar-nav ul {
  list-style: none;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 11px 16px;
  margin: 3px 12px;
  text-decoration: none;
  color: var(--color-text-secondary);
  border-radius: 10px;
  font-weight: var(--font-body-main-weight);
  font-size: 14px;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid transparent;
}

.nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.layout-wrapper:not(.layout--admin) .nav-icon-wrap {
  width: 34px;
  height: 34px;
  margin-right: 12px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--color-primary-subtle) 55%, transparent);
  transition: background-color 0.2s ease;
}

.layout--admin .nav-link {
  margin: 2px 10px;
  padding: 10px 14px;
  border-radius: 10px;
  border-left: none;
  color: var(--bi-muted);
  font-weight: 500;
}

.layout--admin .nav-icon-wrap {
  width: auto;
  height: auto;
  margin-right: 0;
  background: transparent;
  border-radius: 0;
}

.nav-link:hover {
  background-color: color-mix(in srgb, var(--color-primary-subtle) 45%, var(--color-background-sidebar));
  color: var(--color-text-primary);
}

.layout-wrapper:not(.layout--admin) .nav-link:hover .nav-icon-wrap {
  background: color-mix(in srgb, var(--color-primary-subtle) 85%, transparent);
}

.layout--admin .nav-link:hover {
  background-color: var(--bi-bg);
  color: var(--bi-ink);
}

.nav-link.active {
  background-color: #E0F2FE;
  color: var(--color-primary-main);
  border-left: 4px solid var(--color-primary-main);
  border-radius: 0 10px 10px 0;
  margin-left: 0;
  padding-left: 28px;
  font-weight: 600;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary-main) 12%, transparent);
}

.layout-wrapper:not(.layout--admin) .nav-link.active {
  border-left: none;
  margin-left: 12px;
  padding-left: 16px;
  border-radius: 10px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--color-primary-subtle) 90%, white) 0%,
    #E0F2FE 100%
  );
}

.layout-wrapper:not(.layout--admin) .nav-link.active .nav-icon-wrap {
  background: color-mix(in srgb, var(--color-primary-main) 14%, white);
}

.layout--admin .nav-link.active {
  background-color: var(--bi-teal-soft);
  color: var(--bi-teal);
  border-left: none;
  border-radius: 10px;
  margin-left: 10px;
  padding-left: 14px;
  font-weight: 600;
  box-shadow: none;
}

.layout--admin .nav-link.active .nav-icon {
  color: var(--bi-teal);
}

.nav-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.layout--admin .nav-icon {
  margin-right: 12px;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-user-profile {
  position: relative;
  z-index: 1;
  padding: var(--spacing-container-padding);
  border-top: 1px solid var(--color-border-light);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.layout-wrapper:not(.layout--admin) .sidebar-user-profile {
  padding: 12px;
  border-top: none;
  margin-top: auto;
}

.subscription-plan-card {
  position: relative;
  padding: 14px 14px 12px;
  border-radius: 14px;
  background: var(--color-background-surface);
  border: 1px solid color-mix(in srgb, var(--color-primary-main) 18%, var(--color-border-light));
  box-shadow:
    var(--shadow-card),
    0 8px 24px color-mix(in srgb, var(--color-primary-main) 8%, transparent);
  overflow: hidden;
}

.plan-card-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(
    90deg,
    var(--color-primary-main) 0%,
    var(--color-status-success-indicator) 100%
  );
}

.plan-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.plan-card-heading {
  min-width: 0;
}

.plan-card-eyebrow {
  margin: 0 0 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary-main);
}

.plan-card-title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  line-height: 1.2;
}

.plan-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: var(--radius-full);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--color-status-success-text);
  background: var(--color-status-success-bg);
  border: 1px solid color-mix(in srgb, var(--color-status-success-indicator) 24%, transparent);
}

.plan-status-badge .pi {
  font-size: 11px;
}

.plan-card-description {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--color-text-secondary);
}

.plan-feature-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-feature-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  line-height: 1.35;
  color: var(--color-text-primary);
}

.plan-feature-icon {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-primary-subtle);
  color: var(--color-primary-main);
  font-size: 10px;
}

.plan-card-meta {
  padding: 10px 0 0;
  border-top: 1px solid var(--color-border-light);
}

.plan-card-meta--footer {
  margin-bottom: 0;
}

.plan-renewal {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.plan-billing {
  margin: 4px 0 0;
  font-size: 11px;
  color: var(--color-text-muted);
}

.plan-panel-enter-active,
.plan-panel-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.plan-panel-enter-from,
.plan-panel-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.user-profile-card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
  text-align: left;
  font: inherit;
  color: inherit;
}

.layout-wrapper:not(.layout--admin) .user-profile-card {
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-background-surface);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.layout-wrapper:not(.layout--admin) .user-profile-card:hover,
.layout-wrapper:not(.layout--admin) .user-profile-card[aria-expanded='true'] {
  border-color: color-mix(in srgb, var(--color-primary-main) 22%, var(--color-border-light));
  box-shadow:
    var(--shadow-card),
    0 4px 14px color-mix(in srgb, var(--color-primary-main) 10%, transparent);
  background: linear-gradient(
    135deg,
    var(--color-background-surface) 0%,
    color-mix(in srgb, var(--color-primary-subtle) 35%, var(--color-background-surface)) 100%
  );
}

.user-avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.user-status-dot {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--color-status-success-indicator);
  border: 2px solid var(--color-background-surface);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--color-status-success-indicator) 30%, transparent);
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-profile-chevron {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-text-muted);
  transition: color 0.2s ease, transform 0.2s ease;
}

.layout-wrapper:not(.layout--admin) .user-profile-card:hover .user-profile-chevron,
.layout-wrapper:not(.layout--admin) .user-profile-card[aria-expanded='true'] .user-profile-chevron {
  color: var(--color-primary-main);
}

.layout-wrapper:not(.layout--admin) .user-profile-card:hover .pi-chevron-right {
  transform: translateX(2px);
}

.user-name {
  font-size: var(--font-body-main-size);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  margin: 2px 0 0;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-main);
  overflow-y: auto;
  min-width: 0;
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
  gap: 16px;
}

.header-info {
  min-width: 0;
}

.header-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bi-teal);
  margin: 0 0 4px;
  line-height: 1.2;
}

.layout--admin .header-eyebrow {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.01em;
  text-transform: none;
  color: var(--bi-muted);
}

.header-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.25;
}

.layout--admin .header-title {
  font-family: var(--bi-font-display);
  font-size: clamp(1.125rem, 1.8vw, 1.375rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--bi-ink);
}

.header-subtitle {
  margin: 4px 0 0;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.3;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.layout--admin .icon-btn {
  border-radius: 10px;
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

.layout--admin .page-container {
  flex: 0 1 auto;
  padding: 24px;
  min-height: 0;
}

@media (prefers-reduced-motion: reduce) {
  .nav-link,
  .icon-btn,
  .user-profile-card,
  .user-profile-chevron,
  .plan-panel-enter-active,
  .plan-panel-leave-active {
    transition: none;
  }

  .plan-panel-enter-from,
  .plan-panel-leave-to {
    transform: none;
  }

  .layout-wrapper:not(.layout--admin) .user-profile-card:hover .pi-chevron-right {
    transform: none;
  }
}
</style>
