import { ServerResponse } from "http";

export function handleError(
  res: ServerResponse,
  statusCode: number = 500,
  message: string = "Error interno del servidor",
  details?: any
) {
  console.error("Error:", message, details || "");
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: message }));
}
