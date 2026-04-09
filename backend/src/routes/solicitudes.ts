import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { EstadoSolicitud, isEstadoSolicitud, Rol, type EstadoSolicitud as EstadoSol } from "../constants/enums.js";
import { servicioFindProveedorId } from "../db/servicios.js";
import {
  solicitudCount,
  solicitudCreate,
  solicitudFindBare,
  solicitudList,
  solicitudUpdateEstado,
} from "../db/solicitudes.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

const createSchema = z.object({
  servicioId: z.string().min(1),
  esInmediato: z.boolean().optional(),
  programadoPara: z.coerce.date().optional().nullable(),
  detalles: z.string().optional(),
});

router.post("/", async (req, res) => {
  if (req.userRol !== Rol.CLIENTE) {
    res.status(403).json({ error: "Solo los clientes pueden crear solicitudes." });
    return;
  }
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos.", detalles: parsed.error.flatten() });
    return;
  }
  const { servicioId, esInmediato, programadoPara, detalles } = parsed.data;
  const proveedorId = await servicioFindProveedorId(servicioId);
  if (!proveedorId) {
    res.status(404).json({ error: "Servicio no encontrado." });
    return;
  }
  if (!esInmediato && !programadoPara) {
    res.status(400).json({ error: "Indique fecha y hora para un servicio programado." });
    return;
  }
  const inmediato = esInmediato ?? true;
  const solicitud = await solicitudCreate({
    id: nanoid(),
    servicioId,
    clienteId: req.userId!,
    proveedorId,
    estado: EstadoSolicitud.PENDIENTE,
    esInmediato: inmediato,
    programadoPara: inmediato ? null : (programadoPara ?? null),
    detalles,
  });
  if (!solicitud) {
    res.status(500).json({ error: "No se pudo crear la solicitud." });
    return;
  }
  res.status(201).json({
    mensaje: "Solicitud enviada. El proveedor será notificado.",
    solicitud: { ...solicitud, servicio: { ...solicitud.servicio, precio: Number(solicitud.servicio.precio) } },
  });
});

router.get("/", async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
  const skip = (page - 1) * limit;
  const estadoRaw = req.query.estado as string | undefined;
  const estado = estadoRaw && isEstadoSolicitud(estadoRaw) ? estadoRaw : undefined;

  if (
    req.userRol !== Rol.ADMIN &&
    req.userRol !== Rol.CLIENTE &&
    req.userRol !== Rol.PROVEEDOR
  ) {
    res.status(403).json({ error: "No autorizado." });
    return;
  }

  const total = await solicitudCount(req.userRol, req.userId!, estado);
  const rows = await solicitudList(req.userRol, req.userId!, skip, limit, estado);

  res.json({
    total,
    pagina: page,
    limite: limit,
    solicitudes: rows.map((s) => ({
      ...s,
      servicio: { ...s.servicio, precio: Number(s.servicio.precio) },
    })),
  });
});

const updateSchema = z.object({
  accion: z.enum(["aceptar", "rechazar", "en_progreso", "finalizar", "cancelar"]),
});

router.put("/:id", async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos.", detalles: parsed.error.flatten() });
    return;
  }
  const { accion } = parsed.data;
  const solicitud = await solicitudFindBare(req.params.id);
  if (!solicitud) {
    res.status(404).json({ error: "Solicitud no encontrada." });
    return;
  }

  let nuevoEstado: EstadoSol | null = null;

  if (accion === "cancelar") {
    if (req.userRol !== Rol.CLIENTE || solicitud.clienteId !== req.userId) {
      res.status(403).json({ error: "Solo el cliente puede cancelar su solicitud." });
      return;
    }
    if (
      solicitud.estado !== EstadoSolicitud.PENDIENTE &&
      solicitud.estado !== EstadoSolicitud.ACEPTADA
    ) {
      res.status(400).json({ error: "No se puede cancelar en este estado." });
      return;
    }
    nuevoEstado = EstadoSolicitud.CANCELADA;
  } else {
    if (req.userRol !== Rol.PROVEEDOR || solicitud.proveedorId !== req.userId) {
      res.status(403).json({ error: "Solo el proveedor de esta solicitud puede actualizarla." });
      return;
    }
    const transiciones: Record<string, Partial<Record<EstadoSol, EstadoSol>>> = {
      aceptar: { [EstadoSolicitud.PENDIENTE]: EstadoSolicitud.ACEPTADA },
      rechazar: { [EstadoSolicitud.PENDIENTE]: EstadoSolicitud.RECHAZADA },
      en_progreso: { [EstadoSolicitud.ACEPTADA]: EstadoSolicitud.EN_PROGRESO },
      finalizar: {
        [EstadoSolicitud.ACEPTADA]: EstadoSolicitud.COMPLETADA,
        [EstadoSolicitud.EN_PROGRESO]: EstadoSolicitud.COMPLETADA,
      },
    };
    const map = transiciones[accion];
    nuevoEstado = map?.[solicitud.estado as EstadoSol] ?? null;
    if (!nuevoEstado) {
      res.status(400).json({ error: "Transición no permitida para el estado actual." });
      return;
    }
  }

  const actualizada = await solicitudUpdateEstado(solicitud.id, nuevoEstado);
  if (!actualizada) {
    res.status(500).json({ error: "No se pudo actualizar." });
    return;
  }

  res.json({
    mensaje: "Solicitud actualizada.",
    solicitud: {
      ...actualizada,
      servicio: { ...actualizada.servicio, precio: Number(actualizada.servicio.precio) },
    },
  });
});

export default router;
