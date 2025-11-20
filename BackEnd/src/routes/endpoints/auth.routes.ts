import { addRoute } from "../router";
import { register, login } from "../../controllers/auth.controller";
import { rateLimiter } from "../../middleware/rateLimiter.middleware";

addRoute("POST", "/auth/register", register);
addRoute("POST", "/auth/login", rateLimiter, login);
