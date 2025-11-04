import { addRoute } from "../router";
import { IncomingMessage, ServerResponse } from "http";

// Ruta raíz "/"
addRoute("GET", "/", (req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    message: "API de Reservas de Carros funcionando correctamente",
    status: "online"
  }));
});

// Ruta de estado "/status"
addRoute("GET", "/status", (req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  }));
});
