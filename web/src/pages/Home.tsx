import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, apiFetch } from "../api/client";

export function Home() {
  const [apiOk, setApiOk] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch<{ ok: boolean }>("/health", { auth: false })
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false));
  }, []);

  return (
    <div className="page home">
      <section className="hero-block">
        <p className="eyebrow">Oficios tradicionales, digitalizados</p>
        <h1>Encuentra técnicos de confianza cerca de ti</h1>
        <p className="lede">
          Dotts conecta clientes con plomeros, electricistas, carpinteros y más. Solicita servicios
          inmediatos o agenda una visita.
        </p>
        <div className="hero-actions">
          <Link to="/registro" className="btn primary">
            Crear cuenta
          </Link>
          <Link to="/login" className="btn ghost">
            Ya tengo cuenta
          </Link>
        </div>
        <p className="api-status" role="status">
          API:{" "}
          {apiOk === null && "comprobando…"}
          {apiOk === true && (
            <>
              <span className="ok">en línea</span> ({API_BASE})
            </>
          )}
          {apiOk === false && (
            <>
              <span className="err">sin conexión</span> — revisa que el backend esté en marcha
            </>
          )}
        </p>
      </section>
    </div>
  );
}
