import { IncomingMessage, ServerResponse } from "http";
import { getDB } from "../config/db";
import { handleError } from "./error.middleware";

export interface AuthUser {
  _id: string;
  username: string;
  role: string;
}

interface SessionDoc {
  _id: string;       // token
  userId: string;
  createdAt?: Date;
}

interface UserDoc {
  _id: string;
  username: string;
  password?: string;
  role: string;
}

/**
 * Helper: extrae token del header Authorization
 * Acepta:
 *  - "Bearer <token>"
 *  - "<token>"
 *  - headers en forma de array (string[])
 */
function extractTokenFromHeader(req: IncomingMessage): string | null {
  const raw = req.headers["authorization"];
  if (!raw) return null;

  // raw puede ser string o string[]
  const header = Array.isArray(raw) ? raw[0] : raw;

  if (!header) return null;

  // Si vienen con "Bearer <token>"
  const parts = header.split(" ");
  if (parts.length === 2 && parts[0].toLowerCase() === "bearer") {
    return parts[1];
  }

  return header;
}

/**
 * Busca el usuario autenticado a partir del token
 */
export async function authenticate(req: IncomingMessage, res: ServerResponse): Promise<AuthUser | null> {
  const token = extractTokenFromHeader(req);
  if (!token) return null;

  const db = getDB();
  // tipamos las colecciones para que TS conozca shape de docs
  const sessions = db.collection<SessionDoc>("sessions");
  const users = db.collection<UserDoc>("users");

  // Buscamos la sesión por _id (token)
  const session = await sessions.findOne({ _id: token });
  if (!session) return null;

  // Validar expiración de la sesión (1 hora)
  if (session.createdAt) {
    const now = new Date();
    const sessionAge = now.getTime() - session.createdAt.getTime();
    if (sessionAge > 3600000) { // 1 hora en ms
      await sessions.deleteOne({ _id: token }); // Eliminar sesión expirada
    handleError(res, 401, "Unauthorized: la sesión ha expirado");
    return null;
    }
  }

  // session.userId es string según SessionDoc
  const user = await users.findOne({ _id: session.userId });
  if (!user) return null;

  return { _id: user._id, username: user.username, role: user.role };
}

/**
 * Middleware para rutas que requieren login
 * Devuelve el AuthUser o responde 401 y retorna null
 */
export async function requireAuth(req: IncomingMessage, res: ServerResponse): Promise<AuthUser | null> {
  const user = await authenticate(req, res);
  if (!user) {
    if (!res.writableEnded) { // Evitar doble respuesta si authenticate ya respondió
      handleError(res, 401, "Unauthorized: token inválido o ausente");
    }
    return null;
  }
  return user;
}

/**
 * Middleware para rutas con roles específicos
 */
export async function requireRole(
  req: IncomingMessage,
  res: ServerResponse,
  roles: string[]
): Promise<AuthUser | null> {
  const user = await requireAuth(req, res);
  if (!user) return null;

  if (!roles.includes(user.role)) {
    handleError(res, 403, "Forbidden: no tienes permisos para este recurso");
    return null;
  }
  return user;
}
