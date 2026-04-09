import type { config as SqlConfig } from "mssql";

/** Parsea DATABASE_URL estilo Prisma: sqlserver://host:port;database=...;user=...;password=... */
export function parsePrismaSqlServerUrl(url: string): SqlConfig {
  const raw = url.trim();
  if (!raw.startsWith("sqlserver://")) {
    throw new Error("DATABASE_URL debe comenzar con sqlserver://");
  }
  const rest = raw.slice("sqlserver://".length);
  const semi = rest.indexOf(";");
  const hostPort = semi === -1 ? rest : rest.slice(0, semi);
  const segments = semi === -1 ? [] : rest.slice(semi + 1).split(";").filter(Boolean);
  const params: Record<string, string> = {};
  for (const seg of segments) {
    const eq = seg.indexOf("=");
    if (eq === -1) continue;
    const k = seg.slice(0, eq).toLowerCase();
    params[k] = seg.slice(eq + 1);
  }
  const decode = (s: string) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  let server = "localhost";
  let port = 1433;
  if (hostPort.includes(":")) {
    const idx = hostPort.lastIndexOf(":");
    server = hostPort.slice(0, idx) || "localhost";
    port = parseInt(hostPort.slice(idx + 1), 10) || 1433;
  } else if (hostPort) {
    server = hostPort;
  }
  return {
    user: decode(params.user ?? ""),
    password: decode(params.password ?? ""),
    server,
    port,
    database: decode(params.database ?? "master"),
    options: {
      encrypt: params.encrypt === "true",
      trustServerCertificate: params.trustservercertificate === "true",
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 },
  };
}
