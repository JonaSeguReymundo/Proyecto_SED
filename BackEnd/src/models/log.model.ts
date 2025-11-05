export interface LogEntry {
  _id: string;
  userId: string;
  username: string;
  action: string;        // Descripción de lo que hizo
  method: string;        // GET, POST, PUT, DELETE
  endpoint: string;      // Ej: /cars, /bookings/:id
  timestamp: string;     // Fecha del evento
}
