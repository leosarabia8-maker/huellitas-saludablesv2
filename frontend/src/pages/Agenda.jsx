import { useState, useEffect, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";

const COLORES_ESTADO = {
  PENDIENTE: "#f59e0b",
  CONFIRMADA: "#0d9488",
  COMPLETADA: "#6b7280",
  CANCELADA: "#ef4444",
};

// Agenda con vistas día/semana/mes (RF-03), bloqueo de cruces (RNF-01, RS-08)
export default function Agenda() {
  const { sesion } = useAuth();
  const esRecepcion = sesion.usuario.rol === "RECEPCIONISTA";

  const [citas, setCitas] = useState([]);
  const [veterinarios, setVeterinarios] = useState([]);
  const [seleccion, setSeleccion] = useState(null); // { fechaHora } para nueva cita
  const [citaSel, setCitaSel] = useState(null); // cita clickeada
  const [mensaje, setMensaje] = useState("");
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    api("/api/veterinarios").then(setVeterinarios).catch(() => {});
  }, []);

  const cargarCitas = useCallback((info) => {
    const params = new URLSearchParams({ desde: info.startStr, hasta: info.endStr });
    return api(`/api/citas?${params}`).then(setCitas).catch(() => {});
  }, []);

  // Formatea eventos para FullCalendar (RF-03)
  const eventos = citas.map((c) => ({
    id: c.id,
    title: `${c.mascota.especie === "PERRO" ? "🐶" : "🐱"} ${c.mascota.nombre} — ${c.motivo}`,
    start: c.fechaHora,
    end: new Date(new Date(c.fechaHora).getTime() + c.duracionMin * 60000).toISOString(),
    backgroundColor: COLORES_ESTADO[c.estado],
    borderColor: COLORES_ESTADO[c.estado],
    extendedProps: { cita: c },
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-teal-900">📅 Agenda de citas</h2>
          <p className="text-gray-500 text-sm">
            {esRecepcion
              ? "Haz clic en un horario libre para agendar. El sistema bloquea cruces automáticamente."
              : "Vista de tu agenda de citas"}
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          {Object.entries({ PENDIENTE: "Pendiente", CONFIRMADA: "Confirmada", COMPLETADA: "Completada", CANCELADA: "Cancelada" }).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: COLORES_ESTADO[k] }}></span>
              {v}
            </span>
          ))}
        </div>
      </div>

      {mensaje && (
        <p className="bg-green-50 text-green-700 rounded-lg p-3 mb-4" onClick={() => setMensaje("")}>{mensaje}</p>
      )}

      <div className="bg-white rounded-xl border border-teal-100 p-4">
        <FullCalendar
          key={recarga}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "timeGridDay,timeGridWeek,dayGridMonth", // vistas diaria, semanal y mensual (RS-07)
          }}
          locale="es"
          buttonText={{ today: "Hoy", day: "Día", week: "Semana", month: "Mes" }}
          events={eventos}
          datesSet={cargarCitas}
          dateClick={(info) => {
            if (esRecepcion && new Date(info.date) > new Date()) {
              setSeleccion({ fechaHora: info.date });
            }
          }}
          eventClick={(info) => setCitaSel(info.event.extendedProps.cita)}
          slotMinTime="08:00:00"
          slotMaxTime="18:00:00"
          allDaySlot={false}
          height="auto"
          nowIndicator
        />
      </div>

      {/* Modal: nueva cita (recepción) */}
      {seleccion && esRecepcion && (
        <ModalNuevaCita
          fechaHora={seleccion.fechaHora}
          veterinarios={veterinarios}
          onCerrar={() => setSeleccion(null)}
          onCreada={(confirmacion) => {
            setSeleccion(null);
            setMensaje(`✅ ${confirmacion}`);
            setRecarga((r) => r + 1);
          }}
        />
      )}

      {/* Modal: detalle de cita */}
      {citaSel && (
        <ModalCita
          cita={citaSel}
          esRecepcion={esRecepcion}
          onCerrar={() => setCitaSel(null)}
          onActualizada={(msg) => {
            setCitaSel(null);
            setMensaje(msg);
            setRecarga((r) => r + 1);
          }}
        />
      )}
    </div>
  );
}

