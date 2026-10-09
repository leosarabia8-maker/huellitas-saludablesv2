import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, RequireAuth } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Registro from "./pages/Registro.jsx";
import BuscarPaciente from "./pages/BuscarPaciente.jsx";
import FichaMascota from "./pages/FichaMascota.jsx";
import Pacientes from "./pages/Pacientes.jsx";
import Agenda from "./pages/Agenda.jsx";
import PortalInicio from "./pages/PortalInicio.jsx";
import AgendarCita from "./pages/AgendarCita.jsx";
import Carnet from "./pages/Carnet.jsx";
import Doctores from "./pages/Doctores.jsx";

function InicioPorRol() {
  const { sesion } = useAuth();
  const rol = sesion?.usuario?.rol;
  if (rol === "VETERINARIO") return <Navigate to="/buscar" replace />;
  if (rol === "RECEPCIONISTA") return <Navigate to="/agenda" replace />;
  return <Navigate to="/portal" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<InicioPorRol />} />

        {/* Veterinario */}
        <Route
          path="/buscar"
          element={
            <RequireAuth roles={["VETERINARIO", "RECEPCIONISTA"]}>
              <BuscarPaciente />
            </RequireAuth>
          }
        />
        <Route
          path="/pacientes/:id"
          element={
            <RequireAuth roles={["VETERINARIO", "RECEPCIONISTA"]}>
              <FichaMascota />
            </RequireAuth>
          }
        />

        {/* Recepción */}
        <Route
          path="/pacientes"
          element={
            <RequireAuth roles={["RECEPCIONISTA"]}>
              <Pacientes />
            </RequireAuth>
          }
        />
        <Route
          path="/agenda"
          element={
            <RequireAuth roles={["RECEPCIONISTA", "VETERINARIO"]}>
              <Agenda />
            </RequireAuth>
          }
        />
        <Route
          path="/doctores"
          element={
            <RequireAuth roles={["RECEPCIONISTA"]}>
              <Doctores />
            </RequireAuth>
          }
        />

        {/* Portal del cliente */}
        <Route
          path="/portal"
          element={
            <RequireAuth roles={["CLIENTE"]}>
              <PortalInicio />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/agendar"
          element={
            <RequireAuth roles={["CLIENTE"]}>
              <AgendarCita />
            </RequireAuth>
          }
        />
        <Route
          path="/portal/carnet/:mascotaId"
          element={
            <RequireAuth roles={["CLIENTE"]}>
              <Carnet />
            </RequireAuth>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
