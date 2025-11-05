import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { requireRole } from "../middleware/auth.middleware";
import { LogEntry } from "../models/log.model";

export async function getLogs(req: IncomingMessage, res: ServerResponse) {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;

  const db = getDB();
  const logs = await db.collection<LogEntry>("logs").find().sort({ timestamp: -1 }).toArray();

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(logs));
}
