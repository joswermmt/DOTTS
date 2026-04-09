import sql from "mssql";
import { getPool } from "../lib/pool.js";
import type { CategoriaRow } from "./categorias.js";

export type ServicioProveedor = {
  id: string;
  nombre: string;
  fotoUrl: string | null;
  lat: number | null;
  lng: number | null;
  telefono: string | null;
  experiencia: string | null;
};

export type ServicioListRow = {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  esFijo: boolean;
  proveedorId: string;
  categoriaId: number;
  createdAt: Date;
  updatedAt: Date;
  categoria: CategoriaRow;
  proveedor: ServicioProveedor;
};

function mapListRow(row: Record<string, unknown>): ServicioListRow {
  return {
    id: String(row.id),
    titulo: String(row.titulo),
    descripcion: String(row.descripcion),
    precio: Number(row.precio),
    esFijo: Boolean(row.esFijo),
    proveedorId: String(row.proveedorId),
    categoriaId: Number(row.categoriaId),
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
    categoria: {
      id: Number(row.catId),
      nombre: String(row.catNombre),
      descripcion: row.catDesc != null ? String(row.catDesc) : null,
    },
    proveedor: {
      id: String(row.prvId),
      nombre: String(row.prvNombre),
      fotoUrl: row.prvFoto != null ? String(row.prvFoto) : null,
      lat: row.prvLat != null ? Number(row.prvLat) : null,
      lng: row.prvLng != null ? Number(row.prvLng) : null,
      telefono: row.prvTel != null ? String(row.prvTel) : null,
      experiencia: row.prvExp != null ? String(row.prvExp) : null,
    },
  };
}

export async function servicioCount(categoriaId?: number, q?: string): Promise<number> {
  const p = await getPool();
  const req = p.request();
  let where = "1=1";
  if (categoriaId != null) {
    req.input("catId", sql.Int, categoriaId);
    where += " AND s.[categoriaId] = @catId";
  }
  if (q?.trim()) {
    const pat = `%${likeEscape(q.trim())}%`;
    req.input("qPat", sql.NVarChar(500), pat);
    where += " AND (s.[titulo] LIKE @qPat ESCAPE '\\' OR s.[descripcion] LIKE @qPat ESCAPE '\\')";
  }
  const r = await req.query(`SELECT COUNT(*) AS c FROM [Servicio] s WHERE ${where}`);
  return Number((r.recordset[0] as { c: number })?.c ?? 0);
}

export async function servicioList(
  skip: number,
  limit: number,
  categoriaId?: number,
  q?: string
): Promise<ServicioListRow[]> {
  const p = await getPool();
  const req = p.request().input("skip", sql.Int, skip).input("limit", sql.Int, limit);
  let where = "1=1";
  if (categoriaId != null) {
    req.input("catId", sql.Int, categoriaId);
    where += " AND s.[categoriaId] = @catId";
  }
  if (q?.trim()) {
    const pat = `%${likeEscape(q.trim())}%`;
    req.input("qPat", sql.NVarChar(500), pat);
    where += " AND (s.[titulo] LIKE @qPat ESCAPE '\\' OR s.[descripcion] LIKE @qPat ESCAPE '\\')";
  }
  const r = await req.query(`
    SELECT
      s.[id], s.[titulo], s.[descripcion], s.[precio], s.[esFijo], s.[proveedorId], s.[categoriaId], s.[createdAt], s.[updatedAt],
      c.[id] AS catId, c.[nombre] AS catNombre, c.[descripcion] AS catDesc,
      pr.[id] AS prvId, pr.[nombre] AS prvNombre, pr.[fotoUrl] AS prvFoto, pr.[lat] AS prvLat, pr.[lng] AS prvLng,
      pr.[telefono] AS prvTel, pr.[experiencia] AS prvExp
    FROM [Servicio] s
    INNER JOIN [Categoria] c ON s.[categoriaId] = c.[id]
    INNER JOIN [Usuario] pr ON s.[proveedorId] = pr.[id]
    WHERE ${where}
    ORDER BY s.[createdAt] DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY
  `);
  return (r.recordset as Array<Record<string, unknown>>).map(mapListRow);
}

export async function servicioFindByIdFull(id: string): Promise<ServicioListRow | null> {
  const p = await getPool();
  const r = await p.request().input("id", sql.NVarChar(36), id).query(`
    SELECT
      s.[id], s.[titulo], s.[descripcion], s.[precio], s.[esFijo], s.[proveedorId], s.[categoriaId], s.[createdAt], s.[updatedAt],
      c.[id] AS catId, c.[nombre] AS catNombre, c.[descripcion] AS catDesc,
      pr.[id] AS prvId, pr.[nombre] AS prvNombre, pr.[fotoUrl] AS prvFoto, pr.[lat] AS prvLat, pr.[lng] AS prvLng,
      pr.[telefono] AS prvTel, pr.[experiencia] AS prvExp
    FROM [Servicio] s
    INNER JOIN [Categoria] c ON s.[categoriaId] = c.[id]
    INNER JOIN [Usuario] pr ON s.[proveedorId] = pr.[id]
    WHERE s.[id] = @id
  `);
  const row = r.recordset[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapListRow(row);
}

export async function servicioFindProveedorId(id: string): Promise<string | null> {
  const p = await getPool();
  const r = await p
    .request()
    .input("id", sql.NVarChar(36), id)
    .query(`SELECT [proveedorId] FROM [Servicio] WHERE [id] = @id`);
  const row = r.recordset[0] as { proveedorId: string } | undefined;
  return row ? String(row.proveedorId) : null;
}

export async function servicioCreate(data: {
  id: string;
  titulo: string;
  descripcion: string;
  precio: number;
  esFijo: boolean;
  categoriaId: number;
  proveedorId: string;
}): Promise<ServicioListRow | null> {
  const p = await getPool();
  await p
    .request()
    .input("id", sql.NVarChar(36), data.id)
    .input("titulo", sql.NVarChar(255), data.titulo)
    .input("descripcion", sql.NVarChar(sql.MAX), data.descripcion)
    .input("precio", sql.Decimal(12, 2), data.precio)
    .input("esFijo", sql.Bit, data.esFijo ? 1 : 0)
    .input("categoriaId", sql.Int, data.categoriaId)
    .input("proveedorId", sql.NVarChar(36), data.proveedorId)
    .query(`
      INSERT INTO [Servicio] ([id],[titulo],[descripcion],[precio],[esFijo],[categoriaId],[proveedorId])
      VALUES (@id, @titulo, @descripcion, @precio, @esFijo, @categoriaId, @proveedorId)
    `);
  return servicioFindByIdFull(data.id);
}

export async function servicioCountTotal(): Promise<number> {
  const p = await getPool();
  const r = await p.query(`SELECT COUNT(*) AS c FROM [Servicio]`);
  return Number((r.recordset[0] as { c: number })?.c ?? 0);
}

function likeEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_").replace(/\[/g, "\\[");
}
