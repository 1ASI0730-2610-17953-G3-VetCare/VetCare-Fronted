import EconomicsView from './views/economics-view.component.vue';

export const economicsRoutes = [
  {
    path: 'economics',
    name: 'admin-economics',
    component: EconomicsView,
    meta: { title: 'Económico' }
  }
];
