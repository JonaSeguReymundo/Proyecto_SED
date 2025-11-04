import { MongoClient, Db } from "mongodb";
import { config } from "./env";

let db: Db;

export async function connectDB() {
  try {
    const client = new MongoClient(config.mongoUri);
    await client.connect();
    db = client.db(config.dbName);
    console.log(`Conectado a MongoDB: ${config.dbName}`);
    return db;
  } catch (error) {
    console.error("Error al conectar con MongoDB:", error);
    process.exit(1);
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error("La base de datos no está conectada.");
  }
  return db;
}
