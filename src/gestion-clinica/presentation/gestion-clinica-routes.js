export const gestionClinicaRoutes = [
  {
    path: '/gestion-clinica',
    name: 'gestion-clinica',
    component: () => import('./components/gestion-clinica-layout.component.vue'),
    meta: { roles: ['veterinario'] },
    children: [
      {
        path: '',
        redirect: '/gestion-clinica/pacientes'
      },
      {
        path: 'pacientes',
        name: 'gestion-clinica-pacientes',
        component: () => import('./views/pacientes-view.component.vue')
      },
      {
        path: 'clientes',
        name: 'gestion-clinica-clientes',
        component: () => import('./views/clientes-view.component.vue')
      },
      {
        path: 'consultas',
        name: 'gestion-clinica-consultas',
        component: () => import('./views/consultas-view.component.vue')
      },
      {
        path: 'historial',
        name: 'gestion-clinica-historial',
        component: () => import('./views/historial-view.component.vue')
      },
      {
        path: 'vacunas',
        name: 'gestion-clinica-vacunas',
        component: () => import('./views/vacunas-view.component.vue')
      },
      {
        path: 'hospitalizacion',
        name: 'gestion-clinica-hospitalizacion',
        component: () => import('./views/hospitalizacion-view.component.vue')
      }
    ]
  }
];
