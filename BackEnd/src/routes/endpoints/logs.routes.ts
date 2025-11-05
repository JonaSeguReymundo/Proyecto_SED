import { addRoute } from "../router";
import { getLogs } from "../../controllers/log.controller";

addRoute("GET", "/logs", getLogs);
