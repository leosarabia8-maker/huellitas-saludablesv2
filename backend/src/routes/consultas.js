import { Router } from "express";
import { prisma } from "../db.js";
import { autenticar, requireRol } from "../middleware/auth.js";

const router = Router();
router.use(autenticar);

// POST /api/consultas — registrar consulta médica (RF-04)
// Todos los campos son obligatorios (RS-02)
router.post("/", requireRol("VETERINARIO"), async (req, res) => {
  const { mascotaId, citaId, motivo, sintomas, diagnostico, tratamiento, confirmacionAlergia } = req.body;

  if (!mascotaId || !motivo || !sintomas || !diagnostico || !tratamiento) {
    return res.status(400).json({
      error: "Todos los campos son obligatorios: motivo, síntomas, diagnóstico y tratamiento",
    });
  }

  // RS-03: si el tratamiento menciona un medicamento al que la mascota es alérgica,
  // se exige confirmación explícita del veterinario
  const alergias = await prisma.alergia.findMany({ where: { mascotaId } });
  const alergenosDetectados = alergias
    .map((a) => a.medicamento)
    .filter((med) => tratamiento.toLowerCase().includes(med.toLowerCase()));

  if (alergenosDetectados.length > 0 && !confirmacionAlergia) {
    return res.status(409).json({
      requiereConfirmacion: true,
      error: `⚠️ ALERTA DE ALERGIA: el tratamiento menciona "${alergenosDetectados.join(", ")}" y esta mascota tiene alergia registrada. Confirma explícitamente si deseas continuar.`,
      alergenos: alergenosDetectados,
    });
  }

  const consulta = await prisma.consulta.create({
    data: {
      mascotaId,
      citaId: citaId || null,
      motivo,
      sintomas,
      diagnostico,
      tratamiento,
      veterinarioId: req.usuario.id, // trazabilidad automática (RF-05)
    },
    include: { veterinario: { select: { nombre: true } } },
  });

  // Si la consulta nació de una cita, marcarla como completada
  if (citaId) {
    await prisma.cita.updateMany({
      where: { id: citaId, estado: { not: "CANCELADA" } },
      data: { estado: "COMPLETADA" },
    });
  }

  res.status(201).json(consulta);
});

// GET /api/consultas?mascotaId= — historial clínico
router.get("/", requireRol("VETERINARIO", "RECEPCIONISTA"), async (req, res) => {
  const { mascotaId } = req.query;
  const consultas = await prisma.consulta.findMany({
    where: mascotaId ? { mascotaId } : {},
    include: {
      veterinario: { select: { nombre: true } },
      mascota: { select: { nombre: true, codigo: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(consultas);
});

export default router;
