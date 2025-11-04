import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Divide el hash en partes y asigna valores por defecto seguros
  const [salt = "", key = ""] = stored.split(":");

  // Verifica que ambos valores existan
  if (!salt || !key) {
    throw new Error("Formato de hash inválido");
  }

  // Convierte la parte del hash a Buffer y deriva el hash para comparar
  const hashBuffer = Buffer.from(key, "hex");
  const derived = scryptSync(password, salt, 64);

  // Comparación segura contra ataques de tiempo
  return timingSafeEqual(hashBuffer, derived);
}
