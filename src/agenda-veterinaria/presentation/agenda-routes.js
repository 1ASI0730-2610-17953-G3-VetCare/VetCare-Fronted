import AgendaView from './views/agenda-view.component.vue';

export const agendaRoutes = [
  {
    path: '/agenda',
    name: 'agenda-view',
    component: AgendaView,
    meta: { title: 'Agenda Veterinaria' }
  }
];
