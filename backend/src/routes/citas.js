import { Router } from "express";
import { prisma } from "../db.js";
import { autenticar, requireRol } from "../middleware/auth.js";
import { generarSlots } from "../utils.js";

const router = Router();
router.use(autenticar);

// Valida que no haya cruce de horario para el veterinario (RNF-01, RS-08)
// Devuelve la cita conflictiva o null
async function buscarConflicto({ veterinarioId, fechaHora, duracionMin, excluirId }) {
  const inicio = new Date(fechaHora);
  const fin = new Date(inicio.getTime() + duracionMin * 60000);
  const diaInicio = new Date(inicio);
  diaInicio.setHours(0, 0, 0, 0);
  const diaFin = new Date(inicio);
  diaFin.setHours(23, 59, 59, 999);

  const citasDelDia = await prisma.cita.findMany({
    where: {
      veterinarioId,
      estado: { not: "CANCELADA" },
      fechaHora: { gte: diaInicio, lte: diaFin },
      ...(excluirId ? { id: { not: excluirId } } : {}),
    },
  });
  return citasDelDia.find((c) => {
    const cFin = new Date(new Date(c.fechaHora).getTime() + c.duracionMin * 60000);
    return new Date(c.fechaHora) < fin && inicio < cFin;
  });
}

// GET /api/citas?desde=&hasta= — citas para el calendario (RF-03)
router.get("/", async (req, res) => {
  const { desde, hasta } = req.query;
  const where = {};
  if (desde || hasta) {
    where.fechaHora = {};
    if (desde) where.fechaHora.gte = new Date(desde);
    if (hasta) where.fechaHora.lte = new Date(hasta);
  }
  // El cliente solo ve sus propias citas
  if (req.usuario.rol === "CLIENTE") {
    where.mascota = { propietario: { usuarioId: req.usuario.id } };
  }
  const citas = await prisma.cita.findMany({
    where,
    include: {
      mascota: { select: { id: true, nombre: true, codigo: true, especie: true } },
      veterinario: { select: { id: true, nombre: true } },
    },
    orderBy: { fechaHora: "asc" },
  });
  res.json(citas);
});

// GET /api/citas/disponibilidad?veterinarioId=&fecha=YYYY-MM-DD
// Slots disponibles para el portal del cliente (RS-10)
router.get("/disponibilidad", async (req, res) => {
  const { veterinarioId, fecha } = req.query;
  if (!veterinarioId || !fecha) {
    return res.status(400).json({ error: "veterinarioId y fecha son obligatorios" });
  }
  const citasDelDia = await prisma.cita.findMany({
    where: {
      veterinarioId,
      estado: { not: "CANCELADA" },
      fechaHora: {
        gte: new Date(fecha + "T00:00:00"),
        lte: new Date(fecha + "T23:59:59"),
      },
    },
  });
  res.json(generarSlots(fecha, citasDelDia));
});

// POST /api/citas — agendar (recepcionista o cliente)
router.post("/", requireRol("RECEPCIONISTA", "CLIENTE"), async (req, res) => {
  const { mascotaId, veterinarioId, fechaHora, motivo, duracionMin = 30 } = req.body;
  if (!mascotaId || !veterinarioId || !fechaHora || !motivo) {
    return res.status(400).json({ error: "mascotaId, veterinarioId, fechaHora y motivo son obligatorios" });
  }

  // Si es cliente, la mascota debe ser suya
  if (req.usuario.rol === "CLIENTE") {
    const mascota = await prisma.mascota.findFirst({
      where: { id: mascotaId, propietario: { usuarioId: req.usuario.id } },
    });
    if (!mascota) return res.status(403).json({ error: "Esa mascota no pertenece a tu cuenta" });
  }

  if (new Date(fechaHora) < new Date()) {
    return res.status(400).json({ error: "No se puede agendar en una fecha pasada" });
  }

  // El veterinario debe existir y estar activo
  const veterinario = await prisma.usuario.findFirst({
    where: { id: veterinarioId, rol: "VETERINARIO", activo: true },
  });
  if (!veterinario) {
    return res.status(400).json({ error: "El veterinario no existe o está inactivo" });
  }

  const conflicto = await buscarConflicto({ veterinarioId, fechaHora, duracionMin });
  if (conflicto) {
    // Mensaje de error específico (RS-08)
    return res.status(409).json({
      error: `Conflicto de horario: el veterinario ya tiene una cita a las ${new Date(conflicto.fechaHora).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })} ese día`,
    });
  }

  const cita = await prisma.cita.create({
    data: {
      mascotaId,
      veterinarioId,
      fechaHora: new Date(fechaHora),
      motivo,
      duracionMin: Number(duracionMin),
      estado: "CONFIRMADA", // confirmación inmediata (RS-11)
    },
    include: {
      mascota: { select: { nombre: true, codigo: true } },
      veterinario: { select: { nombre: true } },
    },
  });

  // Notificación en pantalla con fecha y hora (RS-11).
  // 📧 El correo de confirmación se simula en la demo (ver README).
  res.status(201).json({
    cita,
    confirmacion: `Cita confirmada para ${cita.mascota.nombre} (${cita.mascota.codigo}) el ${new Date(cita.fechaHora).toLocaleString("es-EC", { dateStyle: "full", timeStyle: "short" })} con ${cita.veterinario.nombre}. Se ha enviado un correo de confirmación (simulado).`,
  });
});

// PATCH /api/citas/:id — reprogramar o cambiar estado (RF-03)
router.patch("/:id", requireRol("RECEPCIONISTA", "CLIENTE"), async (req, res) => {
  const cita = await prisma.cita.findUnique({ where: { id: req.params.id } });
  if (!cita) return res.status(404).json({ error: "Cita no encontrada" });

  // El cliente solo puede tocar sus propias citas
  if (req.usuario.rol === "CLIENTE") {
    const esSuya = await prisma.mascota.findFirst({
      where: { id: cita.mascotaId, propietario: { usuarioId: req.usuario.id } },
    });
    if (!esSuya) return res.status(403).json({ error: "No puedes modificar esta cita" });
  }

  const { fechaHora, motivo, estado } = req.body;
  const data = {};
  if (motivo) data.motivo = motivo;
  if (estado && ["PENDIENTE", "CONFIRMADA", "CANCELADA", "COMPLETADA"].includes(estado)) {
    data.estado = estado;
  }
  if (fechaHora) {
    if (new Date(fechaHora) < new Date()) {
      return res.status(400).json({ error: "No se puede reprogramar a una fecha pasada" });
    }
    const conflicto = await buscarConflicto({
      veterinarioId: cita.veterinarioId,
      fechaHora,
      duracionMin: cita.duracionMin,
      excluirId: cita.id,
    });
    if (conflicto) {
      return res.status(409).json({
        error: `Conflicto de horario: el veterinario ya tiene una cita a las ${new Date(conflicto.fechaHora).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })} ese día`,
      });
    }
    data.fechaHora = new Date(fechaHora);
  }

  const actualizada = await prisma.cita.update({
    where: { id: cita.id },
    data,
    include: {
      mascota: { select: { nombre: true, codigo: true } },
      veterinario: { select: { nombre: true } },
    },
  });
  res.json(actualizada);
});

export default router;
