import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import { Rol } from "../constants/enums.js";
import { usuarioCreate, usuarioFindByCorreo } from "../db/usuarios.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken } from "../utils/jwt.js";

const router = Router();

const registerSchema = z.object({
  nombre: z.string().min(2),
  correo: z.string().email(),
  telefono: z.string().optional(),
  contrasena: z.string().min(8),
  rol: z.enum([Rol.CLIENTE, Rol.PROVEEDOR]).optional(),
});

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos.", detalles: parsed.error.flatten() });
    return;
  }
  const { nombre, correo, telefono, contrasena, rol } = parsed.data;
  const rolFinal = rol ?? Rol.CLIENTE;
  const existe = await usuarioFindByCorreo(correo.toLowerCase());
  if (existe) {
    res.status(409).json({ error: "El correo ya está registrado." });
    return;
  }

  const hash = await hashPassword(contrasena);
  const id = nanoid();
  await usuarioCreate({
    id,
    nombre,
    correo: correo.toLowerCase(),
    telefono,
    contrasena: hash,
    rol: rolFinal,
  });
  res.status(201).json({
    mensaje: "Usuario registrado correctamente.",
    usuarioId: id,
  });
});

const loginSchema = z.object({
  correo: z.string().email(),
  contrasena: z.string(),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Datos inválidos.", detalles: parsed.error.flatten() });
    return;
  }
  const { correo, contrasena } = parsed.data;
  const usuario = await usuarioFindByCorreo(correo.toLowerCase());
  if (!usuario || !(await verifyPassword(contrasena, usuario.contrasena))) {
    res.status(401).json({ error: "Credenciales incorrectas." });
    return;
  }
  if (usuario.bloqueado) {
    res.status(403).json({ error: "Cuenta suspendida. Contacte soporte." });
    return;
  }
  const token = signAccessToken(usuario.id, usuario.rol as Rol);
  res.json({
    accessToken: token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  });
});

export default router;
