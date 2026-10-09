import jwt from "jsonwebtoken";

// Verifica el token JWT y adjunta req.usuario
export function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.usuario = payload; // { id, nombre, email, rol }
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

// Restringe el acceso por rol: requireRol("VETERINARIO", "RECEPCIONISTA")
export function requireRol(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.usuario?.rol)) {
      return res.status(403).json({ error: "No tienes permisos para esta acción" });
    }
    next();
  };
}
