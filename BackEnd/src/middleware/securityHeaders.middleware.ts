import { IncomingMessage, ServerResponse } from "http";

export function securityHeaders(req: IncomingMessage, res: ServerResponse, next: () => void) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("X-Frame-Options", "DENY");
  next();
}
