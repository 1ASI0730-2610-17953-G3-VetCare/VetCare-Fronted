import GestionClinicaLayout from './components/gestion-clinica-layout.component.vue';
import PacientesView from './views/pacientes-view.component.vue';
import ClientesView from './views/clientes-view.component.vue';
import ConsultasView from './views/consultas-view.component.vue';
import HistorialView from './views/historial-view.component.vue';
import VacunasView from './views/vacunas-view.component.vue';
import HospitalizacionView from './views/hospitalizacion-view.component.vue';

export const gestionClinicaRoutes = [
  {
    path: '/gestion-clinica',
    component: GestionClinicaLayout,
    meta: { roles: ['veterinario'] },
    children: [
      {
        path: '',
        redirect: '/gestion-clinica/pacientes'
      },
      {
        path: 'pacientes',
        name: 'gestion-clinica-pacientes',
        component: PacientesView
      },
      {
        path: 'clientes',
        name: 'gestion-clinica-clientes',
        component: ClientesView
      },
      {
        path: 'consultas',
        name: 'gestion-clinica-consultas',
        component: ConsultasView
      },
      {
        path: 'historial',
        name: 'gestion-clinica-historial',
        component: HistorialView
      },
      {
        path: 'vacunas',
        name: 'gestion-clinica-vacunas',
        component: VacunasView
      },
      {
        path: 'hospitalizacion',
        name: 'gestion-clinica-hospitalizacion',
        component: HospitalizacionView
      }
    ]
  }
];
