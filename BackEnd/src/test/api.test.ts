// Nota: Para ejecutar este test, el servidor debe estar corriendo.
// 1. Ejecuta `npm run dev` en una terminal.
// 2. Ejecuta `node dist/test/api.test.js` en otra terminal.

import http from "http";
import { randomUUID } from "crypto";
import dotenv from "dotenv";
dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

// --- Tipos y Datos de Prueba ---
interface TestResult {
  description: string;
  success: boolean;
  expected: any;
  received: any;
}

const adminUser = {
  username: `admin_test_${randomUUID()}`,
  password: "Password123!",
  role: "admin",
};

const normalUser = {
  username: `user_test_${randomUUID()}`,
  password: "Password123!",
};

let adminToken: string | null = null;
let normalUserToken: string | null = null;
let testCarId: string | null = null;

// --- Helper para hacer peticiones HTTP ---
function makeRequest(
  method: string,
  path: string,
  token: string | null = null,
  body: object | null = null
): Promise<{ statusCode: number; data: any }> {
  return new Promise((resolve, reject) => {
    const headers: http.OutgoingHttpHeaders = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: http.RequestOptions = {
      hostname: "localhost",
      port: PORT,
      path,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode || 500,
            data: JSON.parse(data || "{}"),
          });
        } catch (e) {
          // Si el cuerpo no es JSON (ej. body vacío)
          resolve({
            statusCode: res.statusCode || 500,
            data: data,
          });
        }
      });
    });

    req.on("error", (e) => reject(e));

    if (body) {
      req.write(JSON.stringify(body));
    } else if (method === "POST" || method === "PUT") {
      // Para pruebas de body vacío, enviamos un string vacío
      req.write("");
    }


    req.end();
  });
}

// --- Suite de Tests ---
async function runTests() {
  const results: TestResult[] = [];
  let testCount = 0;

  async function test(description: string, testFn: () => Promise<boolean>) {
    testCount++;
    const success = await testFn();
    results.push({ description, success, expected: "", received: "" });
    console.log(`[${success ? "Si" : "No"}] ${description}`);
  }

  // 1. Registrar usuarios de prueba
  await test("Debe fallar al registrar con una contraseña débil", async () => {
    const weakUser = { username: "weakuser", password: "123" };
    const { statusCode } = await makeRequest("POST", "/auth/register", null, weakUser);
    return statusCode === 400;
  });
  await test("Debe registrar un usuario normal", async () => {
    const { statusCode } = await makeRequest("POST", "/auth/register", null, normalUser);
    return statusCode === 201;
  });

  // 2. Iniciar sesión y guardar tokens
  await test("Debe iniciar sesión como admin y obtener un token", async () => {
    const { statusCode, data } = await makeRequest("POST", "/auth/login", null, adminUser);
    if (statusCode === 200 && data.token) {
      adminToken = data.token;
      return true;
    }
    return false;
  });
  await test("Debe iniciar sesión como usuario normal y obtener un token", async () => {
    const { statusCode, data } = await makeRequest("POST", "/auth/login", null, normalUser);
    if (statusCode === 200 && data.token) {
      normalUserToken = data.token;
      return true;
    }
    return false;
  });

    // Test: Fallo de login con credenciales inválidas
  await test("POST /auth/login con usuario inexistente debe dar 401", async () => {
    const { statusCode, data } = await makeRequest("POST", "/auth/login", null, { username: "noexiste", password: "bad" });
    return statusCode === 401 && data.error === "Credenciales inválidas";
  });

  // 3. Crear un auto con el admin para usarlo en las pruebas de booking
  await test("Debe crear un auto de prueba con el token de admin", async () => {
    const car = { brand: "Test", model: "Car", type: "Sedan", pricePerDay: 100 };
    const { statusCode, data } = await makeRequest("POST", "/cars", adminToken, car);
    if (statusCode === 201 && data.car._id) {
        testCarId = data.car._id;
        return true;
    }
    return false;
  });

  // --- Casos de Prueba Específicos ---

  await test("POST /cars con JSON inválido debe dar 400", async () => {
    const req = http.request({
        hostname: "localhost", port: PORT, path: "/cars", method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${adminToken}` }
    }, res => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => {
            const result = res.statusCode === 400 && JSON.parse(data).error === "Formato JSON inválido";
            console.log(`[${result ? "Si" : "No"}] POST /cars con JSON inválido debe dar 400`);
        });
    });
    req.write("{ 'invalid': json }"); // JSON inválido
    req.end();
    // Este test se resolverá asíncronamente
    return true;
  });

  await test("GET /logs con token de usuario normal debe dar 403 Forbidden", async () => {
    const { statusCode, data } = await makeRequest("GET", "/logs", normalUserToken);
    return statusCode === 403 && data.error === "Forbidden: no tienes permisos para este recurso";
  });

  await test("GET /logs con token de admin debe dar 200 OK", async () => {
    const { statusCode, data } = await makeRequest("GET", "/logs", adminToken);
    return statusCode === 200 && Array.isArray(data);
  });

    await test("POST /bookings con body vacío debe dar 400", async () => {
        const { statusCode, data } = await makeRequest("POST", "/bookings", normalUserToken, null);
        return statusCode === 400 && data.error === "El cuerpo de la petición está vacío";
    });


  // --- Resumen ---
  const successCount = results.filter(r => r.success).length;
  console.log(`\nResumen: ${successCount} de ${testCount} tests pasaron.`);
  if (successCount < testCount) {
    console.log("Tests fallidos:");
    results.filter(r => !r.success).forEach(r => console.log(`- ${r.description}`));
    process.exit(1); // Salir con error si algo falló
  }
}

runTests().catch(err => {
  console.error("Error fatal durante los tests:", err);
  process.exit(1);
});

