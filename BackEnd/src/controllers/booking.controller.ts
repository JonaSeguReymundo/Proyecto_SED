import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { randomUUID } from "crypto";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { Booking } from "../models/booking.model";
import { Car } from "../models/car.model";
import { saveLog } from "../utils/logger";

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
  });
}

// --- POST /bookings ---
export async function createBooking(req: IncomingMessage, res: ServerResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  try {
    const body = await parseBody(req);
    const bookingsData = Array.isArray(body) ? body : [body]; // soporta array o un objeto

    const db = getDB();
    const createdBookings = [];

    for (const data of bookingsData) {
      const { carId, startDate, endDate } = data;
      if (!carId || !startDate || !endDate) {
        throw new Error("Faltan datos obligatorios en una reserva");
      }

      const car = await db.collection<Car>("cars").findOne({ _id: carId });
      if (!car) throw new Error(`Auto con ID ${carId} no encontrado`);
      if (!car.available) throw new Error(`El auto ${car.brand} ${car.model} no está disponible`);

      const days =
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24);

      if (days <= 0) throw new Error("Fechas inválidas en una reserva");

      const totalPrice = days * car.pricePerDay;

      const booking: Booking = {
        _id: randomUUID(),
        userId: user._id,
        carId,
        startDate,
        endDate,
        totalPrice,
        createdAt: new Date().toISOString(),
      };

      await db.collection<Booking>("bookings").insertOne(booking);
      await db.collection<Car>("cars").updateOne({ _id: carId }, { $set: { available: false } });
      createdBookings.push(booking);
    }

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message:
          createdBookings.length > 1
            ? "Reservas creadas correctamente"
            : "Reserva creada correctamente",
        count: createdBookings.length,
        bookings: createdBookings,
      })
    );

    // Log: registro de creación
    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Creó ${createdBookings.length > 1 ? createdBookings.length + " reservas" : "una reserva"}`,
      method: "POST",
      endpoint: "/bookings",
    });
  } catch (err: any) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: err.message || "Error al crear reservas" }));
  }
}
	

// --- GET /bookings ---
export async function getMyBookings(req: IncomingMessage, res: ServerResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getDB();
  const bookings = await db.collection<Booking>("bookings").find({ userId: user._id }).toArray();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(bookings));

  //Log
    await saveLog({
      userId: user._id,
      username: user.username,
      action: "Consultó sus reservas personales",
      method: "GET",
      endpoint: "/bookings",
    });
}

// --- GET /bookings/all (solo admin o superadmin) ---
export async function getAllBookings(req: IncomingMessage, res: ServerResponse) {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;

  const db = getDB();
  const bookings = await db.collection<Booking>("bookings").find().toArray();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(bookings));

  //Log
    await saveLog({
      userId: user._id,
      username: user.username,
      action: "Consultó todas las reservas del sistema",
      method: "GET",
      endpoint: "/bookings/all",
    });
}

// --- DELETE /bookings/:id ---
export async function cancelBooking(req: IncomingMessage, res: ServerResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const id = req.url?.split("/")[2];
  if (!id) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ID no proporcionado" }));
    return;
  }

  const db = getDB();
  const booking = await db.collection<Booking>("bookings").findOne({ _id: id });

  if (!booking) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Reserva no encontrada" }));
    return;
  }

  // Solo puede cancelar quien la creó o un admin/superadmin
  if (
    booking.userId !== user._id &&
    !["admin", "superadmin"].includes(user.role)
  ) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No tienes permiso para cancelar esta reserva" }));
    return;
  }

  await db.collection<Booking>("bookings").deleteOne({ _id: id });
  await db.collection<Car>("cars").updateOne({ _id: booking.carId }, { $set: { available: true } });

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Reserva cancelada correctamente" }));

  // Log de cancelación
  await saveLog({
    userId: user._id,
    username: user.username,
    action: `Canceló la reserva con ID ${id}`,
    method: "DELETE",
    endpoint: `/bookings/${id}`,
  });
}

// --- PUT /bookings/:id ---
export async function updateBooking(req: IncomingMessage, res: ServerResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const id = req.url?.split("/")[2];
  if (!id) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ID no proporcionado" }));
    return;
  }

  try {
    const body = await parseBody(req);
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Faltan fechas" }));
      return;
    }

    const db = getDB();
    const booking = await db.collection<Booking>("bookings").findOne({ _id: id });

    if (!booking) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Reserva no encontrada" }));
      return;
    }

    // Solo el creador o admin/superadmin pueden modificar
    if (
      booking.userId !== user._id &&
      !["admin", "superadmin"].includes(user.role)
    ) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No tienes permiso para modificar esta reserva" }));
      return;
    }

    const car = await db.collection<Car>("cars").findOne({ _id: booking.carId });
    if (!car) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Auto asociado no encontrado" }));
      return;
    }

    const days =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (days <= 0) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Las fechas no son válidas" }));
      return;
    }

    const totalPrice = days * car.pricePerDay;

    await db.collection<Booking>("bookings").updateOne(
      { _id: id },
      { $set: { startDate, endDate, totalPrice } }
    );

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Reserva actualizada correctamente", totalPrice }));

    // Log de modificación
    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Actualizó la reserva con ID ${id}`,
      method: "PUT",
      endpoint: `/bookings/${id}`,
    });

  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error al actualizar la reserva" }));
  }
}
	
