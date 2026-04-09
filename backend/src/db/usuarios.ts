import sql from "mssql";
import { getPool } from "../lib/pool.js";
import type { Rol } from "../constants/enums.js";

export type UsuarioRow = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  contrasena: string;
  rol: string;
  fotoUrl: string | null;
  lat: number | null;
  lng: number | null;
  experiencia: string | null;
  bloqueado: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function mapRow(row: Record<string, unknown> | undefined): UsuarioRow | null {
  if (!row) return null;
  return {
    id: String(row.id),
    nombre: String(row.nombre),
    correo: String(row.correo),
    telefono: row.telefono != null ? String(row.telefono) : null,
    contrasena: String(row.contrasena),
    rol: String(row.rol),
    fotoUrl: row.fotoUrl != null ? String(row.fotoUrl) : null,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    experiencia: row.experiencia != null ? String(row.experiencia) : null,
    bloqueado: Boolean(row.bloqueado),
    createdAt: row.createdAt as Date,
    updatedAt: row.updatedAt as Date,
  };
}

export async function usuarioFindById(id: string): Promise<UsuarioRow | null> {
  const p = await getPool();
  const r = await p.request().input("id", sql.NVarChar(36), id).query(`SELECT * FROM [Usuario] WHERE [id] = @id`);
  return mapRow(r.recordset[0] as Record<string, unknown> | undefined);
}

export async function usuarioFindByCorreo(correo: string): Promise<UsuarioRow | null> {
  const p = await getPool();
  const r = await p
    .request()
    .input("correo", sql.NVarChar(255), correo)
    .query(`SELECT * FROM [Usuario] WHERE [correo] = @correo`);
  return mapRow(r.recordset[0] as Record<string, unknown> | undefined);
}

export async function usuarioCreate(data: {
  id: string;
  nombre: string;
  correo: string;
  telefono?: string | null;
  contrasena: string;
  rol: string;
}): Promise<void> {
  const p = await getPool();
  await p
    .request()
    .input("id", sql.NVarChar(36), data.id)
    .input("nombre", sql.NVarChar(255), data.nombre)
    .input("correo", sql.NVarChar(255), data.correo)
    .input("telefono", sql.NVarChar(50), data.telefono ?? null)
    .input("contrasena", sql.NVarChar(255), data.contrasena)
    .input("rol", sql.NVarChar(20), data.rol)
    .query(`
      INSERT INTO [Usuario] ([id],[nombre],[correo],[telefono],[contrasena],[rol])
      VALUES (@id, @nombre, @correo, @telefono, @contrasena, @rol)
    `);
}

export async function usuarioUpdate(
  id: string,
  patch: Partial<{
    nombre: string;
    telefono: string | null;
    experiencia: string | null;
    fotoUrl: string | null;
    lat: number | null;
    lng: number | null;
    contrasena: string;
  }>
): Promise<UsuarioRow | null> {
  const sets: string[] = [];
  const p = await getPool();
  const req = p.request().input("id", sql.NVarChar(36), id);
  if (patch.nombre !== undefined) {
    sets.push("[nombre] = @nombre");
    req.input("nombre", sql.NVarChar(255), patch.nombre);
  }
  if (patch.telefono !== undefined) {
    sets.push("[telefono] = @telefono");
    req.input("telefono", sql.NVarChar(50), patch.telefono);
  }
  if (patch.experiencia !== undefined) {
    sets.push("[experiencia] = @experiencia");
    req.input("experiencia", sql.NVarChar(sql.MAX), patch.experiencia);
  }
  if (patch.fotoUrl !== undefined) {
    sets.push("[fotoUrl] = @fotoUrl");
    req.input("fotoUrl", sql.NVarChar(1000), patch.fotoUrl);
  }
  if (patch.lat !== undefined) {
    sets.push("[lat] = @lat");
    req.input("lat", sql.Float, patch.lat);
  }
  if (patch.lng !== undefined) {
    sets.push("[lng] = @lng");
    req.input("lng", sql.Float, patch.lng);
  }
  if (patch.contrasena !== undefined) {
    sets.push("[contrasena] = @contrasena");
    req.input("contrasena", sql.NVarChar(255), patch.contrasena);
  }
  if (sets.length === 0) return usuarioFindById(id);
  sets.push("[updatedAt] = SYSUTCDATETIME()");
  await req.query(`UPDATE [Usuario] SET ${sets.join(", ")} WHERE [id] = @id`);
  return usuarioFindById(id);
}

