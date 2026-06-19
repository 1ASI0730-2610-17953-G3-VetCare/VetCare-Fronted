export class DirectMessageEntity {
    constructor(data) {
        this.id = data.id;
        this.clientId = data.clientId;
        this.veterinarianId = data.veterinarianId;
        this.channel = data.channel || 'WhatsApp';
        this.content = data.content || '';
        this.sentAt = data.sentAt ? new Date(data.sentAt) : new Date();
        this.status = data.status || 'Sent';
    }
}
