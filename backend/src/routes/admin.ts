import { Router } from "express";
import { z } from "zod";
import { Rol } from "../constants/enums.js";
import {
  usuarioCountSearch,
  usuarioFindById,
  usuarioListAdmin,
  usuarioSetBloqueado,
  usuarioCountTotal,
  usuarioCountByRol,
} from "../db/usuarios.js";
import { servicioCountTotal } from "../db/servicios.js";
import { solicitudCountTotal } from "../db/solicitudes.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth, requireRole(Rol.ADMIN));

router.get("/usuarios", async (req, res) => {
  const qSchema = z.object({
    q: z.string().optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  });
  const parsed = qSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros inválidos." });
    return;
  }
  const { q, page = 1, limit = 20 } = parsed.data;
  const skip = (page - 1) * limit;

  const total = await usuarioCountSearch(q);
  const usuarios = await usuarioListAdmin(skip, limit, q);

  res.json({ total, pagina: page, limite: limit, usuarios });
});

const bloquearSchema = z.object({ bloqueado: z.boolean() });

router.patch("/usuarios/:id/bloquear", async (req, res) => {
  const parsed = bloquearSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Body inválido." });
    return;
  }
  const { bloqueado } = parsed.data;
  const id = req.params.id;
  const objetivo = await usuarioFindById(id);
  if (!objetivo) {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }
  if (objetivo.rol === Rol.ADMIN) {
    res.status(400).json({ error: "No se puede suspender a otro administrador desde esta ruta." });
    return;
  }
  const usuario = await usuarioSetBloqueado(id, bloqueado);
  res.json({ mensaje: bloqueado ? "Usuario suspendido." : "Usuario reactivado.", usuario });
});

router.get("/metricas", async (_req, res) => {
  const [usuarios, proveedores, servicios, solicitudes] = await Promise.all([
    usuarioCountTotal(),
    usuarioCountByRol(Rol.PROVEEDOR),
    servicioCountTotal(),
    solicitudCountTotal(),
  ]);
  res.json({
    usuariosTotal: usuarios,
    proveedores,
    serviciosPublicados: servicios,
    solicitudesTotal: solicitudes,
  });
});

export default router;
