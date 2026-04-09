import sql from "mssql";
import { getPool } from "../lib/pool.js";
import type { Rol } from "../constants/enums.js";

export type SolicitudBare = {
  id: string;
  servicioId: string;
  clienteId: string;
  proveedorId: string;
  estado: string;
  programadoPara: Date | null;
  detalles: string | null;
  esInmediato: boolean;
  solicitadoEn: Date;
  updatedAt: Date;
};

export type SolicitudFullJson = {
  id: string;
  servicioId: string;
  clienteId: string;
  proveedorId: string;
  estado: string;
  programadoPara: Date | null;
  detalles: string | null;
  esInmediato: boolean;
  solicitadoEn: Date;
  updatedAt: Date;
  servicio: {
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    categoria: { id: number; nombre: string; descripcion: string | null };
  };
  cliente: { id: string; nombre: string; telefono: string | null; fotoUrl?: string | null };
  proveedor: { id: string; nombre: string; telefono: string | null; fotoUrl?: string | null };
};

function mapFull(row: Record<string, unknown>): SolicitudFullJson {
  return {
    id: String(row.id),
    servicioId: String(row.servicioId),
    clienteId: String(row.clienteId),
    proveedorId: String(row.proveedorId),
    estado: String(row.estado),
    programadoPara: row.programadoPara ? (row.programadoPara as Date) : null,
    detalles: row.detalles != null ? String(row.detalles) : null,
    esInmediato: Boolean(row.esInmediato),
    solicitadoEn: row.solicitadoEn as Date,
    updatedAt: row.updatedAt as Date,
    servicio: {
      id: String(row.svId),
      titulo: String(row.svcTitulo),
      descripcion: String(row.svcDesc),
      precio: Number(row.svcPrecio),
      categoria: {
        id: Number(row.catId),
        nombre: String(row.catNombre),
        descripcion: row.catDesc != null ? String(row.catDesc) : null,
      },
    },
    cliente: {
      id: String(row.cliId),
      nombre: String(row.cliNombre),
      telefono: row.cliTel != null ? String(row.cliTel) : null,
      fotoUrl: row.cliFoto != null ? String(row.cliFoto) : null,
    },
    proveedor: {
      id: String(row.prvId),
      nombre: String(row.prvNombre),
      telefono: row.prvTel != null ? String(row.prvTel) : null,
      fotoUrl: row.prvFoto != null ? String(row.prvFoto) : null,
    },
  };
}

const fullSelect = `
  sol.[id], sol.[servicioId], sol.[clienteId], sol.[proveedorId], sol.[estado], sol.[programadoPara], sol.[detalles],
  sol.[esInmediato], sol.[solicitadoEn], sol.[updatedAt],
  sv.[id] AS svId, sv.[titulo] AS svcTitulo, sv.[descripcion] AS svcDesc, sv.[precio] AS svcPrecio,
  c.[id] AS catId, c.[nombre] AS catNombre, c.[descripcion] AS catDesc,
  cli.[id] AS cliId, cli.[nombre] AS cliNombre, cli.[telefono] AS cliTel, cli.[fotoUrl] AS cliFoto,
  prv.[id] AS prvId, prv.[nombre] AS prvNombre, prv.[telefono] AS prvTel, prv.[fotoUrl] AS prvFoto
`;

const fullJoins = `
  FROM [SolicitudServicio] sol
  INNER JOIN [Servicio] sv ON sol.[servicioId] = sv.[id]
  INNER JOIN [Categoria] c ON sv.[categoriaId] = c.[id]
  INNER JOIN [Usuario] cli ON sol.[clienteId] = cli.[id]
  INNER JOIN [Usuario] prv ON sol.[proveedorId] = prv.[id]
`;

export async function solicitudFindBare(id: string): Promise<SolicitudBare | null> {
  const p = await getPool();
  const r = await p.request().input("id", sql.NVarChar(36), id).query(`
    SELECT * FROM [SolicitudServicio] WHERE [id] = @id
  `);
  const row = r.recordset[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    servicioId: String(row.servicioId),
    clienteId: String(row.clienteId),
    proveedorId: String(row.proveedorId),
    estado: String(row.estado),
    programadoPara: row.programadoPara ? (row.programadoPara as Date) : null,
    detalles: row.detalles != null ? String(row.detalles) : null,
    esInmediato: Boolean(row.esInmediato),
    solicitadoEn: row.solicitadoEn as Date,
    updatedAt: row.updatedAt as Date,
  };
}

