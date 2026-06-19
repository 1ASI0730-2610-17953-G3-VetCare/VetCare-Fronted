export const agendaRoutes = [
  {
    path: '/agenda',
    name: 'agenda-view',
    component: () => import('./views/agenda-view.component.vue'),
    meta: { title: 'Agenda Veterinaria', roles: ['veterinario'] }
  }
];
