export class NotificacionEntity {
  constructor(data) {
    this.id = data.id || null;
    this.type = data.type || 'info';
    this.title = data.title || '';
    this.description = data.description || '';
    this.metadata = data.metadata || '';
    this.status = data.status || '';
    this.timestamp = data.timestamp || '';
    this.is_read = data.is_read || false;
    this.priority = data.priority || 'normal';
  }
}
