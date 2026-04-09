import jwt from "jsonwebtoken";
import type { Rol } from "../constants/enums.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-only-change-me";
const EXPIRES = "7d";

export type JwtPayload = { sub: string; rol: Rol };

export function signAccessToken(userId: string, rol: Rol): string {
  return jwt.sign({ sub: userId, rol }, JWT_SECRET, { expiresIn: EXPIRES });
}

export function verifyAccessToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  return decoded;
}
