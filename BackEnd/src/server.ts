import { createServer } from "http";
import { connectDB } from "./config/db";
import { config } from "./config/env";
import { handleRequest } from "./routes/router";

// Importa las rutas (esto las registra automáticamente)
import "./routes/endpoints/base.routes";

async function startServer() {
  await connectDB();

  const server = createServer((req, res) => {
    handleRequest(req, res);
  });

  server.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`);
  });
}

startServer();
