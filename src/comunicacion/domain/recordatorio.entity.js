export class RecordatorioEntity {
  constructor(data) {
    this.id = data.id || null;
    this.type = data.type || 'info';
    this.title = data.title || '';
    this.description = data.description || '';
    this.metadata = data.metadata || '';
    this.status = data.status || '';
  }
}
