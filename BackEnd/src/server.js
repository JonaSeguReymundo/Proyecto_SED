"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const PORT = 3000;
const server = (0, http_1.createServer)((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("API de Reservas de Carros – Servidor funcionando correctamente");
});
server.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
//# sourceMappingURL=server.js.map