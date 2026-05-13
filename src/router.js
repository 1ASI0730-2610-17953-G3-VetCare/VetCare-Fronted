import { createRouter, createWebHistory } from 'vue-router';
import { agendaRoutes } from './agenda-veterinaria/presentation/agenda-routes.js';
import { perfilRoutes } from './perfil/presentation/perfil-routes.js';
import { comunicacionRoutes } from './comunicacion/presentation/comunicacion-routes.js';
import { gestionClinicaRoutes } from './gestion-clinica/presentation/gestion-clinica-routes.js';
import { backofficeAdminRoutes } from './backoffice-admin/presentation/backoffice-admin-routes.js';
import { iamRoutes } from './iam/presentation/iam-routes.js';
import { authGuard } from './iam/presentation/guards/auth.guard.js';

import DashboardView from './panel-resumen/presentation/views/dashboard-view.component.vue';

const routes = [
  ...iamRoutes,
  ...agendaRoutes,
  ...perfilRoutes,
  ...comunicacionRoutes,
  ...gestionClinicaRoutes,
  ...backofficeAdminRoutes,
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, roles: ['veterinario'] }
  },
  {
    path: '/',
    redirect: to => {
      return '/dashboard';
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  authGuard(to, from, next);
});

export default router;
