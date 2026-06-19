export class Cita {
  constructor(id, patientName, ownerName, date, timeStart, timeEnd, status, type) {
    this.id = id;
    this.patientName = patientName;
    this.ownerName = ownerName;
    this.date = date;
    this.timeStart = timeStart;
    this.timeEnd = timeEnd;
    this.status = status;
    this.type = type;
  }
}
