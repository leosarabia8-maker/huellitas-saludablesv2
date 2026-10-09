import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

const MENU = {
  VETERINARIO: [
    { to: "/buscar", icono: "🔍", texto: "Buscar paciente" },
    { to: "/agenda", icono: "📅", texto: "Agenda" },
  ],
  RECEPCIONISTA: [
    { to: "/agenda", icono: "📅", texto: "Agenda de citas" },
    { to: "/pacientes", icono: "🐾", texto: "Registrar paciente" },
    { to: "/buscar", icono: "🔍", texto: "Buscar paciente" },
    { to: "/doctores", icono: "👩‍⚕️", texto: "Doctores" },
  ],
  CLIENTE: [
    { to: "/portal", icono: "🐶", texto: "Mis mascotas" },
    { to: "/portal/agendar", icono: "📅", texto: "Agendar cita" },
  ],
};

const ROL_ETIQUETA = {
  VETERINARIO: "👩‍⚕️ Veterinario",
  RECEPCIONISTA: "🗂️ Recepción",
  CLIENTE: "🐾 Cliente",
};

export default function Layout() {
  const { sesion, logout } = useAuth();
  const navigate = useNavigate();
  const rol = sesion.usuario.rol;

  return (
    <div className="min-h-screen bg-teal-50/50 flex">
      {/* Barra lateral */}
      <aside className="w-64 bg-teal-800 text-white flex flex-col shrink-0">
        <div className="p-5 border-b border-teal-700">
          <h1 className="text-xl font-bold">🐾 Huellitas</h1>
          <p className="text-teal-300 text-sm">Saludables</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {MENU[rol].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${
                  isActive ? "bg-teal-600 font-semibold" : "hover:bg-teal-700"
                }`
              }
            >
              <span>{item.icono}</span> {item.texto}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-teal-700 text-sm">
          <p className="font-semibold truncate">{sesion.usuario.nombre}</p>
          <p className="text-teal-300 text-xs mb-2">{ROL_ETIQUETA[rol]}</p>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="w-full bg-teal-700 hover:bg-teal-600 rounded-lg py-2 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
