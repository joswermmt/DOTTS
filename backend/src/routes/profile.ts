import { Router } from "express";
import { z } from "zod";
import { usuarioFindById, usuarioUpdate } from "../db/usuarios.js";
import { requireAuth } from "../middleware/auth.js";
import { hashPassword, verifyPassword } from "../utils/password.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const u = await usuarioFindById(req.userId!);
  if (!u) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }
  const { contrasena: _, ...publicUser } = u;
  res.json({ perfil: publicUser });
});

const updateSchema = z.object({
  nombre: z.string().min(2).optional(),
  telefono: z.string().optional().nullable(),
  experiencia: z.string().optional().nullable(),
  fotoUrl: z.string().url().optional().nullable(),
  lat: z.number().optional().nullable(),
  lng: z.number().optional().nullable(),
  contrasenaActual: z.string().optional(),
  contrasenaNueva: z.string().min(8).optional(),
});

router.put("/", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos.", detalles: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const actual = await usuarioFindById(req.userId!);
  if (!actual) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }
  if (data.contrasenaNueva) {
    if (!data.contrasenaActual || !(await verifyPassword(data.contrasenaActual, actual.contrasena))) {
      res.status(400).json({ error: "Contraseña actual incorrecta." });
      return;
    }
  }

  const patch: {
    nombre?: string;
    telefono?: string | null;
    experiencia?: string | null;
    fotoUrl?: string | null;
    lat?: number | null;
    lng?: number | null;
    contrasena?: string;
  } = {};
  if (data.nombre !== undefined) patch.nombre = data.nombre;
  if (data.telefono !== undefined) patch.telefono = data.telefono;
  if (data.experiencia !== undefined) patch.experiencia = data.experiencia;
  if (data.fotoUrl !== undefined) patch.fotoUrl = data.fotoUrl;
  if (data.lat !== undefined) patch.lat = data.lat;
  if (data.lng !== undefined) patch.lng = data.lng;
  if (data.contrasenaNueva) patch.contrasena = await hashPassword(data.contrasenaNueva);

  const u = await usuarioUpdate(req.userId!, patch);
  if (!u) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }
  const { contrasena: _, ...publicUser } = u;
  res.json({ mensaje: "Perfil actualizado.", perfil: publicUser });
});

export default router;
