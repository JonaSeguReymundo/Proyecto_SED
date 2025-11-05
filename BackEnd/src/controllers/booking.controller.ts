import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { randomUUID } from "crypto";
import { Booking } from "../models/booking.model";
import { Car } from "../models/car.model";
import { saveLog } from "../utils/logger";
import { handleError } from "../middleware/error.middleware";
import { AuthUser } from "../middleware/auth.middleware";

// --- POST /bookings ---
export async function createBooking(
  req: IncomingMessage,
  res: ServerResponse,
  user: AuthUser,
  body: any
) {
  try {
    const bookingsData = Array.isArray(body) ? body : [body];

    const db = getDB();
    const createdBookings = [];

    for (const data of bookingsData) {
      const { carId, startDate, endDate } = data;
      if (!carId || !startDate || !endDate) {
        return handleError(res, 400, "Faltan datos obligatorios en una reserva");
      }

      const car = await db.collection<Car>("cars").findOne({ _id: carId });
      if (!car) return handleError(res, 404, `Auto con ID ${carId} no encontrado`);
      if (!car.available)
        return handleError(res, 409, `El auto ${car.brand} ${car.model} no está disponible`);

      const days =
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      if (days <= 0) return handleError(res, 400, "Fechas inválidas en una reserva");

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
      await db
        .collection<Car>("cars")
        .updateOne({ _id: carId }, { $set: { available: false } });
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

    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Creó ${createdBookings.length > 1 ? createdBookings.length + " reservas" : "una reserva"}`,
      method: "POST",
      endpoint: "/bookings",
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al crear la reserva");
  }
}

// --- GET /bookings ---
export async function getMyBookings(req: IncomingMessage, res: ServerResponse, user: AuthUser) {
  try {
    const db = getDB();
    const bookings = await db
      .collection<Booking>("bookings")
      .find({ userId: user._id })
      .toArray();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(bookings));

    await saveLog({
      userId: user._id,
      username: user.username,
      action: "Consultó sus reservas personales",
      method: "GET",
      endpoint: "/bookings",
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al obtener las reservas");
  }
}

// --- GET /bookings/all ---
export async function getAllBookings(req: IncomingMessage, res: ServerResponse, user: AuthUser) {
  try {
    const db = getDB();
    const bookings = await db.collection<Booking>("bookings").find().toArray();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(bookings));

    await saveLog({
      userId: user._id,
      username: user.username,
      action: "Consultó todas las reservas del sistema",
      method: "GET",
      endpoint: "/bookings/all",
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al obtener todas las reservas");
  }
}

// --- DELETE /bookings/:id ---
export async function cancelBooking(req: IncomingMessage, res: ServerResponse, user: AuthUser) {
  try {
    const id = req.url?.split("/")[2];
    if (!id) return handleError(res, 400, "ID no proporcionado");

    const db = getDB();
    const booking = await db.collection<Booking>("bookings").findOne({ _id: id });
    if (!booking) return handleError(res, 404, "Reserva no encontrada");

    if (booking.userId !== user._id && !["admin", "superadmin"].includes(user.role)) {
      return handleError(res, 403, "No tienes permiso para cancelar esta reserva");
    }

    await db.collection<Booking>("bookings").deleteOne({ _id: id });
    await db
      .collection<Car>("cars")
      .updateOne({ _id: booking.carId }, { $set: { available: true } });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Reserva cancelada correctamente" }));

    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Canceló la reserva con ID ${id}`,
      method: "DELETE",
      endpoint: `/bookings/${id}`,
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al cancelar la reserva");
  }
}

// --- PUT /bookings/:id ---
export async function updateBooking(
  req: IncomingMessage,
  res: ServerResponse,
  user: AuthUser,
  body: any
) {
  try {
    const id = req.url?.split("/")[2];
    if (!id) return handleError(res, 400, "ID no proporcionado");

    const { startDate, endDate } = body;
    if (!startDate || !endDate) return handleError(res, 400, "Faltan fechas");

    const db = getDB();
    const booking = await db.collection<Booking>("bookings").findOne({ _id: id });
    if (!booking) return handleError(res, 404, "Reserva no encontrada");

    if (booking.userId !== user._id && !["admin", "superadmin"].includes(user.role)) {
      return handleError(res, 403, "No tienes permiso para modificar esta reserva");
    }

    const car = await db.collection<Car>("cars").findOne({ _id: booking.carId });
    if (!car) return handleError(res, 404, "Auto asociado no encontrado");

    const days =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);
    if (days <= 0) return handleError(res, 400, "Las fechas no son válidas");

    const totalPrice = days * car.pricePerDay;

    await db
      .collection<Booking>("bookings")
      .updateOne({ _id: id }, { $set: { startDate, endDate, totalPrice } });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Reserva actualizada correctamente", totalPrice }));

    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Actualizó la reserva con ID ${id}`,
      method: "PUT",
      endpoint: `/bookings/${id}`,
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al actualizar la reserva");
  }
}
