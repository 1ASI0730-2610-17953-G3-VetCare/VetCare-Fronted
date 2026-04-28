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
    image
  }) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.species = species;
    this.status = status;
    this.age = age;
    this.weight = weight;
    this.owner = owner;
    this.image = image;
  }
}
