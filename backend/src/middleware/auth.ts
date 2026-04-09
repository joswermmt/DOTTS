import type { Request, Response, NextFunction } from "express";
import type { Rol } from "../constants/enums.js";
import { verifyAccessToken } from "../utils/jwt.js";
import { usuarioFindById } from "../db/usuarios.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Se requiere autenticación." });
    return;
  }
  const token = header.slice(7);
  try {
    const { sub } = verifyAccessToken(token);
    const usuario = await usuarioFindById(sub);
    if (!usuario) {
      res.status(401).json({ error: "Usuario no válido." });
      return;
    }
    if (usuario.bloqueado) {
      res.status(403).json({ error: "Cuenta suspendida. Contacte soporte." });
      return;
    }
    req.userId = usuario.id;
    req.userRol = usuario.rol as Rol;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado." });
  }
}

export function requireRole(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRol || !roles.includes(req.userRol)) {
      res.status(403).json({ error: "No autorizado para esta acción." });
      return;
    }
    next();
  };
}
