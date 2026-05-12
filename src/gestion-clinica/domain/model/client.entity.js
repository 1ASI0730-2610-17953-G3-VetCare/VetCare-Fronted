export class Client {
  constructor({ id, code, fullName, documentId, phone, email, address, status, petsCount, lastVisitAt }) {
    this.id = id;
    this.code = code || '';
    this.fullName = fullName || '';
    this.documentId = documentId || '';
    this.phone = phone || '';
    this.email = email || '';
    this.address = address || '';
    this.status = status || 'Activo'; // Activo, Inactivo
    this.petsCount = petsCount || 0;
    this.lastVisitAt = lastVisitAt || null;
  }
}
