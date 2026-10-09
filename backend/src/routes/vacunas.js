import { Router } from "express";
import { prisma } from "../db.js";
import { autenticar, requireRol } from "../middleware/auth.js";

const router = Router();
router.use(autenticar);

// Intervalos estándar de vacunación en días (para sugerir el cálculo)
const INTERVALOS_SUGERIDOS = {
  Rabia: 365,
  Parvovirus: 365,
  Moquillo: 365,
  "Triple felina": 365,
  "Leucemia felina": 365,
  "Tos de las perreras": 180,
  Desparasitación: 90,
};

// GET /api/vacunas/tipos — catálogo con intervalos sugeridos
router.get("/tipos", (req, res) => {
  res.json(
    Object.entries(INTERVALOS_SUGERIDOS).map(([tipo, intervaloDias]) => ({ tipo, intervaloDias }))
  );
});

// POST /api/vacunas — registrar vacuna y calcular próxima dosis (RF-07, RS-05)
router.post("/", requireRol("VETERINARIO"), async (req, res) => {
  const { mascotaId, tipo, dosis, fechaAplicacion, intervaloDias } = req.body;
  if (!mascotaId || !tipo || !dosis || !intervaloDias) {
    return res.status(400).json({ error: "mascotaId, tipo, dosis e intervaloDias son obligatorios" });
  }

  const aplicada = fechaAplicacion ? new Date(fechaAplicacion) : new Date();
  const proxima = new Date(aplicada);
  proxima.setDate(proxima.getDate() + Number(intervaloDias));

  const vacuna = await prisma.vacuna.create({
    data: {
      mascotaId,
      tipo,
      dosis,
      fechaAplicacion: aplicada,
      intervaloDias: Number(intervaloDias),
      proximaDosis: proxima, // cálculo automático
      veterinarioId: req.usuario.id,
    },
  });
  res.status(201).json(vacuna);
});

// GET /api/vacunas?mascotaId= — carné de vacunación (RS-12)
router.get("/", async (req, res) => {
  const { mascotaId } = req.query;
  if (!mascotaId) return res.status(400).json({ error: "mascotaId es obligatorio" });

  // El cliente solo puede ver el carné de sus propias mascotas
  if (req.usuario.rol === "CLIENTE") {
    const esSuya = await prisma.mascota.findFirst({
      where: { id: mascotaId, propietario: { usuarioId: req.usuario.id } },
    });
    if (!esSuya) return res.status(403).json({ error: "No puedes ver el carné de esta mascota" });
  }

  const vacunas = await prisma.vacuna.findMany({
    where: { mascotaId },
    include: { veterinario: { select: { nombre: true } } },
    orderBy: { fechaAplicacion: "desc" },
  });
  res.json(vacunas);
});

export default router;
