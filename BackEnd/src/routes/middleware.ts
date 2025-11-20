import { use } from "./router";
import { securityHeaders } from "../middleware/securityHeaders.middleware";

use(securityHeaders);
