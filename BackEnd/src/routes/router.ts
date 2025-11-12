import { IncomingMessage, ServerResponse } from "http";

type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => void | Promise<void>;

interface Route {
  method: string;
  path: string;
  handler: RouteHandler;
}

const routes: Route[] = [];

// --- Registrar rutas ---
export function addRoute(method: string, path: string, handler: RouteHandler) {
  routes.push({ method: method.toUpperCase(), path, handler });
}

// --- Buscar coincidencia de rutas ---
function matchRoute(method: string, url: string): Route | undefined {
  // Coincidencia exacta
  let route = routes.find((r) => r.method === method && r.path === url);
  if (route) return route;

  // Coincidencia parcial (para rutas con IDs dinámicos)
  return routes.find((r) => r.method === method && url.startsWith(r.path));
}

// --- Manejar peticiones ---
export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // 💡 1. Habilitar CORS (permite acceso desde Vite en localhost:5173)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 💡 2. Manejar preflight (solicitudes OPTIONS)
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // 💡 3. Procesar rutas normales
  const method = req.method?.toUpperCase() || "";
  const url = req.url?.split("?")[0] || "";

  const route = matchRoute(method, url);

  if (route) {
    try {
      await route.handler(req, res);
    } catch (err) {
      console.error("Error en el handler:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Error interno del servidor" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Ruta no encontrada", method, url }));
  }
}
