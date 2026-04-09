import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="layout">
      <header className="header">
        <Link to="/" className="logo">
          Dotts
        </Link>
        <nav className="nav" aria-label="Principal">
          {user ? (
            <>
              <Link to="/panel">Panel</Link>
              <Link to="/solicitudes">Solicitudes</Link>
              {user.rol === "ADMIN" && <Link to="/admin">Administración</Link>}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Entrar</Link>
              <Link to="/registro" className="nav-cta">
                Registrarse
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <span>Dotts · República Dominicana</span>
      </footer>
    </div>
  );
}
