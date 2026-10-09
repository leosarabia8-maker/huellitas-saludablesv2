import { useState, useEffect } from "react";
import { api } from "../api.js";

// Gestión de doctores (solo recepción): alta y activación/desactivación
export default function Doctores() {
  const [doctores, setDoctores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    api("/api/doctores")
      .then(setDoctores)
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const crear = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await api("/api/doctores", { method: "POST", body: form });
      setMostrarForm(false);
      setForm({ nombre: "", email: "", password: "" });
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const alternarActivo = async (doctor) => {
    setError("");
    try {
      await api(`/api/doctores/${doctor.id}/activo`, { method: "PATCH", body: { activo: !doctor.activo } });
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  };

  if (cargando) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-teal-900">👩‍⚕️ Doctores</h2>
          <p className="text-gray-500 text-sm">Altas y activación del equipo veterinario</p>
        </div>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition"
        >
          ➕ Agregar doctor
        </button>
      </div>

      {mostrarForm && (
        <form onSubmit={crear} className="bg-white rounded-xl border border-teal-100 p-5 space-y-4">
          <h3 className="font-bold text-teal-900">Nuevo doctor</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Nombre completo *</label>
              <input value={form.nombre} onChange={set("nombre")} required placeholder="Ej: Dra. Ana Paredes"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Email *</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="doctor@huellitas.dev"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Contraseña temporal *</label>
              <input type="text" value={form.password} onChange={set("password")} required minLength={6} placeholder="Mín. 6 caracteres"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>
          {error && <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={guardando}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50">
              {guardando ? "Guardando..." : "✅ Crear cuenta"}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)}
              className="text-gray-500 hover:text-gray-700 px-4 py-2 transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && !mostrarForm && <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{error}</p>}

      <div className="bg-white rounded-xl border border-teal-100 divide-y">
        {doctores.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-bold text-teal-900">
                {d.nombre}
                <span
                  className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    d.activo ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {d.activo ? "Activo" : "Inactivo"}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                {d.email} • {d._count?.consultas ?? 0} consultas • {d._count?.citasAtendidas ?? 0} citas
              </p>
            </div>
            <button
              onClick={() => alternarActivo(d)}
              className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition ${
                d.activo
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-green-50 text-green-700 hover:bg-green-100"
              }`}
              title="Al desactivar no se borran sus consultas ni citas históricas"
            >
              {d.activo ? "🔒 Desactivar" : "🔓 Reactivar"}
            </button>
          </div>
        ))}
        {doctores.length === 0 && (
          <p className="p-6 text-center text-gray-400">No hay doctores registrados.</p>
        )}
      </div>

      <p className="text-xs text-gray-400">
        💡 Desactivar un doctor no borra su historial (trazabilidad): sus consultas y citas pasadas se conservan,
        pero ya no puede iniciar sesión ni recibir citas nuevas.
      </p>
    </div>
  );
}
