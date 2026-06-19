import { resolvePatientImage } from '../../infrastructure/patient-image.utils.js';

function mapSpecies(species) {
  if (species == null) return '';
  if (typeof species === 'object') {
    return species.name ?? species.Name ?? '';
  }
  return String(species);
}

function mapWeight(weight) {
  if (weight == null) return '';
  if (typeof weight === 'object') {
    const value = weight.value ?? weight.Value;
    const unit = weight.unit ?? weight.Unit ?? 'kg';
    return value != null ? `${value} ${unit}` : '';
  }
  return String(weight);
}

export class Patient {
  constructor({
    id,
    code,
    name,
    species,
    status,
    age,
    weight,
    owner,
    ownerId = null,
    image,
    allergies = null
  }) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.species = species;
    this.status = status;
    this.age = age;
    this.weight = weight;
    this.owner = owner ?? '';
    this.ownerId = ownerId;
    this.image = image;
    this.allergies = allergies;
  }

  static fromApi(data, clientsById = {}) {
    const ownerId = data.ownerId ?? data.OwnerId ?? null;
    const owner = clientsById[ownerId] ?? data.owner ?? '';

    return new Patient({
      id: data.id,
      code: data.code,
      name: data.name,
      species: mapSpecies(data.species ?? data.Species),
      status: data.status,
      age: data.age,
      weight: mapWeight(data.weight ?? data.Weight),
      owner,
      ownerId,
      image: resolvePatientImage({
        id: data.id,
        image: data.image ?? data.Image ?? null,
        species: mapSpecies(data.species ?? data.Species),
        name: data.name ?? data.Name ?? ''
      }),
      allergies: data.allergies ?? null
    });
  }
}
