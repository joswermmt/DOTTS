import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { categoriaFindById } from "../db/categorias.js";
import {
  servicioCount,
  servicioCreate,
  servicioFindByIdFull,
  servicioList,
} from "../db/servicios.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { Rol } from "../constants/enums.js";
import { distanciaKm } from "../utils/geo.js";

const router = Router();

router.get("/", async (req, res) => {
  const qSchema = z.object({
    categoriaId: z.coerce.number().int().optional(),
    q: z.string().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    distanciaKm: z.coerce.number().positive().max(500).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  });
  const parsed = qSchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Parámetros inválidos." });
    return;
  }
  const { categoriaId, q, lat, lng, distanciaKm: maxKm, page = 1, limit = 20 } = parsed.data;
  const skip = (page - 1) * limit;

  const total = await servicioCount(categoriaId, q);
  const rows = await servicioList(skip, limit, categoriaId, q);

  let items = rows.map((s) => ({
    ...s,
    precio: Number(s.precio),
  }));

  if (lat != null && lng != null && maxKm != null) {
    items = items.filter((s) => {
      const plat = s.proveedor.lat;
      const plng = s.proveedor.lng;
      if (plat == null || plng == null) return false;
      return distanciaKm(lat, lng, plat, plng) <= maxKm;
    });
  }

  res.json({
    total,
    pagina: page,
    limite: limit,
    servicios: items,
  });
});

router.get("/:id", async (req, res) => {
  const s = await servicioFindByIdFull(req.params.id);
  if (!s) {
    res.status(404).json({ error: "Servicio no encontrado." });
    return;
  }
  res.json({
    servicio: {
      ...s,
      precio: Number(s.precio),
    },
  });
});

const createSchema = z.object({
  titulo: z.string().min(3),
  descripcion: z.string().min(10),
  precio: z.number().positive(),
  esFijo: z.boolean().optional(),
  categoriaId: z.number().int().positive(),
});

router.post("/", requireAuth, requireRole(Rol.PROVEEDOR), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos.", detalles: parsed.error.flatten() });
    return;
  }
  const { titulo, descripcion, precio, esFijo, categoriaId } = parsed.data;
  const cat = await categoriaFindById(categoriaId);
  if (!cat) {
    res.status(400).json({ error: "Categoría no válida." });
    return;
  }
  const s = await servicioCreate({
    id: nanoid(),
    titulo,
    descripcion,
    precio,
    esFijo: esFijo ?? true,
    categoriaId,
    proveedorId: req.userId!,
  });
  if (!s) {
    res.status(500).json({ error: "No se pudo crear el servicio." });
    return;
  }
  res.status(201).json({
    mensaje: "Servicio publicado.",
    servicio: { ...s, precio: Number(s.precio) },
  });
});

export default router;
