import { IncomingMessage, ServerResponse } from "http";

type RouteHandler = (req: IncomingMessage, res: ServerResponse) => void;

interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}

const routes: Route[] = [];

// --- Función para registrar rutas ---
export function addRoute(method: string, path: string, handler: RouteHandler) {
  routes.push({ method: method.toUpperCase(), path, handler });
}

// --- Función para manejar peticiones ---
export function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const method = req.method?.toUpperCase() || "";
  const url = req.url?.split("?")[0] || "";

  const route = routes.find(r => r.method === method && r.path === url);

  if (route) {
    route.handler(req, res);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Ruta no encontrada" }));
  }
}
