import { addRoute } from "../router";
import { createBooking, getMyBookings, getAllBookings, cancelBooking, updateBooking } from "../../controllers/booking.controller";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { parseAndValidateJSON } from "../../middleware/validation.middleware";

// --- POST /bookings ---
addRoute("POST", "/bookings", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = await parseAndValidateJSON(req, res);
  if (!body) return;

  await createBooking(req, res, user, body);
});

// --- GET /bookings (solo del usuario actual) ---
addRoute("GET", "/bookings", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  await getMyBookings(req, res, user);
});

// --- GET /bookings/all (solo admin o superadmin) ---
addRoute("GET", "/bookings/all", async (req, res) => {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;
  await getAllBookings(req, res, user);
});

// --- DELETE /bookings/:id ---
addRoute("DELETE", "/bookings/", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;
  await cancelBooking(req, res, user);
});

// --- PUT /bookings/:id ---
addRoute("PUT", "/bookings/", async (req, res) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  const body = await parseAndValidateJSON(req, res);
  if (!body) return;

  await updateBooking(req, res, user, body);
});
