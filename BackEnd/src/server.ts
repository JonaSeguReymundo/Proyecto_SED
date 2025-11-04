import { createServer } from "http";
import { connectDB } from "./config/db";
import { config } from "./config/env";
import { handleRequest } from "./routes/router";

// Importar rutas
import "./routes/endpoints/base.routes";
import "./routes/endpoints/auth.routes";

async function startServer() {
  await connectDB();
  const server = createServer(handleRequest);

  server.listen(config.port, () => {
    console.log(`🚀 Servidor escuchando en http://localhost:${config.port}`);
  });
}

startServer();
