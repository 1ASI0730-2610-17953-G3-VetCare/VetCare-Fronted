import InventoryView from './views/inventory-view.component.vue';

export const inventoryRoutes = [
  {
    path: 'inventory',
    name: 'admin-inventory',
    component: InventoryView,
    meta: { title: 'Inventario' }
  }
];
