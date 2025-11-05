export interface Car {
  _id: string;
  brand: string;         // marca del auto
  model: string;         // modelo del auto
  type: string;          // tipo de carro 
  available: boolean;    // si está disponible para reserva
  pricePerDay: number;   // precio por día
  createdBy: string;     // id del admin que lo creó
}