/**
 * Cita Entity
 * 
 * Represents a veterinary appointment.
 */
export class Cita {
  constructor(id, patientName, ownerName, date, timeStart, timeEnd, status, type) {
    this.id = id;
    this.patientName = patientName;
    this.ownerName = ownerName;
    this.date = date; // format "YYYY-MM-DD"
    this.timeStart = timeStart; // format "HH:mm"
    this.timeEnd = timeEnd; // format "HH:mm"
    this.status = status; // "Pendiente", "Confirmada", "Completada"
    this.type = type;
  }
}
