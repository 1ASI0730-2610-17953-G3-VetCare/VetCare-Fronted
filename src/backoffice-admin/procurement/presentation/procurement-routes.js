export const procurementRoutes = [
  {
    path: 'procurement',
    name: 'admin-procurement',
    component: () => import('./views/procurement-view.component.vue'),
    meta: { title: 'Compras y Proveedores' }
  }
];
