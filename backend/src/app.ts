import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import categoriasRoutes from "./routes/categorias.js";
import servicesRoutes from "./routes/services.js";
import solicitudesRoutes from "./routes/solicitudes.js";
import adminRoutes from "./routes/admin.js";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, servicio: "dotts-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/categorias", categoriasRoutes);
  app.use("/api/services", servicesRoutes);
  app.use("/api/requests", solicitudesRoutes);
  app.use("/api/admin", adminRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada." });
  });

  app.use(
    (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      console.error(err);
      res.status(500).json({ error: "Error interno del servidor." });
    }
  );

  return app;
}
