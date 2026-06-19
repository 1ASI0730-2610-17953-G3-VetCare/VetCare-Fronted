export class PerfilEntity {
  constructor(data) {
    this.id = data.id || null;
    this.avatarUrl = data.avatarUrl || null;
    
    const personal = data.datosPersonales || {};
    this.nombre = personal.nombre || '';
    this.apellidos = personal.apellidos || '';
    this.correoElectronico = personal.correoElectronico || '';
    this.telefono = personal.telefono || '';
    this.especialidad = personal.especialidad || '';
    this.dni = personal.dni || '';
    
    const pref = data.preferencias || {};
    this.notificacionesEmail = pref.notificacionesEmail ?? false;
    this.notificacionesPush = pref.notificacionesPush ?? false;
    this.recordatoriosCitas = pref.recordatoriosCitas ?? false;
    this.modoOscuro = pref.modoOscuro ?? false;
    this.sonidosSistema = pref.sonidosSistema ?? false;
    
    const act = data.actividad || {};
    this.citasEsteMes = act.citasEsteMes ?? 0;
    this.pacientesAtendidos = act.pacientesAtendidos ?? 0;
    this.metaMensualPorcentaje = act.metaMensualPorcentaje ?? 0;
  }
}
