import sql from "mssql";
import { getPool } from "../lib/pool.js";

export type CategoriaRow = { id: number; nombre: string; descripcion: string | null };

export async function categoriaListAll(): Promise<CategoriaRow[]> {
  const p = await getPool();
  const r = await p.query(`SELECT [id],[nombre],[descripcion] FROM [Categoria] ORDER BY [nombre] ASC`);
  return (r.recordset as Array<Record<string, unknown>>).map((row) => ({
    id: Number(row.id),
    nombre: String(row.nombre),
    descripcion: row.descripcion != null ? String(row.descripcion) : null,
  }));
}

export async function categoriaFindById(id: number): Promise<CategoriaRow | null> {
  const p = await getPool();
  const r = await p.request().input("id", sql.Int, id).query(`
    SELECT [id],[nombre],[descripcion] FROM [Categoria] WHERE [id] = @id
  `);
  const row = r.recordset[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: Number(row.id),
    nombre: String(row.nombre),
    descripcion: row.descripcion != null ? String(row.descripcion) : null,
  };
}
