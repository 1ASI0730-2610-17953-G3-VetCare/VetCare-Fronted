import PerfilView from './views/perfil-view.component.vue';

export const perfilRoutes = [
  {
    path: '/perfil',
    name: 'perfil',
    component: PerfilView,
    meta: { roles: ['veterinario'] }
  }
];
