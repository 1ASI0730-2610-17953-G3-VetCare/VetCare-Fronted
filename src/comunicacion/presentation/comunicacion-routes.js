export const comunicacionRoutes = [
  {
    path: '/comunicacion',
    name: 'comunicacion',
    component: () => import('./views/comunicacion-view.component.vue'),
    meta: { roles: ['veterinario'] }
  }
];
