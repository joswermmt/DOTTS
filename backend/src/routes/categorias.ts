import { Router } from "express";
import { categoriaListAll } from "../db/categorias.js";

const router = Router();

router.get("/", async (_req, res) => {
  const categorias = await categoriaListAll();
  res.json({ categorias });
});

export default router;
