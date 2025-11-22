import { addRoute } from "../router";
import { requireRole } from "../../middleware/auth.middleware";
import { parseAndValidateJSON } from "../../middleware/validation.middleware";
import { getDB } from "../../config/db";
import { hashPassword } from "../../utils/crypto";
import { ObjectId } from "mongodb";

addRoute("POST", "/admin/create-admin", async (req, res) => {
  const superUser = await requireRole(req, res, ["superadmin"]);
  if (!superUser) return;

  const body = await parseAndValidateJSON(req, res);
  if (!body) return;

  const { username, password } = body;

  if (!username || !password) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Faltan campos obligatorios" }));
    return;
  }

  const db = getDB();
  const users = db.collection("users");

  const exists = await users.findOne({ username });
  if (exists) {
    res.writeHead(409);
    res.end(JSON.stringify({ error: "El usuario ya existe" }));
    return;
  }

  const hashed = await hashPassword(password);

  const newAdmin = {
    _id: new ObjectId(),      
    username,
    password: hashed,
    role: "admin",
  };

  await users.insertOne(newAdmin);   

  res.writeHead(201, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ message: "Admin creado", user: { username, role: "admin" } }));
});
