import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";

// Registro de paciente en recepción (RF-01, RS-06, RS-09)
// Flujo de 1 sola pantalla: dueño (existente o nuevo) + datos de mascota
export default function Pacientes() {
  const navigate = useNavigate();
  const [propietarios, setPropietarios] = useState([]);
  const [modo, setModo] = useState("existente"); // "existente" | "nuevo"
  const [propietarioId, setPropietarioId] = useState("");
  const [nuevoProp, setNuevoProp] = useState({ nombre: "", telefono: "", email: "", direccion: "" });
  const [mascota, setMascota] = useState({
    nombre: "",
    especie: "PERRO",
    raza: "",
    edadAnios: "",
    sexo: "M",
    color: "",
    alergia: "", // opcional: medicamento alérgico
  });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [creada, setCreada] = useState(null);

  useEffect(() => {
    api("/api/propietarios").then(setPropietarios).catch(() => {});
  }, []);

  const setM = (campo) => (e) => setMascota({ ...mascota, [campo]: e.target.value });
  const setP = (campo) => (e) => setNuevoProp({ ...nuevoProp, [campo]: e.target.value });

  const registrar = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const resultado = await api("/api/mascotas", {
        method: "POST",
        body: {
          ...(modo === "existente"
            ? { propietarioId }
            : { propietarioNuevo: nuevoProp }),
          ...mascota,
          alergias: mascota.alergia ? [{ medicamento: mascota.alergia }] : [],
        },
      });
      setCreada(resultado);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Pantalla de éxito con el ID único generado (RU-06)
  if (creada) {
    return (
      <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-teal-100 p-8 shadow">
        <div className="text-6xl mb-3">{creada.especie === "PERRO" ? "🐶" : "🐱"}</div>
        <h2 className="text-2xl font-bold text-teal-900">¡Paciente registrado!</h2>
        <p className="text-gray-500 mt-1">
          {creada.nombre} — dueño: {creada.propietario.nombre}
        </p>
        <p className="mt-4 text-sm text-gray-500">Identificador único generado:</p>
        <p className="text-3xl font-mono font-extrabold text-teal-700 bg-teal-50 rounded-xl py-3 mt-1 tracking-widest">
          {creada.codigo}
        </p>
        {creada.alergias.length > 0 && (
          <p className="mt-3 text-sm bg-red-100 text-red-700 rounded-lg p-2 font-semibold">
            ⚠️ Alergia registrada: {creada.alergias.map((a) => a.medicamento).join(", ")}
          </p>
        )}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate(`/pacientes/${creada.id}`)}
            className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Ver ficha clínica
          </button>
          <button
            onClick={() => {
              setCreada(null);
              setMascota({ nombre: "", especie: "PERRO", raza: "", edadAnios: "", sexo: "M", color: "", alergia: "" });
            }}
            className="flex-1 bg-gray-100 hover:bg-gray-200 font-semibold py-2.5 rounded-lg transition"
          >
            Registrar otra
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-teal-900 mb-1">🐾 Registrar nuevo paciente</h2>
      <p className="text-gray-500 mb-6">Se generará un ID único automáticamente</p>

      <form onSubmit={registrar} className="space-y-6">
        {/* Paso 1: propietario */}
        <section className="bg-white rounded-xl border border-teal-100 p-5">
          <h3 className="font-bold text-teal-900 mb-3">1️⃣ Propietario</h3>
          <div className="flex gap-2 mb-4">
            {[
              { v: "existente", t: "Cliente existente" },
              { v: "nuevo", t: "Nuevo propietario" },
            ].map((o) => (
              <button
                type="button"
                key={o.v}
                onClick={() => setModo(o.v)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  modo === o.v ? "bg-teal-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {o.t}
              </button>
            ))}
          </div>

          {modo === "existente" ? (
            <select
              value={propietarioId}
              onChange={(e) => setPropietarioId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none"
              required
            >
              <option value="">Seleccionar propietario...</option>
              {propietarios.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — 📞 {p.telefono} ({p._count.mascotas} mascota(s))
                </option>
              ))}
            </select>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <input placeholder="Nombre completo *" value={nuevoProp.nombre} onChange={setP("nombre")}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" required />
              <input placeholder="Teléfono *" value={nuevoProp.telefono} onChange={setP("telefono")}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" required />
              <input placeholder="Email (opcional)" type="email" value={nuevoProp.email} onChange={setP("email")}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
              <input placeholder="Dirección (opcional)" value={nuevoProp.direccion} onChange={setP("direccion")}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
            </div>
          )}
        </section>

        {/* Paso 2: mascota */}
        <section className="bg-white rounded-xl border border-teal-100 p-5">
          <h3 className="font-bold text-teal-900 mb-3">2️⃣ Datos de la mascota</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Nombre *" value={mascota.nombre} onChange={setM("nombre")}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" required />
            <select value={mascota.especie} onChange={setM("especie")}
              className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
              <option value="PERRO">🐶 Perro</option>
              <option value="GATO">🐱 Gato</option>
            </select>
            <input placeholder="Raza *" value={mascota.raza} onChange={setM("raza")}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" required />
            <input placeholder="Edad (años) *" type="number" min="0" max="40" value={mascota.edadAnios} onChange={setM("edadAnios")}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" required />
            <select value={mascota.sexo} onChange={setM("sexo")}
              className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
              <option value="M">Macho</option>
              <option value="H">Hembra</option>
            </select>
            <input placeholder="Color (opcional)" value={mascota.color} onChange={setM("color")}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none" />
          </div>
          <div className="mt-3">
            <input
              placeholder="⚠️ Alergia a medicamento (opcional) — ej: Penicilina"
              value={mascota.alergia}
              onChange={setM("alergia")}
              className="w-full border border-red-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-400 outline-none bg-red-50/40"
            />
            <p className="text-xs text-gray-400 mt-1">
              Si la registras, se mostrará un banner rojo de alerta en su ficha clínica
            </p>
          </div>
        </section>

        {error && <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{error}</p>}

        <button
          disabled={guardando}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl text-lg transition disabled:opacity-50"
        >
          {guardando ? "Registrando..." : "✅ Registrar paciente"}
        </button>
      </form>
    </div>
  );
}
