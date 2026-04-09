import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type SolicitudRow = {
  id: string;
  estado: string;
  solicitadoEn: string;
  servicio: { titulo: string; precio: number };
  cliente: { nombre: string };
  proveedor: { nombre: string };
};

export function Solicitudes() {
  const { user } = useAuth();
  const [rows, setRows] = useState<SolicitudRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ solicitudes: SolicitudRow[] }>("/api/requests")
      .then((d) => {
        if (!cancelled) setRows(d.solicitudes);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const titulo =
    user?.rol === "CLIENTE"
      ? "Mis solicitudes"
      : user?.rol === "PROVEEDOR"
        ? "Solicitudes recibidas"
        : "Todas las solicitudes";

  return (
    <div className="page">
      <h1>{titulo}</h1>
      {loading && <p className="muted">Cargando…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && rows.length === 0 && <p className="muted">No hay solicitudes aún.</p>}
      <ul className="request-list">
        {rows.map((s) => (
          <li key={s.id} className="card request-card">
            <div className="request-head">
              <strong>{s.servicio.titulo}</strong>
              <span className="badge">{s.estado.replaceAll("_", " ")}</span>
            </div>
            <p className="muted small">
              {user?.rol === "PROVEEDOR" ? `Cliente: ${s.cliente.nombre}` : `Proveedor: ${s.proveedor.nombre}`}
            </p>
            <p className="price">{s.servicio.precio.toLocaleString("es-DO", { style: "currency", currency: "DOP" })}</p>
            <p className="muted small">{new Date(s.solicitadoEn).toLocaleString("es-DO")}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
