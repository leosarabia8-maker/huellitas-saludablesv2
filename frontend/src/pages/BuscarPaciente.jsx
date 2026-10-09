import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";

// Búsqueda de pacientes en tiempo real (RF-02, RNF-02)
export default function BuscarPaciente() {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounce: busca 250ms después de dejar de escribir
  useEffect(() => {
    if (!q.trim()) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const t = setTimeout(async () => {
      try {
        setResultados(await api(`/api/mascotas/buscar?q=${encodeURIComponent(q)}`));
      } finally {
        setBuscando(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-teal-900 mb-1">🔍 Buscar paciente</h2>
      <p className="text-gray-500 mb-6">Localiza por nombre, código único o dueño</p>

      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Escribe para buscar... ej: Luna, HU-7K2P o Diana"
        className="w-full text-lg border-2 border-teal-200 rounded-xl px-5 py-3 focus:border-teal-500 outline-none shadow-sm"
      />

      <div className="mt-4 space-y-2">
        {buscando && <p className="text-gray-400 text-sm">Buscando...</p>}
        {!buscando && q && resultados.length === 0 && (
          <p className="text-gray-400 text-sm">Sin coincidencias para "{q}"</p>
        )}
        {resultados.map((m) => (
          <Link
            key={m.id}
            to={`/pacientes/${m.id}`}
            className="flex items-center gap-4 bg-white rounded-xl border border-teal-100 p-4 hover:border-teal-400 hover:shadow transition"
          >
            <span className="text-3xl">{m.especie === "PERRO" ? "🐶" : "🐱"}</span>
            <div className="flex-1">
              <p className="font-semibold text-teal-900">
                {m.nombre}
                <span className="ml-2 text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-mono">
                  {m.codigo}
                </span>
                {m.alergias.length > 0 && (
                  <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                    ⚠️ ALERGIA
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                {m.raza} • {m.edadAnios} años • Dueño: {m.propietario.nombre}
              </p>
            </div>
            <span className="text-teal-600 font-medium text-sm">Ver ficha →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
