export class Product {
  constructor({ id, code, name, category, stock, minStock, price, status }) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.category = category;
    this.stock = stock;
    this.minStock = minStock;
    this.price = price;
    this.status = status;
  }
}
