import { createServer, IncomingMessage, ServerResponse } from "http";

const PORT = 3000;

const server = createServer((req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("API de Reservas de Carros, Servidor funcionando correctamente");
});

server.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
