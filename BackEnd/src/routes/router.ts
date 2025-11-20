import { IncomingMessage, ServerResponse } from "http";

// --- Tipos ---
export type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => void | Promise<void>;

export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse
) => void | Promise<void>;

interface Route {
  method: string;
  path: string;
  middlewares: Middleware[];
  handler: RouteHandler;
}

const routes: Route[] = [];
const globalMiddlewares: Middleware[] = [];

// --- Registrar middleware global ---
export function use(middleware: Middleware) {
  globalMiddlewares.push(middleware);
}

// --- Registrar rutas (con sobrecarga para middleware) ---
export function addRoute(method: string, path: string, handler: RouteHandler): void;
export function addRoute( method: string, path: string, ...handlers: [...Middleware[], RouteHandler]): void;
export function addRoute( method: string, path: string, ...handlers: any[]): void {
  const handler = handlers.pop() as RouteHandler;
  const middlewares = handlers as Middleware[];
  routes.push({ method: method.toUpperCase(), path, middlewares, handler });
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
    // --- Ejecutar middleware y handler ---
    const allMiddlewares = [...globalMiddlewares, ...(route.middlewares || [])];

  const execute = async (index: number): Promise<void> => {
  if (index < allMiddlewares.length) {
    const mw = allMiddlewares[index];

    if (mw) {
      await mw(req, res, () => void execute(index + 1));
    } else {
      await execute(index + 1);
    }

  } else {
    await route.handler(req, res);
  }
};

    try {
      await execute(0);
    } catch (err) {
      console.error("Error en el handler o middleware:", err);
      // Evitar doble escritura en la respuesta
      if (!res.writableEnded) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Error interno del servidor" }));
      }
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Ruta no encontrada", method, url }));
  }
}
