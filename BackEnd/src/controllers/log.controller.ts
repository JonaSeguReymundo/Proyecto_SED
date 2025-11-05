import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { LogEntry } from "../models/log.model";
import { handleError } from "../middleware/error.middleware";
import { AuthUser } from "../middleware/auth.middleware";

export async function getLogs(req: IncomingMessage, res: ServerResponse, user: AuthUser) {
  try {
    const db = getDB();
    const logs = await db.collection<LogEntry>("logs").find().sort({ timestamp: -1 }).toArray();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(logs));
  } catch (err) {
    console.error(err);
    handleError(res, 500, "Error al obtener los logs");
  }
}