export async function usuarioCountSearch(q?: string): Promise<number> {
  const p = await getPool();
  const req = p.request();
  let sqlWhere = "1=1";
  if (q?.trim()) {
    const like = `%${likeEscape(q.trim())}%`;
    req.input("q", sql.NVarChar(200), like);
    sqlWhere = "([nombre] LIKE @q ESCAPE '\\' OR [correo] LIKE @q ESCAPE '\\')";
  }
  const r = await req.query(`SELECT COUNT(*) AS c FROM [Usuario] WHERE ${sqlWhere}`);
  return Number((r.recordset[0] as { c: number })?.c ?? 0);
}

export async function usuarioListAdmin(
  skip: number,
  limit: number,
  q?: string
): Promise<
  Array<{
    id: string;
    nombre: string;
    correo: string;
    telefono: string | null;
    rol: string;
    fotoUrl: string | null;
    bloqueado: boolean;
    createdAt: Date;
  }>
> {
  const p = await getPool();
  const req = p.request().input("skip", sql.Int, skip).input("limit", sql.Int, limit);
  let sqlWhere = "1=1";
  if (q?.trim()) {
    const like = `%${likeEscape(q.trim())}%`;
    req.input("q", sql.NVarChar(200), like);
    sqlWhere = "([nombre] LIKE @q ESCAPE '\\' OR [correo] LIKE @q ESCAPE '\\')";
  }
  const r = await req.query(`
    SELECT [id],[nombre],[correo],[telefono],[rol],[fotoUrl],[bloqueado],[createdAt]
    FROM [Usuario]
    WHERE ${sqlWhere}
    ORDER BY [createdAt] DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY
  `);
  return (r.recordset as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    nombre: String(row.nombre),
    correo: String(row.correo),
    telefono: row.telefono != null ? String(row.telefono) : null,
    rol: String(row.rol),
    fotoUrl: row.fotoUrl != null ? String(row.fotoUrl) : null,
    bloqueado: Boolean(row.bloqueado),
    createdAt: row.createdAt as Date,
  }));
}

export async function usuarioSetBloqueado(
  id: string,
  bloqueado: boolean
): Promise<{ id: string; nombre: string; correo: string; rol: string; bloqueado: boolean } | null> {
  const p = await getPool();
  await p
    .request()
    .input("id", sql.NVarChar(36), id)
    .input("bloqueado", sql.Bit, bloqueado ? 1 : 0)
    .query(`UPDATE [Usuario] SET [bloqueado] = @bloqueado, [updatedAt] = SYSUTCDATETIME() WHERE [id] = @id`);
  const u = await usuarioFindById(id);
  if (!u) return null;
  return {
    id: u.id,
    nombre: u.nombre,
    correo: u.correo,
    rol: u.rol,
    bloqueado: u.bloqueado,
  };
}

export async function usuarioCountTotal(): Promise<number> {
  const p = await getPool();
  const r = await p.query(`SELECT COUNT(*) AS c FROM [Usuario]`);
  return Number((r.recordset[0] as { c: number })?.c ?? 0);
}

export async function usuarioCountByRol(rol: Rol): Promise<number> {
  const p = await getPool();
  const r = await p
    .request()
    .input("rol", sql.NVarChar(20), rol)
    .query(`SELECT COUNT(*) AS c FROM [Usuario] WHERE [rol] = @rol`);
  return Number((r.recordset[0] as { c: number })?.c ?? 0);
}

function likeEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_").replace(/\[/g, "\\[");
}
