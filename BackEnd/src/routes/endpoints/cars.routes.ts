import { addRoute } from "../router";
import { getCars, createCar, updateCar, deleteCar } from "../../controllers/car.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { parseAndValidateJSON } from "../../middleware/validation.middleware";

// --- GET /cars ---
addRoute("GET", "/cars", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  await getCars(req, res, user);
});

// --- POST /cars (solo admin o superadmin) ---
addRoute("POST", "/cars", async (req, res) => {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;

  // Validar y parsear JSON solo una vez
  const body = await parseAndValidateJSON(req, res);
  if (!body) return;

  await createCar(req, res, user, body);
});

// --- PUT /cars/:id (solo admin o superadmin) ---
addRoute("PUT", "/cars/", async (req, res) => {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;

  const body = await parseAndValidateJSON(req, res);
  if (!body) return;

  await updateCar(req, res, user, body);
});

// --- DELETE /cars/:id (solo admin o superadmin) ---
addRoute("DELETE", "/cars/", async (req, res) => {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;
  await deleteCar(req, res, user);
});
