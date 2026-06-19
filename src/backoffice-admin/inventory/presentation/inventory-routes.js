export const inventoryRoutes = [
  {
    path: 'inventory',
    name: 'admin-inventory',
    component: () => import('./views/inventory-view.component.vue'),
    meta: { title: 'Inventario' }
  }
];
