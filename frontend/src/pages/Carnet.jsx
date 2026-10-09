import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api.js";

// Carné de vacunación digital del cliente (RS-12)
export default function Carnet() {
  const { mascotaId } = useParams();
  const [vacunas, setVacunas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api(`/api/vacunas?mascotaId=${mascotaId}`)
      .then(setVacunas)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [mascotaId]);

  if (cargando) return <p className="text-gray-400">Cargando carné...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  const hoy = new Date();

  return (
    <div className="max-w-2xl mx-auto">
      <Link to="/portal" className="text-teal-600 text-sm hover:underline">← Volver a mis mascotas</Link>
      <div className="bg-white rounded-2xl border-2 border-teal-200 shadow p-6 mt-3">
        <div className="text-center border-b border-teal-100 pb-4 mb-4">
          <p className="text-4xl mb-1">💉</p>
          <h2 className="text-xl font-bold text-teal-900">Carné de Vacunación Digital</h2>
          <p className="text-gray-400 text-sm">Clínica Veterinaria Huellitas Saludables</p>
        </div>

        {vacunas.length === 0 ? (
          <p className="text-center text-gray-400 py-6">Esta mascota aún no tiene vacunas registradas.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b">
                <th className="py-2">Vacuna</th>
                <th>Dosis</th>
                <th>Aplicada</th>
                <th>Próxima dosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-teal-50">
              {vacunas.map((v) => {
                const atrasada = new Date(v.proximaDosis) < hoy;
                return (
                  <tr key={v.id}>
                    <td className="py-2.5 font-semibold">{v.tipo}</td>
                    <td className="text-gray-500">{v.dosis}</td>
                    <td className="text-gray-500">
                      {new Date(v.fechaAplicacion).toLocaleDateString("es-EC")}
                    </td>
                    <td>
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          atrasada ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        }`}
                      >
                        {atrasada && "⚠️ "}
                        {new Date(v.proximaDosis).toLocaleDateString("es-EC", { dateStyle: "medium" })}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-400 text-center mt-5">
          Las fechas de próxima dosis se calculan automáticamente según el intervalo de cada vacuna.
        </p>
      </div>
    </div>
  );
}
