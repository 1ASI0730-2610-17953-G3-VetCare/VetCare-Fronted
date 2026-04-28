import { Cita } from '../domain/model/cita.entity.js';

export class CitaAssembler {
  /**
   * Translates a resource JSON from the API into a Cita entity.
   */
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

  /**
   * Translates an array of resources into an array of Cita entities.
   */
  static toEntitiesFromResources(resources) {
    return resources.map(resource => this.toEntityFromResource(resource));
  }
}
