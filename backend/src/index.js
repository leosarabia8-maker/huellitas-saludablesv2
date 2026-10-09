import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.js";
import mascotasRoutes, { alergiasRouter } from "./routes/mascotas.js";
import propietariosRoutes, { veterinariosRouter } from "./routes/propietarios.js";
import citasRoutes from "./routes/citas.js";
import consultasRoutes from "./routes/consultas.js";
import vacunasRoutes from "./routes/vacunas.js";
import portalRoutes from "./routes/portal.js";
import doctoresRoutes from "./routes/doctores.js";

const app = express();

// CORS: en desarrollo permite el servidor de Vite; en producción, el dominio del frontend
const origenesPermitidos = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({ origin: origenesPermitidos }));
app.use(express.json());

// Salud del servicio
app.get("/api/health", (req, res) => res.json({ ok: true, servicio: "Huellitas Saludables API" }));

app.use("/api/auth", authRoutes);
app.use("/api/mascotas", mascotasRoutes);
app.use("/api/alergias", alergiasRouter);
app.use("/api/propietarios", propietariosRoutes);
app.use("/api/veterinarios", veterinariosRouter);
app.use("/api/citas", citasRoutes);
app.use("/api/consultas", consultasRoutes);
app.use("/api/vacunas", vacunasRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/doctores", doctoresRoutes);

// Manejador de errores centralizado
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🐾 API Huellitas Saludables en http://localhost:${PORT}`);
});
