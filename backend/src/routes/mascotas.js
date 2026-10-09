import { Router } from "express";
import { prisma } from "../db.js";
import { autenticar, requireRol } from "../middleware/auth.js";
import { generarCodigoMascota } from "../utils.js";

const router = Router();
router.use(autenticar);

// GET /api/mascotas/buscar?q= — búsqueda en tiempo real por nombre o código (RF-02)
router.get("/buscar", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 1) return res.json([]);
  const resultados = await prisma.mascota.findMany({
    where: {
      OR: [
        { nombre: { contains: q, mode: "insensitive" } },
        { codigo: { contains: q, mode: "insensitive" } },
        { propietario: { nombre: { contains: q, mode: "insensitive" } } },
      ],
    },
    include: { propietario: { select: { nombre: true, telefono: true } }, alergias: true },
    take: 10,
    orderBy: { nombre: "asc" },
  });
  res.json(resultados);
});

// GET /api/mascotas/:id — ficha completa: historial clínico, vacunas, alergias (RF-04, RF-07)
router.get("/:id", async (req, res) => {
  const mascota = await prisma.mascota.findUnique({
    where: { id: req.params.id },
    include: {
      propietario: true,
      alergias: true,
      consultas: {
        orderBy: { createdAt: "desc" },
        include: { veterinario: { select: { nombre: true } } },
      },
      vacunas: { orderBy: { fechaAplicacion: "desc" } },
      citas: {
        where: { estado: { notIn: ["CANCELADA", "COMPLETADA"] }, fechaHora: { gte: new Date() } },
        orderBy: { fechaHora: "asc" },
        include: { veterinario: { select: { nombre: true } } },
      },
    },
  });
  if (!mascota) return res.status(404).json({ error: "Mascota no encontrada" });
  res.json(mascota);
});

// POST /api/mascotas — registrar paciente con dueño nuevo o existente (RF-01)
// Solo recepcionista. Flujo de máximo 5 pasos (RS-09): un solo request.
router.post("/", requireRol("RECEPCIONISTA"), async (req, res) => {
  const { propietarioId, propietarioNuevo, nombre, especie, raza, edadAnios, sexo, color, alergias } = req.body;

  if (!nombre || !especie || !raza || edadAnios === undefined || !sexo) {
    return res.status(400).json({ error: "Datos de la mascota incompletos" });
  }
  if (!propietarioId && !propietarioNuevo?.nombre) {
    return res.status(400).json({ error: "Debes indicar un propietario existente o registrar uno nuevo" });
  }

  // Crear propietario nuevo si aplica
  let propId = propietarioId;
  if (!propId) {
    const { nombre: pNombre, telefono, email, direccion } = propietarioNuevo;
    if (!pNombre || !telefono) {
      return res.status(400).json({ error: "Nombre y teléfono del propietario son obligatorios" });
    }
    const prop = await prisma.propietario.create({
      data: { nombre: pNombre, telefono, email, direccion },
    });
    propId = prop.id;
  }

  // Generar código único con reintentos ante colisión (garantiza no duplicidad)
  let mascota;
  for (let intento = 0; intento < 5; intento++) {
    try {
      mascota = await prisma.mascota.create({
        data: {
          codigo: generarCodigoMascota(),
          nombre,
          especie,
          raza,
          edadAnios: Number(edadAnios),
          sexo,
          color,
          propietarioId: propId,
          alergias: {
            create: (alergias || []).filter((a) => a?.medicamento),
          },
        },
        include: { propietario: true, alergias: true },
      });
      break;
    } catch (e) {
      if (e.code !== "P2002") throw e; // P2002 = colisión de unique → reintentar
    }
  }
  if (!mascota) return res.status(500).json({ error: "No se pudo generar el código único" });
  res.status(201).json(mascota);
});

// POST /api/mascotas/:id/alergias — agregar alergia (RS-03)
router.post("/:id/alergias", requireRol("VETERINARIO", "RECEPCIONISTA"), async (req, res) => {
  const { medicamento, descripcion } = req.body;
  if (!medicamento) return res.status(400).json({ error: "El medicamento es obligatorio" });
  const alergia = await prisma.alergia.create({
    data: { medicamento, descripcion, mascotaId: req.params.id },
  });
  res.status(201).json(alergia);
});

// DELETE /api/alergias/:id lo montamos aquí por simplicidad de la API
export const alergiasRouter = Router();
alergiasRouter.delete("/:id", autenticar, requireRol("VETERINARIO"), async (req, res) => {
  await prisma.alergia.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

// GET /api/mascotas/propietarios/lista — propietarios para el selector de recepción
// (ruta separada en propietarios.js para claridad)

export default router;
