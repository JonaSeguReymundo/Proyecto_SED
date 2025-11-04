import { addRoute } from "../router";
import { register, login } from "../../controllers/auth.controller";

addRoute("POST", "/auth/register", register);
addRoute("POST", "/auth/login", login);