/* ── Modal: agendar cita en recepción ── */
function ModalNuevaCita({ fechaHora, veterinarios, onCerrar, onCreada }) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [mascota, setMascota] = useState(null);
  const [veterinarioId, setVeterinarioId] = useState(veterinarios[0]?.id || "");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (q.length < 2) return setResultados([]);
    const t = setTimeout(() => {
      api(`/api/mascotas/buscar?q=${encodeURIComponent(q)}`).then(setResultados).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  const crear = async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const data = await api("/api/citas", {
        method: "POST",
        body: { mascotaId: mascota.id, veterinarioId, fechaHora: fechaHora.toISOString(), motivo },
      });
      onCreada(data.confirmacion);
    } catch (err) {
      setError(err.message); // incluye mensaje de cruce de horario (RS-08)
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal onCerrar={onCerrar} titulo="📅 Nueva cita">
      <p className="text-sm text-gray-500 mb-3">
        {fechaHora.toLocaleString("es-EC", { dateStyle: "full", timeStyle: "short" })}
      </p>
      <form onSubmit={crear} className="space-y-3">
        <div>
          <label className="text-xs font-medium text-gray-600">Mascota *</label>
          {mascota ? (
            <p className="bg-teal-50 rounded-lg p-2 text-sm flex justify-between items-center">
              <b>{mascota.nombre}</b> ({mascota.codigo}) — {mascota.propietario.nombre}
              <button type="button" onClick={() => setMascota(null)} className="text-red-500 text-xs">cambiar</button>
            </p>
          ) : (
            <>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
              />
              {resultados.length > 0 && (
                <div className="border rounded-lg mt-1 divide-y max-h-36 overflow-auto">
                  {resultados.map((m) => (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setMascota(m)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50"
                    >
                      {m.especie === "PERRO" ? "🐶" : "🐱"} <b>{m.nombre}</b>{" "}
                      <span className="text-gray-400 font-mono text-xs">{m.codigo}</span> — {m.propietario.nombre}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Veterinario *</label>
          <select
            value={veterinarioId}
            onChange={(e) => setVeterinarioId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-teal-500 outline-none"
            required
          >
            {veterinarios.map((v) => (
              <option key={v.id} value={v.id}>{v.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600">Motivo *</label>
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Control general, vacunación..."
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
            required
          />
        </div>
        {error && <p className="text-red-600 bg-red-50 rounded-lg p-2 text-sm">{error}</p>}
        <button
          disabled={guardando || !mascota}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50"
        >
          {guardando ? "Agendando..." : "Confirmar cita"}
        </button>
      </form>
    </Modal>
  );
}

/* ── Modal: detalle / reprogramar / cancelar ── */
function ModalCita({ cita, esRecepcion, onCerrar, onActualizada }) {
  const [reprogramando, setReprogramando] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState("");
  const [error, setError] = useState("");

  const accion = async (body, msg) => {
    setError("");
    try {
      await api(`/api/citas/${cita.id}`, { method: "PATCH", body });
      onActualizada(msg);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal onCerrar={onCerrar} titulo="📋 Detalle de la cita">
      <div className="space-y-2 text-sm">
        <p><b>Mascota:</b> {cita.mascota.nombre} <span className="font-mono text-gray-400">{cita.mascota.codigo}</span></p>
        <p><b>Veterinario:</b> {cita.veterinario.nombre}</p>
        <p><b>Fecha y hora:</b> {new Date(cita.fechaHora).toLocaleString("es-EC", { dateStyle: "full", timeStyle: "short" })}</p>
        <p><b>Motivo:</b> {cita.motivo}</p>
        <p>
          <b>Estado:</b>{" "}
          <span className="text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ background: COLORES_ESTADO[cita.estado] }}>
            {cita.estado}
          </span>
        </p>
      </div>

      {esRecepcion && !["CANCELADA", "COMPLETADA"].includes(cita.estado) && (
        <div className="mt-4 pt-3 border-t space-y-2">
          {reprogramando ? (
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="flex-1 border rounded-lg px-2 py-1.5 text-sm"
              />
              <button
                onClick={() => accion({ fechaHora: new Date(nuevaFecha).toISOString() }, "✅ Cita reprogramada")}
                className="bg-teal-600 text-white text-sm font-semibold px-3 rounded-lg"
              >
                Guardar
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setReprogramando(true)}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2 rounded-lg transition"
              >
                🔁 Reprogramar
              </button>
              <button
                onClick={() => accion({ estado: "CANCELADA" }, "🗑️ Cita cancelada")}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg transition"
              >
                ❌ Cancelar
              </button>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-red-600 bg-red-50 rounded-lg p-2 text-sm mt-2">{error}</p>}
    </Modal>
  );
}

function Modal({ titulo, children, onCerrar }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onCerrar}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-teal-900 text-lg">{titulo}</h3>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-xl leading-none">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
