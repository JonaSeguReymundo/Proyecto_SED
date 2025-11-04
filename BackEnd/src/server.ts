import { createServer } from "http";
import { connectDB } from "./config/db";
import { config } from "./config/env";

const server = createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Servidor conectado correctamente a MongoDB");
});

async function startServer() {
  await connectDB();

  server.listen(config.port, () => {
    console.log(`Servidor escuchando en http://localhost:${config.port}`);
  });
}

startServer();
