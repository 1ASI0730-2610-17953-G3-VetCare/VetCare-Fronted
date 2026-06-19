export class Entry {
  constructor({ id, type, category, amount, date, description }) {
    this.id = id;
    this.type = type;
    this.category = category;
    this.amount = amount;
    this.date = date;
    this.description = description;
  }
}
