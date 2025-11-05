import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { randomUUID } from "crypto";
import { Car } from "../models/car.model";
import { saveLog } from "../utils/logger";
import { handleError } from "../middleware/error.middleware";
import { AuthUser } from "../middleware/auth.middleware";

// --- GET /cars (visible para todos los usuarios autenticados)
export async function getCars(req: IncomingMessage, res: ServerResponse, user: AuthUser) {
  try {
    const db = getDB();
    const cars = await db.collection<Car>("cars").find().toArray();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(cars));

    await saveLog({
      userId: user._id,
      username: user.username,
      action: "Consultó la lista de autos",
      method: "GET",
      endpoint: "/cars",
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al obtener los autos");
  }
}

// --- POST /cars (solo admin o superadmin)
export async function createCar(
  req: IncomingMessage,
  res: ServerResponse,
  user: AuthUser,
  body: any
) {
  try {
    const db = getDB();

    if (Array.isArray(body)) {
      const cars = body.map((item) => {
        const { brand, model, type, pricePerDay } = item;
        if (!brand || !model || !type || !pricePerDay) {
          throw new Error("Faltan campos obligatorios en uno de los autos");
        }
        return {
          _id: randomUUID(),
          brand,
          model,
          type,
          available: true,
          pricePerDay,
          createdBy: user._id,
        };
      });

      await db.collection<Car>("cars").insertMany(cars);
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: `${cars.length} autos creados correctamente`, cars }));

      await saveLog({
        userId: user._id,
        username: user.username,
        action: `Creó ${cars.length} autos`,
        method: "POST",
        endpoint: "/cars",
      });
      return;
    }

    const { brand, model, type, pricePerDay } = body;
    if (!brand || !model || !type || !pricePerDay) {
      return handleError(res, 400, "Faltan campos obligatorios");
    }

    const car: Car = {
      _id: randomUUID(),
      brand,
      model,
      type,
      available: true,
      pricePerDay,
      createdBy: user._id,
    };

    await db.collection<Car>("cars").insertOne(car);
    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Auto creado correctamente", car }));

    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Creó un auto (${brand} ${model})`,
      method: "POST",
      endpoint: "/cars",
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al crear el auto");
  }
}

// --- PUT /cars/:id (solo admin o superadmin)
export async function updateCar(
  req: IncomingMessage,
  res: ServerResponse,
  user: AuthUser,
  body: any
) {
  try {
    const id = req.url?.split("/")[2];
    if (!id) return handleError(res, 400, "ID no proporcionado");

    const db = getDB();
    const car = await db.collection<Car>("cars").findOne({ _id: id });
    if (!car) return handleError(res, 404, "Auto no encontrado");

    if (user.role !== "superadmin" && car.createdBy !== user._id) {
      return handleError(res, 403, "No tienes permiso para modificar este auto");
    }

    await db.collection<Car>("cars").updateOne({ _id: id }, { $set: body });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Auto actualizado correctamente" }));

    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Actualizó el auto con ID ${id}`,
      method: "PUT",
      endpoint: `/cars/${id}`,
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al actualizar el auto");
  }
}

// --- DELETE /cars/:id (solo admin o superadmin)
export async function deleteCar(req: IncomingMessage, res: ServerResponse, user: AuthUser) {
  try {
    const id = req.url?.split("/")[2];
    if (!id) return handleError(res, 400, "ID no proporcionado");

    const db = getDB();
    const car = await db.collection<Car>("cars").findOne({ _id: id });
    if (!car) return handleError(res, 404, "Auto no encontrado");

    if (user.role !== "superadmin" && car.createdBy !== user._id) {
      return handleError(res, 403, "No tienes permiso para eliminar este auto");
    }

    await db.collection<Car>("cars").deleteOne({ _id: id });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Auto eliminado correctamente" }));

    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Eliminó el auto con ID ${id}`,
      method: "DELETE",
      endpoint: `/cars/${id}`,
    });
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al eliminar el auto");
  }
}
