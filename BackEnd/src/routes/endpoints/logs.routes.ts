import { addRoute } from "../router";
import { getLogs } from "../../controllers/log.controller";
import { requireRole } from "../../middleware/auth.middleware";

addRoute("GET", "/logs", async (req, res) => {
  const user = await requireRole(req, res, ["admin", "superadmin"]);
  if (!user) return;
  await getLogs(req, res, user);
});
