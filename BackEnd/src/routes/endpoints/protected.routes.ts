import { addRoute } from "../router";
import { requireAuth, requireRole } from "../../middleware/auth.middleware";
import { IncomingMessage, ServerResponse } from "http";

// Ruta visible solo para usuarios autenticados
addRoute("GET", "/profile", async (req: IncomingMessage, res: ServerResponse) => {
  const user = await requireAuth(req, res);
  if (!user) return;

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Perfil del usuario", user }));
});

// Ruta solo para admin o superadmin
addRoute("GET", "/admin/area", async (req: IncomingMessage, res: ServerResponse) => {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Área administrativa", user }));
});