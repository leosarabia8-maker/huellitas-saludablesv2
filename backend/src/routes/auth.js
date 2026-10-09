import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../db.js";
import { autenticar } from "../middleware/auth.js";

const router = Router();

// POST /api/auth/registro — auto-registro exclusivo para CLIENTES (portal)
router.post("/registro", async (req, res) => {
  const { nombre, email, password, telefono } = req.body;
  if (!nombre || !email || !password || !telefono) {
    return res.status(400).json({ error: "nombre, email, password y teléfono son obligatorios" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
  }
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return res.status(409).json({ error: "Ya existe una cuenta con ese email" });

  const hash = await bcrypt.hash(password, 10);
  // Se crea el usuario CLIENTE y su perfil de propietario vinculado
  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      email,
      password: hash,
      rol: "CLIENTE",
      propietario: { create: { nombre, telefono, email } },
    },
  });
  res.status(201).json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "email y password son obligatorios" });
  }
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !(await bcrypt.compare(password, usuario.password))) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }
  if (!usuario.activo) {
    return res.status(403).json({ error: "Cuenta desactivada. Contacta a recepción." });
  }
  const payload = { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, usuario: payload });
});

// GET /api/auth/me — datos de la sesión actual
router.get("/me", autenticar, (req, res) => {
  res.json(req.usuario);
});

export default router;
