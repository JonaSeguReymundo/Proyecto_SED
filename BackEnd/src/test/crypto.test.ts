import { hashPassword, verifyPassword } from "../utils/crypto";

async function test() {
  const hash = await hashPassword("1234");
  console.log("Hash generado:", hash);

  const ok = await verifyPassword("1234", hash);
  console.log("¿Coincide?:", ok);

  const fail = await verifyPassword("wrong", hash);
  console.log("¿Coincide con contraseña incorrecta?:", fail);
}

test();
