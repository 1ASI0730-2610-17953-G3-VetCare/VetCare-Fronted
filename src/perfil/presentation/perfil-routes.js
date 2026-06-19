export const perfilRoutes = [
  {
    path: '/perfil',
    name: 'perfil',
    component: () => import('./views/perfil-view.component.vue'),
    meta: { roles: ['veterinario'] }
  }
];
