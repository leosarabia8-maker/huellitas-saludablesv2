import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

// Agendamiento autónomo del cliente con disponibilidad en vivo (RS-10, RS-13)
export default function AgendarCita() {
  const [mascotas, setMascotas] = useState([]);
  const [cargado, setCargado] = useState(false);
  const [veterinarios, setVeterinarios] = useState([]);
  const [mascotaId, setMascotaId] = useState("");
  const [veterinarioId, setVeterinarioId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [slotSel, setSlotSel] = useState(null);
  const [motivo, setMotivo] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api("/api/portal/mis-mascotas")
      .then(setMascotas)
      .catch(() => {})
      .finally(() => setCargado(true));
    api("/api/veterinarios").then(setVeterinarios).catch(() => {});
  }, []);

  // Consulta disponibilidad cuando cambian veterinario o fecha (RS-10)
  useEffect(() => {
    setSlotSel(null);
    if (!veterinarioId || !fecha) return;
    api(`/api/citas/disponibilidad?veterinarioId=${veterinarioId}&fecha=${fecha}`)
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [veterinarioId, fecha]);

  const agendar = async () => {
    setError("");
    setCargando(true);
    try {
      const data = await api("/api/citas", {
        method: "POST",
        body: { mascotaId, veterinarioId, fechaHora: slotSel.fechaHora, motivo },
      });
      setConfirmacion(data.confirmacion); // confirmación con fecha y hora (RS-11)
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Pantalla de confirmación (RS-11)
  if (confirmacion) {
    return (
      <div className="max-w-lg mx-auto text-center bg-white rounded-2xl border border-teal-100 p-8 shadow">
        <div className="text-6xl mb-3">🎉</div>
        <h2 className="text-2xl font-bold text-teal-900">¡Cita agendada!</h2>
        <p className="text-gray-600 mt-3 bg-green-50 rounded-xl p-4">{confirmacion}</p>
        <button
          onClick={() => {
            setConfirmacion("");
            setSlotSel(null);
            setMotivo("");
          }}
          className="mt-6 bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
        >
          Agendar otra cita
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-teal-900 mb-1">📅 Agendar cita</h2>
      <p className="text-gray-500 mb-6">Elige mascota, veterinario y horario disponible</p>

      {cargado && mascotas.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-4 text-sm">
          🐾 Primero necesitas registrar una mascota.{" "}
          <Link to="/portal" className="font-semibold underline">
            Regístrala desde tu portal
          </Link>{" "}
          y vuelve aquí para agendar.
        </div>
      )}

      <div className="bg-white rounded-xl border border-teal-100 p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Mascota *</label>
            <select value={mascotaId} onChange={(e) => setMascotaId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
              <option value="">Seleccionar...</option>
              {mascotas.map((m) => (
                <option key={m.id} value={m.id}>🐾 {m.nombre} ({m.codigo})</option>
              ))}
            </select>
            {mascotas.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                ¿Falta alguna? <Link to="/portal" className="text-teal-600 hover:underline">Regístrala en tu portal</Link>
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Veterinario *</label>
            <select value={veterinarioId} onChange={(e) => setVeterinarioId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-teal-500 outline-none">
              <option value="">Seleccionar...</option>
              {veterinarios.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600">Fecha *</label>
          <input
            type="date"
            value={fecha}
            min={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setFecha(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>

        {veterinarioId && fecha && (
          <div>
            <label className="text-xs font-medium text-gray-600">Horarios disponibles *</label>
            <div className="grid grid-cols-5 gap-2 mt-1">
              {slots.map((s) => (
                <button
                  key={s.hora}
                  disabled={!s.disponible}
                  onClick={() => setSlotSel(s)}
                  className={`text-sm font-medium py-2 rounded-lg transition ${
                    slotSel?.hora === s.hora
                      ? "bg-teal-600 text-white"
                      : s.disponible
                        ? "bg-teal-50 hover:bg-teal-100 text-teal-800"
                        : "bg-gray-100 text-gray-300 line-through cursor-not-allowed"
                  }`}
                >
                  {s.hora}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">Los horarios tachados ya están ocupados (bloqueo automático)</p>
          </div>
        )}

        {slotSel && (
          <div>
            <label className="text-xs font-medium text-gray-600">Motivo de la consulta *</label>
            <input
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Vacunación, control general..."
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        )}

        {error && <p className="text-red-600 bg-red-50 rounded-lg p-3 text-sm">{error}</p>}

        {slotSel && motivo && mascotaId && (
          <button
            onClick={agendar}
            disabled={cargando}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
          >
            {cargando ? "Agendando..." : `✅ Confirmar cita a las ${slotSel.hora}`}
          </button>
        )}
      </div>
    </div>
  );
}
