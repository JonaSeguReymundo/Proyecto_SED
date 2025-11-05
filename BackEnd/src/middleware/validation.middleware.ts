import { IncomingMessage, ServerResponse } from "http";

export async function parseAndValidateJSON(req: IncomingMessage, res: ServerResponse): Promise<any | null> {
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        if (data.trim().length === 0) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "El cuerpo de la petición está vacío" }));
          return resolve(null);
        }

        const parsed = JSON.parse(data);
        resolve(parsed);
      } catch (error) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Formato JSON inválido" }));
        resolve(null);
      }
    });
  });
}
