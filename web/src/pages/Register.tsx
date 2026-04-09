import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/client";
import type { Rol } from "../auth/AuthContext";

export function Register() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [rol, setRol] = useState<Rol>("CLIENTE");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch<{ mensaje: string }>("/api/auth/register", {
        auth: false,
        method: "POST",
        body: JSON.stringify({
          nombre: nombre.trim(),
          correo: correo.trim(),
          telefono: telefono.trim() || undefined,
          contrasena,
          rol,
        }),
      });
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Crear cuenta</h1>
      <p className="muted">
        ¿Ya tienes cuenta? <Link to="/login">Entrar</Link>
      </p>
      <form className="form" onSubmit={onSubmit}>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          name="nombre"
          autoComplete="name"
          required
          minLength={2}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <label htmlFor="correo-r">Correo</label>
        <input
          id="correo-r"
          name="correo"
          type="email"
          autoComplete="email"
          required
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <label htmlFor="telefono">Teléfono (opcional)</label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          autoComplete="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
        />
        <label htmlFor="rol">Tipo de cuenta</label>
        <select id="rol" name="rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
          <option value="CLIENTE">Cliente — busco servicios</option>
          <option value="PROVEEDOR">Proveedor — ofrezco servicios</option>
        </select>
        <label htmlFor="contrasena-r">Contraseña (mín. 8 caracteres)</label>
        <input
          id="contrasena-r"
          name="contrasena"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn primary" disabled={loading}>
          {loading ? "Creando…" : "Registrarse"}
        </button>
      </form>
    </div>
  );
}
