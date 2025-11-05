import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "../utils/crypto";
import { saveLog } from "../utils/logger";

interface User {
  _id: string;
  username: string;
  password: string;
  role: string;
}

interface Session {
  _id: string;
  userId: string;
  createdAt: Date;
}

// --- Helper para leer el body ---
async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
  });
}

// --- POST /auth/register ---
export async function register(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await parseBody(req);
    const { username, password, role } = body;

    if (!username || !password) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Faltan campos obligatorios" }));
      return;
    }

    const db = getDB();
    const users = db.collection<User>("users"); 

    const existing = await users.findOne({ username });
    if (existing) {
      res.writeHead(409, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "El usuario ya existe" }));
      return;
    }

    const hashed = await hashPassword(password);
    const user: User = {
      _id: randomUUID(),
      username,
      password: hashed,
      role: role || "user",
    };

    await users.insertOne(user);

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Usuario registrado correctamente" }));

    //  Registrar log
    await saveLog({
      userId: user._id,
      username: user.username,
      action: `Se registró en el sistema con el rol ${user.role}`,
      method: "POST",
      endpoint: "/auth/register",
    });

  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno en registro" }));
  }
}

// --- POST /auth/login ---
export async function login(req: IncomingMessage, res: ServerResponse) {
  try {
    const body = await parseBody(req);
    const { username, password } = body;

    const db = getDB();
    const users = db.collection<User>("users");
    const sessions = db.collection<Session>("sessions");

    const user = await users.findOne({ username });
    if (!user || !(await verifyPassword(password, user.password))) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Credenciales inválidas" }));
      return;
    }

    const token = randomUUID();
    const session: Session = {
      _id: token,
      userId: user._id,
      createdAt: new Date(),
    };

    await sessions.insertOne(session);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Login exitoso", token }));

    // Registrar log
    await saveLog({
      userId: user._id,
      username: user.username,
      action: "Inició sesión en el sistema",
      method: "POST",
      endpoint: "/auth/login",
    });

  } catch (error) {
    console.error(error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Error interno en login" }));
  }
}
