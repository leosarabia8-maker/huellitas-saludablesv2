// Cliente HTTP central: adjunta el JWT y maneja errores
const BASE = import.meta.env.VITE_API_URL || "";

export function getSesion() {
  const raw = localStorage.getItem("huellitas_sesion");
  return raw ? JSON.parse(raw) : null;
}

export function guardarSesion(sesion) {
  localStorage.setItem("huellitas_sesion", JSON.stringify(sesion));
}

export function cerrarSesion() {
  localStorage.removeItem("huellitas_sesion");
}

export async function api(path, { method = "GET", body } = {}) {
  const sesion = getSesion();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sesion ? { Authorization: `Bearer ${sesion.token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    cerrarSesion();
    window.location.href = "/login";
    throw new Error("Sesión expirada");
  }
  const data = res.status === 204 ? null : await res.json();
  if (!res.ok) {
    const err = new Error(data?.error || "Error en la solicitud");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
