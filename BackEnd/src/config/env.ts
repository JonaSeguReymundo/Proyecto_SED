import dotenv from "dotenv";
dotenv.config();

function requireEnv(varName: string): string {
  const value = process.env[varName];
  if (!value) {
    console.error(`ERROR: Falta la variable de entorno ${varName}`);
    process.exit(1); // detiene la ejecución por seguridad
  }
  return value;
}

export const config = {
  mongoUri: requireEnv("MONGO_URI"),
  dbName: requireEnv("DB_NAME"),
  port: parseInt(requireEnv("PORT")),
};
