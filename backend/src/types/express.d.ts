import type { Rol } from "../constants/enums.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRol?: Rol;
    }
  }
}

export {};
