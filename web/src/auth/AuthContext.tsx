import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, getToken, setToken } from "../api/client";

export type Rol = "CLIENTE" | "PROVEEDOR" | "ADMIN";

export type UsuarioBasico = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
};

type AuthState = {
  user: UsuarioBasico | null;
  login: (correo: string, contrasena: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const USER_KEY = "dotts_user";

const AuthContext = createContext<AuthState | null>(null);

function loadStoredUser(): UsuarioBasico | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UsuarioBasico;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioBasico | null>(() => loadStoredUser());

  const persistUser = useCallback((u: UsuarioBasico | null) => {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
    setUser(u);
  }, []);

  const login = useCallback(async (correo: string, contrasena: string) => {
    const data = await apiFetch<{ accessToken: string; usuario: UsuarioBasico }>("/api/auth/login", {
      auth: false,
      method: "POST",
      body: JSON.stringify({ correo, contrasena }),
    });
    setToken(data.accessToken);
    persistUser(data.usuario);
  }, [persistUser]);

  const logout = useCallback(() => {
    setToken(null);
    persistUser(null);
  }, [persistUser]);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) return;
    const data = await apiFetch<{ perfil: UsuarioBasico & { telefono?: string | null } }>(
      "/api/profile"
    );
    const p = data.perfil;
    persistUser({
      id: p.id,
      nombre: p.nombre,
      correo: p.correo,
      rol: p.rol as Rol,
    });
  }, [persistUser]);

  const value = useMemo(
    () => ({ user, login, logout, refreshProfile }),
    [user, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
