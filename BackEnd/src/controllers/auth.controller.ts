import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { randomUUID } from "crypto";
import { hashPassword, verifyPassword } from "../utils/crypto";
import { saveLog } from "../utils/logger";
import { handleError } from "../middleware/error.middleware";

interface User {
  _id: string;
  username: string;
  password?: string;
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
      return handleError(res, 400, "Faltan campos obligatorios");
    }

    // Política de contraseñas seguras
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return handleError(res, 400, "La contraseña no cumple con los requisitos de seguridad");
    }

    const db = getDB();
    const users = db.collection<User>("users"); 

    const existing = await users.findOne({ username });
    if (existing) {
      return handleError(res, 409, "El usuario ya existe");
    }

    const hashed = await hashPassword(password);
    const user: User = {
      _id: randomUUID(),
      username,
      password: hashed,
      role: role || "user",
    };

    await users.insertOne(user);
    
    const { password: _, ...safeUser } = user;

    res.writeHead(201, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Usuario registrado correctamente", user: safeUser }));

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
    handleError(res, 500, "Error interno en registro");
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
    if (!user || !user.password || !(await verifyPassword(password, user.password))) {
      return handleError(res, 401, "Credenciales inválidas");
    }

    const token = randomUUID();
    const session: Session = {
      _id: token,
      userId: user._id,
      createdAt: new Date(),
    };

    await sessions.insertOne(session);
    
    const { password: _, ...safeUser } = user;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Login exitoso", token, user: safeUser }));

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
    handleError(res, 500, "Error interno en login");
  }
}
