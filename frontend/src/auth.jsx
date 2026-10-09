import { createContext, useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSesion, guardarSesion, cerrarSesion, api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [sesion, setSesion] = useState(getSesion());

  const login = async (email, password) => {
    const data = await api("/api/auth/login", { method: "POST", body: { email, password } });
    guardarSesion(data);
    setSesion(data);
    return data.usuario;
  };

  const logout = () => {
    cerrarSesion();
    setSesion(null);
  };

  return (
    <AuthContext.Provider value={{ sesion, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Protege rutas: requiere sesión y opcionalmente un rol
export function RequireAuth({ roles, children }) {
  const { sesion } = useAuth();
  if (!sesion) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(sesion.usuario.rol)) {
    return (
      <div className="p-8 text-center text-red-600 font-semibold">
        ⛔ No tienes permisos para ver esta sección
      </div>
    );
  }
  return children;
}
