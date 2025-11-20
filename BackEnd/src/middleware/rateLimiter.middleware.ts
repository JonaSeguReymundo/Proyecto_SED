import { IncomingMessage, ServerResponse } from "http";
import { handleError } from "./error.middleware";

interface Attempt {
  count: number;
  timestamp: number;
}

const attempts = new Map<string, Attempt>();
const MAX_ATTEMPTS = 5;
const TIME_WINDOW = 60 * 1000; // 1 minute

export function rateLimiter(req: IncomingMessage, res: ServerResponse, next: () => void) {
  const ip = req.socket.remoteAddress;

  if (!ip) {
    return next();
  }

  const now = Date.now();
  const attempt = attempts.get(ip);

  if (attempt && now - attempt.timestamp < TIME_WINDOW) {
    if (attempt.count >= MAX_ATTEMPTS) {
      return handleError(res, 429, "Demasiadas solicitudes. Inténtalo de nuevo más tarde.");
    }
    attempt.count++;
  } else {
    attempts.set(ip, { count: 1, timestamp: now });
  }

  next();
}
