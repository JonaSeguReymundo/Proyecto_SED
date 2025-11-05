import { getDB } from "../config/db";
import { randomUUID } from "crypto";
import { LogEntry } from "../models/log.model";

export async function saveLog({
  userId,
  username,
  action,
  method,
  endpoint,
}: Omit<LogEntry, "_id" | "timestamp">) {
  try {
    const db = getDB();
    const log: LogEntry = {
      _id: randomUUID(),
      userId,
      username,
      action,
      method,
      endpoint,
      timestamp: new Date().toISOString(),
    };
    await db.collection<LogEntry>("logs").insertOne(log);
  } catch (err) {
    console.error("Error al registrar log:", err);
  }
}
