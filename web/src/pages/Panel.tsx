import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../api/client";

type Perfil = {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: string;
  fotoUrl: string | null;
  experiencia: string | null;
};

export function Panel() {
  const { refreshProfile } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ perfil: Perfil }>("/api/profile")
      .then((d) => {
        if (!cancelled) setPerfil(d.perfil);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      });
    refreshProfile().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  return (
    <div className="page">
      <h1>Tu perfil</h1>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {perfil && (
        <div className="card profile-card">
          <p>
            <strong>Nombre:</strong> {perfil.nombre}
          </p>
          <p>
            <strong>Correo:</strong> {perfil.correo}
          </p>
          <p>
            <strong>Teléfono:</strong> {perfil.telefono ?? "—"}
          </p>
          <p>
            <strong>Rol:</strong> {perfil.rol}
          </p>
          {perfil.experiencia && (
            <p>
              <strong>Experiencia:</strong> {perfil.experiencia}
            </p>
          )}
        </div>
      )}
      <p className="muted">
        La edición avanzada de perfil puede añadirse aquí (PUT /api/profile).
      </p>
    </div>
  );
}
