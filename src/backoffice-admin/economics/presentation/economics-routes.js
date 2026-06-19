export const economicsRoutes = [
  {
    path: 'economics',
    name: 'admin-economics',
    component: () => import('./views/economics-view.component.vue'),
    meta: { title: 'Económico' }
  }
];
