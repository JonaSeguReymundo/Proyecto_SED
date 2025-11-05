export interface Booking {
  _id: string;
  userId: string;        // quién reservó
  carId: string;         // id del auto reservado
  startDate: string;     // fecha inicio
  endDate: string;       // fecha fin
  totalPrice: number;    // precio total
  createdAt: string;     // fecha de creación
}
