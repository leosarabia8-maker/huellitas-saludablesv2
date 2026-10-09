import { Router } from "express";
import { prisma } from "../db.js";
import { autenticar, requireRol } from "../middleware/auth.js";
import { generarCodigoMascota } from "../utils.js";

// Portal del cliente (RS-10, RS-12, RS-13)
const router = Router();
router.use(autenticar, requireRol("CLIENTE"));

// GET /api/portal/mis-mascotas
router.get("/mis-mascotas", async (req, res) => {
  const propietario = await prisma.propietario.findUnique({
    where: { usuarioId: req.usuario.id },
    include: {
      mascotas: {
        include: { alergias: true },
        orderBy: { nombre: "asc" },
      },
    },
  });
  res.json(propietario?.mascotas || []);
});

// POST /api/portal/mis-mascotas — el cliente registra su propia mascota (RS-10)
router.post("/mis-mascotas", async (req, res) => {
  const { nombre, especie, raza, edadAnios, sexo, color } = req.body;
  if (!nombre || !especie || !raza || edadAnios === undefined || !sexo) {
    return res.status(400).json({ error: "Datos de la mascota incompletos" });
  }
  if (!["PERRO", "GATO"].includes(especie)) {
    return res.status(400).json({ error: "La especie debe ser PERRO o GATO" });
  }
  if (!["M", "H"].includes(sexo)) {
    return res.status(400).json({ error: "El sexo debe ser M o H" });
  }

  // Perfil de propietario vinculado a la cuenta (se crea si la cuenta es antigua y no lo tiene)
  let propietario = await prisma.propietario.findUnique({
    where: { usuarioId: req.usuario.id },
  });
  if (!propietario) {
    propietario = await prisma.propietario.create({
      data: {
        nombre: req.usuario.nombre,
        telefono: "Por actualizar",
        email: req.usuario.email,
        usuarioId: req.usuario.id,
      },
    });
  }

  // Generar código único con reintentos ante colisión (misma lógica que recepción)
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
          propietarioId: propietario.id,
        },
        include: { alergias: true },
      });
      break;
    } catch (e) {
      if (e.code !== "P2002") throw e; // P2002 = colisión de unique → reintentar
    }
  }
  if (!mascota) return res.status(500).json({ error: "No se pudo generar el código único" });
  res.status(201).json(mascota);
});

// GET /api/portal/proximas-vacunas — próximas dosis de todas sus mascotas
router.get("/proximas-vacunas", async (req, res) => {
  const vacunas = await prisma.vacuna.findMany({
    where: { mascota: { propietario: { usuarioId: req.usuario.id } } },
    include: { mascota: { select: { nombre: true, codigo: true } } },
    orderBy: { proximaDosis: "asc" },
  });
  // Solo la próxima dosis más cercana por (mascota, tipo)
  const proximas = Object.values(
    vacunas.reduce((acc, v) => {
      const clave = v.mascotaId + v.tipo;
      if (!acc[clave] || v.proximaDosis < acc[clave].proximaDosis) acc[clave] = v;
      return acc;
    }, {})
  );
  res.json(proximas);
});

export default router;
