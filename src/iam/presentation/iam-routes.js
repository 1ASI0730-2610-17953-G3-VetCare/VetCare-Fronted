export const iamRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('./views/login-view.component.vue'),
    meta: { requiresAuth: false }
  }
];
