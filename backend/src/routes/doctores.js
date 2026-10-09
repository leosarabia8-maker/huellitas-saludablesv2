import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../db.js";
import { autenticar, requireRol } from "../middleware/auth.js";

// Gestión de doctores (veterinarios): alta y activación/desactivación — solo recepción
const router = Router();
router.use(autenticar, requireRol("RECEPCIONISTA"));

// GET /api/doctores — todos los doctores, incluidos inactivos
router.get("/", async (req, res) => {
  const doctores = await prisma.usuario.findMany({
    where: { rol: "VETERINARIO" },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
      createdAt: true,
      _count: { select: { consultas: true, citasAtendidas: true } },
    },
    orderBy: { nombre: "asc" },
  });
  res.json(doctores);
});

// POST /api/doctores — alta de doctor (nombre, email, contraseña temporal)
router.post("/", async (req, res) => {
  const { nombre, email, password } = req.body;
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "nombre, email y password son obligatorios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return res.status(409).json({ error: "Ya existe una cuenta con ese email" });

  const doctor = await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: await bcrypt.hash(password, 10),
      rol: "VETERINARIO",
    },
    select: { id: true, nombre: true, email: true, activo: true, createdAt: true },
  });
  res.status(201).json(doctor);
});

// PATCH /api/doctores/:id/activo — activar o desactivar (no se borra: conserva su historial RF-05)
router.patch("/:id/activo", async (req, res) => {
  const { activo } = req.body;
  if (typeof activo !== "boolean") {
    return res.status(400).json({ error: "activo debe ser true o false" });
  }
  const doctor = await prisma.usuario.findFirst({
    where: { id: req.params.id, rol: "VETERINARIO" },
  });
  if (!doctor) return res.status(404).json({ error: "Doctor no encontrado" });

  const actualizado = await prisma.usuario.update({
    where: { id: doctor.id },
    data: { activo },
    select: { id: true, nombre: true, email: true, activo: true },
  });
  res.json(actualizado);
});

export default router;
