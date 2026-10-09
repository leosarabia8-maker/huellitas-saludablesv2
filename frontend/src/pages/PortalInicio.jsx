import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

// Portal del cliente: mis mascotas + próximas vacunas (RS-10, RS-12)
export default function PortalInicio() {
  const [mascotas, setMascotas] = useState([]);
  const [proximas, setProximas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({ nombre: "", especie: "PERRO", raza: "", edadAnios: "", sexo: "H", color: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    Promise.all([api("/api/portal/mis-mascotas"), api("/api/portal/proximas-vacunas")])
      .then(([m, p]) => {
        setMascotas(m);
        setProximas(p);
      })
      .finally(() => setCargando(false));

  useEffect(() => {
    cargar();
  }, []);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  // El cliente registra su propia mascota (RS-10)
  const registrar = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await api("/api/portal/mis-mascotas", { method: "POST", body: { ...form, edadAnios: Number(form.edadAnios) } });
      setMostrarForm(false);
      setForm({ nombre: "", especie: "PERRO", raza: "", edadAnios: "", sexo: "H", color: "" });
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <p className="text-gray-400">Cargando...</p>;

  const hoy = new Date();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-teal-900">🐶 Mis mascotas</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-white border border-teal-600 text-teal-700 hover:bg-teal-50 font-semibold px-4 py-2 rounded-lg transition"
          >
            ➕ Registrar mascota
          </button>
          <Link
            to="/portal/agendar"
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            📅 Agendar cita
          </Link>
        </div>
      </div>

      {mostrarForm && (
        <form onSubmit={registrar} className="bg-white rounded-xl border border-teal-100 p-5 space-y-4">
          <h3 className="font-bold text-teal-900">🐾 Nueva mascota</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-600">Nombre *</label>
              <input value={form.nombre} onChange={set("nombre")} required placeholder="Ej: Firulais"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Especie *</label>
              <select value={form.especie} onChange={set("especie")}
                className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                <option value="PERRO">🐶 Perro</option>
                <option value="GATO">🐱 Gato</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Raza *</label>
              <input value={form.raza} onChange={set("raza")} required placeholder="Ej: Mestiza"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Edad (años) *</label>
              <input type="number" min="0" max="40" value={form.edadAnios} onChange={set("edadAnios")} required
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Sexo *</label>
              <select value={form.sexo} onChange={set("sexo")}
                className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                <option value="H">Hembra</option>
                <option value="M">Macho</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600">Color</label>
              <input value={form.color} onChange={set("color")} placeholder="Ej: Café"
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          </div>
          {error && <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={guardando}
              className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2 rounded-lg transition disabled:opacity-50">
              {guardando ? "Guardando..." : "✅ Guardar mascota"}
            </button>
            <button type="button" onClick={() => setMostrarForm(false)}
              className="text-gray-500 hover:text-gray-700 px-4 py-2 transition">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {mascotas.length === 0 && !mostrarForm ? (
        <div className="bg-white rounded-xl border border-teal-100 p-8 text-center text-gray-500">
          <p className="text-4xl mb-2">🐾</p>
          Aún no tienes mascotas registradas.{" "}
          <button onClick={() => setMostrarForm(true)} className="text-teal-600 font-semibold hover:underline">
            Registra tu primera mascota aquí
          </button>
        </div>
      ) : null}

      {mascotas.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          {mascotas.map((m) => (
            <Link
              key={m.id}
              to={`/portal/carnet/${m.id}`}
              className="bg-white rounded-xl border border-teal-100 p-5 hover:border-teal-400 hover:shadow transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-4xl">{m.especie === "PERRO" ? "🐶" : "🐱"}</span>
                <div>
                  <p className="font-bold text-teal-900 text-lg">
                    {m.nombre}
                    <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-mono">
                      {m.codigo}
                    </span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {m.raza} • {m.edadAnios} años
                  </p>
                </div>
              </div>
              <p className="text-teal-600 text-sm font-medium mt-3">Ver carné de vacunación →</p>
            </Link>
          ))}
        </div>
      )}

      <section className="bg-white rounded-xl border border-teal-100 p-5">
        <h3 className="font-bold text-teal-900 mb-3">💉 Próximas dosis preventivas</h3>
        {proximas.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin vacunas registradas todavía.</p>
        ) : (
          <div className="space-y-2">
            {proximas.map((v) => {
              const atrasada = new Date(v.proximaDosis) < hoy;
              return (
                <div key={v.id} className="flex flex-wrap justify-between items-center border rounded-lg p-3 text-sm gap-2">
                  <div>
                    <b>{v.mascota.nombre}</b> <span className="text-gray-400 font-mono text-xs">{v.mascota.codigo}</span>
                    <span className="mx-2">—</span> {v.tipo}
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      atrasada ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                    }`}
                  >
                    {atrasada ? "⚠️ Atrasada desde" : "Próxima dosis"}:{" "}
                    {new Date(v.proximaDosis).toLocaleDateString("es-EC", { dateStyle: "long" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
