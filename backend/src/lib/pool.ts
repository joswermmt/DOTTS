import sql from "mssql";
import { parsePrismaSqlServerUrl } from "./sqlConfig.js";

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (pool) return pool;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL en el entorno.");
  const config = parsePrismaSqlServerUrl(url);
  pool = new sql.ConnectionPool(config);
  await pool.connect();
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
