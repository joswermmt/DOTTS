import { useEffect, useState } from "react";
import { apiFetch } from "../api/client";

type UsuarioAdmin = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: string;
  bloqueado: boolean;
  createdAt: string;
};

type Metricas = {
  usuariosTotal: number;
  proveedores: number;
  serviciosPublicados: number;
  solicitudesTotal: number;
};

export function Admin() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    setError(null);
    const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    Promise.all([
      apiFetch<{ usuarios: UsuarioAdmin[] }>(`/api/admin/usuarios${qs}`),
      apiFetch<Metricas>("/api/admin/metricas"),
    ])
      .then(([u, m]) => {
        setUsuarios(u.usuarios);
        setMetricas(m);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- carga inicial
  }, []);

  async function toggleBloqueado(u: UsuarioAdmin) {
    try {
      await apiFetch(`/api/admin/usuarios/${u.id}/bloquear`, {
        method: "PATCH",
        body: JSON.stringify({ bloqueado: !u.bloqueado }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  }

  return (
    <div className="page">
      <h1>Administración</h1>
      {metricas && (
        <div className="metrics">
          <div className="card metric">
            <span className="metric-val">{metricas.usuariosTotal}</span>
            <span className="metric-lbl">Usuarios</span>
          </div>
          <div className="card metric">
            <span className="metric-val">{metricas.proveedores}</span>
            <span className="metric-lbl">Proveedores</span>
          </div>
          <div className="card metric">
            <span className="metric-val">{metricas.serviciosPublicados}</span>
            <span className="metric-lbl">Servicios</span>
          </div>
          <div className="card metric">
            <span className="metric-val">{metricas.solicitudesTotal}</span>
            <span className="metric-lbl">Solicitudes</span>
          </div>
        </div>
      )}
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar por nombre o correo…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Buscar usuarios"
        />
        <button type="button" className="btn secondary" onClick={load} disabled={loading}>
          Buscar
        </button>
      </div>
      {loading && <p className="muted">Cargando…</p>}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Rol</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.correo}</td>
              <td>{u.rol}</td>
              <td>{u.bloqueado ? <span className="err">Suspendido</span> : "Activo"}</td>
              <td>
                {u.rol !== "ADMIN" && (
                  <button type="button" className="link-btn" onClick={() => toggleBloqueado(u)}>
                    {u.bloqueado ? "Reactivar" : "Suspender"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
