import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { randomUUID } from "crypto";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { Car } from "../models/car.model";
import { saveLog } from "../utils/logger";

// Helper para leer body JSON
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

// --- GET /cars (visible para todos los usuarios autenticados)
export async function getCars(req: IncomingMessage, res: ServerResponse) {
  const user = await requireAuth(req, res);
  if (!user) return;

  const db = getDB();
  const cars = await db.collection<Car>("cars").find().toArray();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(cars));

  // Log
  await saveLog({
    userId: user._id,
    username: user.username,
    action: "Consultó la lista de autos",
    method: "GET",
    endpoint: "/cars",
  });

}

// --- POST /cars (solo admin o superadmin)
export async function createCar(req: IncomingMessage, res: ServerResponse) {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;

  try {
    const body = await parseBody(req);
    const db = getDB();

    // Si es un array de autos
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
          createdBy: user._id
        };
      });

      await db.collection<Car>("cars").insertMany(cars);

      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: `${cars.length} autos creados correctamente`, cars }));

      // Log de creación
      await saveLog({
        userId: user._id,
        username: user.username,
        action: `Creó ${cars.length} autos`,
        method: "POST",
        endpoint: "/cars",
      });

      return;
    }

    // Si es un solo objeto
    const { brand, model, type, pricePerDay } = body;
    if (!brand || !model || !type || !pricePerDay) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Faltan campos obligatorios" }));
      return;
    }

    const car: Car = {
      _id: randomUUID(),
      brand,
      model,
      type,
      available: true,
      pricePerDay,
      createdBy: user._id
    };

    await db.collection<Car>("cars").insertOne(car);

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Auto creado correctamente", car }));

    // Log de creación
    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Creó un auto (${brand} ${model})`,
      method: "POST",
      endpoint: "/cars",
    });

  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: (err as Error).message || "Error al crear el auto" }));
  }

  
}


// --- PUT /cars/:id (solo admin o superadmin)
export async function updateCar(req: IncomingMessage, res: ServerResponse) {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;

  const id = req.url?.split("/")[2];
  if (!id) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ID no proporcionado" }));
    return;
  }

  try {
    const body = await parseBody(req);
    const db = getDB();

    const car = await db.collection<Car>("cars").findOne({ _id: id });
    if (!car) {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Auto no encontrado" }));
      return;
    }

    // Solo el admin que lo creó o el superadmin puede modificarlo
    if (user.role !== "superadmin" && car.createdBy !== user._id) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "No tienes permiso para modificar este auto" }));
      return;
    }

    await db.collection<Car>("cars").updateOne({ _id: id }, { $set: body });

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Auto actualizado correctamente" }));

    // Log de modificación
    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Actualizó el auto con ID ${id}`,
      method: "PUT",
      endpoint: `/cars/${id}`,
    });

  } catch (err) {
    console.error(err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error al actualizar el auto" }));
  }

  
}

// --- DELETE /cars/:id (solo admin o superadmin)
export async function deleteCar(req: IncomingMessage, res: ServerResponse) {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;

  const id = req.url?.split("/")[2];
  if (!id) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ID no proporcionado" }));
    return;
  }

  const db = getDB();
  const car = await db.collection<Car>("cars").findOne({ _id: id });

  if (!car) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Auto no encontrado" }));
    return;
  }

  if (user.role !== "superadmin" && car.createdBy !== user._id) {
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "No tienes permiso para eliminar este auto" }));
    return;
  }

  await db.collection<Car>("cars").deleteOne({ _id: id });

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Auto eliminado correctamente" }));


  // Log de eliminación
  await saveLog({
    userId: user._id,
    username: user.username,
    action: `Eliminó el auto con ID ${id}`,
    method: "DELETE",
    endpoint: `/cars/${id}`,
  });

}