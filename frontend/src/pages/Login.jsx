import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const entrar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await login(email, password);
      navigate("/");
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
          <div className="text-5xl mb-2">🐾</div>
          <h1 className="text-2xl font-bold text-teal-800">Huellitas Saludables</h1>
          <p className="text-gray-500 text-sm">Plataforma de gestión veterinaria</p>
        </div>

        <form onSubmit={entrar} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="tu@correo.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg p-2">{error}</p>}
          <button
            disabled={cargando}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
          >
            {cargando ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="text-center text-sm mt-4 text-gray-600">
          ¿Eres dueño de una mascota?{" "}
          <Link to="/registro" className="text-teal-600 font-semibold hover:underline">
            Crea tu cuenta
          </Link>
        </p>
      </div>
    </div>
  );
}
