import { Router } from "express";
import { prisma } from "../db.js";
import { autenticar, requireRol } from "../middleware/auth.js";

const router = Router();
router.use(autenticar);

// GET /api/propietarios — lista para el selector de recepción
router.get("/", requireRol("RECEPCIONISTA", "VETERINARIO"), async (req, res) => {
  const propietarios = await prisma.propietario.findMany({
    orderBy: { nombre: "asc" },
    include: { _count: { select: { mascotas: true } } },
  });
  res.json(propietarios);
});

export default router;

// GET /api/veterinarios — lista de veterinarios ACTIVOS para agendar
export const veterinariosRouter = Router();
veterinariosRouter.use(autenticar);
veterinariosRouter.get("/", async (req, res) => {
  const vets = await prisma.usuario.findMany({
    where: { rol: "VETERINARIO", activo: true },
    select: { id: true, nombre: true, email: true },
    orderBy: { nombre: "asc" },
  });
  res.json(vets);
});
