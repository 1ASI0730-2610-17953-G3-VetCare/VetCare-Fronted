import { Cita } from '../domain/model/cita.entity.js';

export class CitaAssembler {
  static toEntityFromResource(resource) {
    return new Cita(
      resource.id,
      resource.patientName,
      resource.ownerName,
      resource.date,
      resource.timeStart,
      resource.timeEnd,
      resource.status,
      resource.type
    );
  }

  static toEntitiesFromResources(resources) {
    return resources.map(resource => this.toEntityFromResource(resource));
  }
}
