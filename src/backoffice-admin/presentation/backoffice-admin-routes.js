import { inventoryRoutes } from '../inventory/presentation/inventory-routes.js';
import { procurementRoutes } from '../procurement/presentation/procurement-routes.js';
import { economicsRoutes } from '../economics/presentation/economics-routes.js';

export const backofficeAdminRoutes = [
  {
    path: '/admin',
    meta: { requiresAuth: true, roles: ['admin'] },
    children: [
      {
        path: '',
        redirect: '/admin/inventory'
      },
      ...inventoryRoutes,
      ...procurementRoutes,
      ...economicsRoutes
    ]
  }
];
