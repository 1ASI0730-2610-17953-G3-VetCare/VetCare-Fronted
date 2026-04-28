import { createRouter, createWebHistory } from 'vue-router';
import { agendaRoutes } from './agenda-veterinaria/presentation/agenda-routes.js';
import { perfilRoutes } from './perfil/presentation/perfil-routes.js';
import { comunicacionRoutes } from './comunicacion/presentation/comunicacion-routes.js';

import DashboardView from './panel-resumen/presentation/views/dashboard-view.component.vue';

const routes = [
  ...agendaRoutes,
  ...perfilRoutes,
  ...comunicacionRoutes,
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView
  },
  {
    path: '/',
    redirect: '/agenda'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