export async function solicitudFindFull(id: string): Promise<SolicitudFullJson | null> {
  const p = await getPool();
  const r = await p.request().input("id", sql.NVarChar(36), id).query(`
    SELECT ${fullSelect} ${fullJoins} WHERE sol.[id] = @id
  `);
  const row = r.recordset[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return mapFull(row);
}

export async function solicitudCreate(data: {
  id: string;
  servicioId: string;
  clienteId: string;
  proveedorId: string;
  estado: string;
  programadoPara: Date | null;
  detalles: string | undefined;
  esInmediato: boolean;
}): Promise<SolicitudFullJson | null> {
  const p = await getPool();
  await p
    .request()
    .input("id", sql.NVarChar(36), data.id)
    .input("servicioId", sql.NVarChar(36), data.servicioId)
    .input("clienteId", sql.NVarChar(36), data.clienteId)
    .input("proveedorId", sql.NVarChar(36), data.proveedorId)
    .input("estado", sql.NVarChar(30), data.estado)
    .input("programadoPara", sql.DateTime2, data.programadoPara)
    .input("detalles", sql.NVarChar(sql.MAX), data.detalles ?? null)
    .input("esInmediato", sql.Bit, data.esInmediato ? 1 : 0)
    .query(`
      INSERT INTO [SolicitudServicio]
        ([id],[servicioId],[clienteId],[proveedorId],[estado],[programadoPara],[detalles],[esInmediato])
      VALUES (@id, @servicioId, @clienteId, @proveedorId, @estado, @programadoPara, @detalles, @esInmediato)
    `);
  return solicitudFindFull(data.id);
}

export async function solicitudUpdateEstado(id: string, estado: string): Promise<SolicitudFullJson | null> {
  const p = await getPool();
  await p
    .request()
    .input("id", sql.NVarChar(36), id)
    .input("estado", sql.NVarChar(30), estado)
    .query(`UPDATE [SolicitudServicio] SET [estado] = @estado, [updatedAt] = SYSUTCDATETIME() WHERE [id] = @id`);
  return solicitudFindFull(id);
}

function buildListWhere(
  role: Rol,
  userId: string,
  estado?: string
): { clause: string; inputs: (req: sql.Request) => void } {
  const parts: string[] = [];
  const inputs: Array<(req: sql.Request) => void> = [];

  if (role === "ADMIN") {
    parts.push("1=1");
  } else if (role === "CLIENTE") {
    parts.push("sol.[clienteId] = @uid");
    inputs.push((req) => req.input("uid", sql.NVarChar(36), userId));
  } else if (role === "PROVEEDOR") {
    parts.push("sol.[proveedorId] = @uid");
    inputs.push((req) => req.input("uid", sql.NVarChar(36), userId));
  } else {
    parts.push("1=0");
  }

  if (estado) {
    parts.push("sol.[estado] = @estado");
    inputs.push((req) => req.input("estado", sql.NVarChar(30), estado));
  }

  return {
    clause: parts.join(" AND "),
    inputs: (req) => inputs.forEach((fn) => fn(req)),
  };
}

export async function solicitudCount(role: Rol, userId: string, estado?: string): Promise<number> {
  const p = await getPool();
  const { clause, inputs } = buildListWhere(role, userId, estado);
  const req = p.request();
  inputs(req);
  const r = await req.query(`
    SELECT COUNT(*) AS c ${fullJoins} WHERE ${clause}
  `);
  return Number((r.recordset[0] as { c: number })?.c ?? 0);
}

export async function solicitudList(
  role: Rol,
  userId: string,
  skip: number,
  limit: number,
  estado?: string
): Promise<SolicitudFullJson[]> {
  const p = await getPool();
  const { clause, inputs } = buildListWhere(role, userId, estado);
  const req = p.request().input("skip", sql.Int, skip).input("limit", sql.Int, limit);
  inputs(req);
  const r = await req.query(`
    SELECT ${fullSelect} ${fullJoins}
    WHERE ${clause}
    ORDER BY sol.[solicitadoEn] DESC
    OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY
  `);
  return (r.recordset as Array<Record<string, unknown>>).map(mapFull);
}

export async function solicitudCountTotal(): Promise<number> {
  const p = await getPool();
  const r = await p.query(`SELECT COUNT(*) AS c FROM [SolicitudServicio]`);
  return Number((r.recordset[0] as { c: number })?.c ?? 0);
}
