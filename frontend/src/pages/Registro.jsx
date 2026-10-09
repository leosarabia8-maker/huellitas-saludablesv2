import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Registro() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [cargando, setCargando] = useState(false);

  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const registrar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await api("/api/auth/registro", { method: "POST", body: form });
      setOk(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 to-teal-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">🐶</div>
          <h1 className="text-2xl font-bold text-teal-800">Crear cuenta</h1>
          <p className="text-gray-500 text-sm">Portal para dueños de mascotas</p>
        </div>

        {ok ? (
          <div className="bg-green-50 text-green-700 rounded-lg p-4 text-center font-medium">
            ✅ ¡Cuenta creada! Redirigiendo al inicio de sesión...
          </div>
        ) : (
          <form onSubmit={registrar} className="space-y-4">
            {[
              { campo: "nombre", label: "Nombre completo", tipo: "text", placeholder: "María Pérez" },
              { campo: "telefono", label: "Teléfono", tipo: "tel", placeholder: "0991234567" },
              { campo: "email", label: "Correo", tipo: "email", placeholder: "tu@correo.com" },
              { campo: "password", label: "Contraseña (mín. 6 caracteres)", tipo: "password", placeholder: "••••••••" },
            ].map((f) => (
              <div key={f.campo}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                <input
                  type={f.tipo}
                  value={form[f.campo]}
                  onChange={set(f.campo)}
                  placeholder={f.placeholder}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>
            ))}
            {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-2">{error}</p>}
            <button
              disabled={cargando}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
            >
              {cargando ? "Registrando..." : "Registrarme"}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-4 text-gray-600">
          ¿Ya tienes cuenta?{" "}
          <Link to="/login" className="text-teal-600 font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
