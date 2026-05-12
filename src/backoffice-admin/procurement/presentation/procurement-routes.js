import ProcurementView from './views/procurement-view.component.vue';

export const procurementRoutes = [
  {
    path: 'procurement',
    name: 'admin-procurement',
    component: ProcurementView,
    meta: { title: 'Compras y Proveedores' }
  }
];
