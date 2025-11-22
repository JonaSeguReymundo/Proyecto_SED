import { createServer } from "http";
import { connectDB } from "./config/db";
import { config } from "./config/env";
import { handleRequest } from "./routes/router";

// Importar rutas
import "./routes/middleware";
import "./routes/endpoints/base.routes";
import "./routes/endpoints/auth.routes";
import "./routes/endpoints/protected.routes";
import "./routes/endpoints/cars.routes";
import "./routes/endpoints/bookings.routes";
import "./routes/endpoints/logs.routes";
import "./routes/endpoints/superadmin.routes";


async function startServer() {
  await connectDB();

  const server = createServer(async (req, res) => {
    // --- Configuración CORS ---
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    // Manejar preflight requests
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // --- Pasar al manejador de rutas ---
    await handleRequest(req, res);
  });

  server.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`);
  });
}

process.on("uncaughtException", (err) => {
  console.error("Error no capturado:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("Promesa rechazada sin manejar:", reason);
});

startServer();

