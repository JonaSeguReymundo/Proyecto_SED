import { createServer } from "http";
import { connectDB } from "./config/db";
import { config } from "./config/env";
import { handleRequest } from "./routes/router";

// Importar rutas
import "./routes/endpoints/base.routes";
import "./routes/endpoints/auth.routes";
import "./routes/endpoints/protected.routes";
import "./routes/endpoints/cars.routes";
import "./routes/endpoints/bookings.routes";
import "./routes/endpoints/logs.routes";

async function startServer() {
  await connectDB();
  const server = createServer(handleRequest);

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
