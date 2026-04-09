/** Valores permitidos para columnas `rol` y `estado` en SQL Server (NVARCHAR). */
export const Rol = {
  CLIENTE: "CLIENTE",
  PROVEEDOR: "PROVEEDOR",
  ADMIN: "ADMIN",
} as const;
export type Rol = (typeof Rol)[keyof typeof Rol];

export const EstadoSolicitud = {
  PENDIENTE: "PENDIENTE",
  ACEPTADA: "ACEPTADA",
  RECHAZADA: "RECHAZADA",
  EN_PROGRESO: "EN_PROGRESO",
  COMPLETADA: "COMPLETADA",
  CANCELADA: "CANCELADA",
} as const;
export type EstadoSolicitud = (typeof EstadoSolicitud)[keyof typeof EstadoSolicitud];

const estados = new Set<string>(Object.values(EstadoSolicitud));

export function isEstadoSolicitud(v: string): v is EstadoSolicitud {
  return estados.has(v);
}
