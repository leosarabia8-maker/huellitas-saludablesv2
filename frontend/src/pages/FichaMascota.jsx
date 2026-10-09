import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

const fmtFecha = (iso) =>
  new Date(iso).toLocaleString("es-EC", { dateStyle: "medium", timeStyle: "short" });
const fmtSoloFecha = (iso) => new Date(iso).toLocaleDateString("es-EC", { dateStyle: "long" });

export default function FichaMascota() {
  const { id } = useParams();
  const { sesion } = useAuth();
  const esVet = sesion.usuario.rol === "VETERINARIO";

  const [mascota, setMascota] = useState(null);
  const [tiposVacuna, setTiposVacuna] = useState([]);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargar = () => api(`/api/mascotas/${id}`).then(setMascota).catch((e) => setError(e.message));

  useEffect(() => {
    cargar();
    api("/api/vacunas/tipos").then(setTiposVacuna).catch(() => {});
  }, [id]);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!mascota) return <p className="text-gray-400">Cargando ficha...</p>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── BANNER DE ALERGIAS: rojo parpadeante, alta visibilidad (RF-06, RNF-03, RS-03) ── */}
      {mascota.alergias.length > 0 && (
        <div className="banner-alergia bg-red-600 text-white rounded-xl p-4 shadow-lg border-4 border-red-800">
          <p className="font-extrabold text-lg flex items-center gap-2">
            ⚠️ ALERTA MÉDICA — ALERGIAS A MEDICAMENTOS ⚠️
          </p>
          <ul className="mt-1 ml-6 list-disc">
            {mascota.alergias.map((a) => (
              <li key={a.id} className="font-semibold">
                {a.medicamento}
                {a.descripcion && <span className="font-normal text-red-100"> — {a.descripcion}</span>}
              </li>
            ))}
          </ul>
          <p className="text-red-100 text-sm mt-1">
            Verifique antes de prescribir cualquier tratamiento.
          </p>
        </div>
      )}

      {/* ── Encabezado ── */}
      <div className="bg-white rounded-xl border border-teal-100 p-5 flex flex-wrap items-center gap-4">
        <span className="text-5xl">{mascota.especie === "PERRO" ? "🐶" : "🐱"}</span>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-teal-900">
            {mascota.nombre}{" "}
            <span className="text-sm bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-mono align-middle">
              {mascota.codigo}
            </span>
          </h2>
          <p className="text-gray-500">
            {mascota.especie} • {mascota.raza} • {mascota.edadAnios} años •{" "}
            {mascota.sexo === "M" ? "Macho" : "Hembra"}
            {mascota.color && ` • ${mascota.color}`}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            👤 <b>{mascota.propietario.nombre}</b> • 📞 {mascota.propietario.telefono}
            {mascota.propietario.direccion && ` • 📍 ${mascota.propietario.direccion}`}
          </p>
        </div>
      </div>

      {mensaje && (
        <p className="bg-green-50 text-green-700 rounded-lg p-3" onClick={() => setMensaje("")}>
          {mensaje}
        </p>
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* ── Columna izquierda: historial + vacunas ── */}
        <div className="space-y-6">
          <Historial consultas={mascota.consultas} />
          <CarnetVacunas vacunas={mascota.vacunas} />
        </div>

        {/* ── Columna derecha: acciones del veterinario ── */}
        {esVet ? (
          <div className="space-y-6">
            <NuevaConsulta
              mascotaId={id}
              alergias={mascota.alergias}
              onGuardada={() => {
                setMensaje("✅ Consulta registrada con fecha, hora y profesional automáticos (RF-05)");
                cargar();
              }}
            />
            <NuevaVacuna
              mascotaId={id}
              tipos={tiposVacuna}
              onGuardada={() => {
                setMensaje("✅ Vacuna registrada. Próxima dosis calculada automáticamente (RF-07)");
                cargar();
              }}
            />
          </div>
        ) : (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 text-teal-800 text-sm">
            ℹ️ Estás en modo recepción: puedes ver el historial, pero solo el veterinario registra consultas y vacunas.
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────────────── Historial clínico (RF-04) ───────────────────── */
function Historial({ consultas }) {
  return (
    <section className="bg-white rounded-xl border border-teal-100 p-5">
      <h3 className="font-bold text-teal-900 mb-3">📋 Historial clínico ({consultas.length})</h3>
      {consultas.length === 0 && <p className="text-gray-400 text-sm">Sin consultas registradas.</p>}
      <div className="space-y-3 max-h-96 overflow-auto pr-1">
        {consultas.map((c) => (
          <article key={c.id} className="border-l-4 border-teal-400 bg-teal-50/50 rounded-r-lg p-3">
            <p className="text-xs text-gray-500">
              🕐 {fmtFecha(c.createdAt)} — {c.veterinario.nombre}
            </p>
            <p className="font-semibold text-sm mt-1">Motivo: {c.motivo}</p>
            <p className="text-sm"><b>Síntomas:</b> {c.sintomas}</p>
            <p className="text-sm"><b>Diagnóstico:</b> {c.diagnostico}</p>
            <p className="text-sm bg-white rounded p-1.5 mt-1 border border-teal-100">
              💊 <b>Receta:</b> {c.tratamiento}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────── Carné de vacunación (RF-07) ───────────────────── */
function CarnetVacunas({ vacunas }) {
  const hoy = new Date();
  return (
    <section className="bg-white rounded-xl border border-teal-100 p-5">
      <h3 className="font-bold text-teal-900 mb-3">💉 Vacunas ({vacunas.length})</h3>
      {vacunas.length === 0 && <p className="text-gray-400 text-sm">Sin vacunas registradas.</p>}
      <div className="space-y-2 max-h-72 overflow-auto pr-1">
        {vacunas.map((v) => {
          const atrasada = new Date(v.proximaDosis) < hoy;
          return (
            <div key={v.id} className="flex justify-between items-center border rounded-lg p-2.5 text-sm">
              <div>
                <p className="font-semibold">{v.tipo} <span className="text-gray-400 font-normal">({v.dosis})</span></p>
                <p className="text-xs text-gray-500">Aplicada: {fmtSoloFecha(v.fechaAplicacion)}</p>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  atrasada ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}
              >
                {atrasada ? "⚠️ Atrasada" : "Próxima"}: {fmtSoloFecha(v.proximaDosis)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────── Nueva consulta (RF-04, RS-02, RS-03) ───────────────────── */
function NuevaConsulta({ mascotaId, alergias, onGuardada }) {
  const vacio = { motivo: "", sintomas: "", diagnostico: "", tratamiento: "" };
  const [form, setForm] = useState(vacio);
  const [alergenos, setAlergenos] = useState(null); // conflicto pendiente de confirmar
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const guardar = async (e, confirmado = false) => {
    e?.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await api("/api/consultas", {
        method: "POST",
        body: { ...form, mascotaId, confirmacionAlergia: confirmado },
      });
      setForm(vacio);
      setAlergenos(null);
      onGuardada();
    } catch (err) {
      if (err.data?.requiereConfirmacion) {
        setAlergenos(err.data.alergenos); // pedir confirmación explícita (RS-03)
      } else {
        setError(err.message);
      }
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border border-teal-100 p-5">
      <h3 className="font-bold text-teal-900 mb-3">🩺 Nueva consulta</h3>

      {/* Confirmación explícita por alergia (RS-03) */}
      {alergenos && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-3 mb-3">
          <p className="text-red-700 font-bold text-sm">
            ⛔ El tratamiento menciona: {alergenos.join(", ")} — ¡la mascota es ALÉRGICA!
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={(e) => guardar(e, true)}
              className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold px-3 py-1.5 rounded"
            >
              Confirmo que deseo prescribir de todos modos
            </button>
            <button
              onClick={() => setAlergenos(null)}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded"
            >
              Corregir tratamiento
            </button>
          </div>
        </div>
      )}

      <form onSubmit={(e) => guardar(e)} className="space-y-2.5">
        {[
          { campo: "motivo", label: "Motivo de atención *", ph: "Ej: Vómitos desde ayer" },
          { campo: "sintomas", label: "Síntomas *", ph: "Ej: Vómito 3 veces, decaimiento" },
          { campo: "diagnostico", label: "Diagnóstico *", ph: "Ej: Gastroenteritis aguda" },
        ].map((f) => (
          <div key={f.campo}>
            <label className="text-xs font-medium text-gray-600">{f.label}</label>
            <input
              value={form[f.campo]}
              onChange={set(f.campo)}
              placeholder={f.ph}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              required
            />
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-gray-600">
            Tratamiento / Receta digital *
            {alergias.length > 0 && (
              <span className="text-red-600 ml-1">
                (esta mascota es alérgica a: {alergias.map((a) => a.medicamento).join(", ")})
              </span>
            )}
          </label>
          <textarea
            value={form.tratamiento}
            onChange={set("tratamiento")}
            rows={2}
            placeholder="Ej: Omeprazol 10mg c/12h por 5 días"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            required
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={guardando}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar consulta"}
        </button>
        <p className="text-xs text-gray-400 text-center">
          La fecha, hora y profesional se registran automáticamente y no son editables (RF-05)
        </p>
      </form>
    </section>
  );
}

/* ───────────────────── Registrar vacuna (RF-07, RS-05) ───────────────────── */
function NuevaVacuna({ mascotaId, tipos, onGuardada }) {
  const [form, setForm] = useState({ tipo: "", dosis: "", intervaloDias: "" });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const elegirTipo = (e) => {
    const t = tipos.find((x) => x.tipo === e.target.value);
    setForm({
      tipo: e.target.value,
      dosis: t ? "1 dosis" : "",
      intervaloDias: t?.intervaloDias || "",
    });
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      await api("/api/vacunas", { method: "POST", body: { ...form, mascotaId } });
      setForm({ tipo: "", dosis: "", intervaloDias: "" });
      onGuardada();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const proxima =
    form.intervaloDias &&
    new Date(Date.now() + Number(form.intervaloDias) * 86400000).toLocaleDateString("es-EC", {
      dateStyle: "long",
    });

  return (
    <section className="bg-white rounded-xl border border-teal-100 p-5">
      <h3 className="font-bold text-teal-900 mb-3">💉 Registrar vacuna</h3>
      <form onSubmit={guardar} className="space-y-2.5">
        <div>
          <label className="text-xs font-medium text-gray-600">Tipo de vacuna *</label>
          <select
            value={form.tipo}
            onChange={elegirTipo}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none bg-white"
            required
          >
            <option value="">Seleccionar...</option>
            {tipos.map((t) => (
              <option key={t.tipo} value={t.tipo}>
                {t.tipo} (cada {t.intervaloDias} días)
              </option>
            ))}
            <option value="Otra">Otra...</option>
          </select>
        </div>
        {form.tipo === "Otra" && (
          <input
            value={form.tipo === "Otra" ? "" : form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            placeholder="Nombre de la vacuna"
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            required
          />
        )}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600">Dosis *</label>
            <input
              value={form.dosis}
              onChange={(e) => setForm({ ...form, dosis: e.target.value })}
              placeholder="1 dosis - 1ml"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Validez (días) *</label>
            <input
              type="number"
              min="1"
              value={form.intervaloDias}
              onChange={(e) => setForm({ ...form, intervaloDias: e.target.value })}
              placeholder="365"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              required
            />
          </div>
        </div>
        {proxima && (
          <p className="text-xs bg-teal-50 text-teal-700 rounded p-2">
            📅 Próxima dosis calculada automáticamente: <b>{proxima}</b>
          </p>
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={guardando}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Registrar vacuna"}
        </button>
      </form>
    </section>
  );
}
