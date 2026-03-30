import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import NuevaSolicitud from './components/NuevaSolicitud';
import MisSolicitudes from './components/MisSolicitudes';
import ParrillaRadio from './components/ParrillaRadio';
import CanalUrgente from './components/CanalUrgente';
import Seguimiento from './components/Seguimiento';
import Exportar from './components/Exportar';
import GestionUsuarios from './components/GestionUsuarios';
import ValleIA from './components/ValleIA';
import PQRS from './components/PQRS';
import RegistroAsistenciaQR from './components/RegistroAsistenciaQR';
import HelpMe from './components/HelpMe';


function RutaProtegida({ children, roles }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function RutaPublica({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) return null;
  if (usuario) return <Navigate to="/dashboard" replace />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/asistencia-qr/:token" element={<RegistroAsistenciaQR />} />
      <Route
        path="/login"
        element={
          <RutaPublica>
            <Login />
          </RutaPublica>
        }
      />

      <Route
        path="/"
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="nueva-solicitud" element={<NuevaSolicitud />} />
        <Route path="mis-solicitudes" element={<MisSolicitudes />} />
        <Route path="radio" element={<ParrillaRadio />} />
        <Route path="valle-ia" element={<ValleIA />} />
        <Route path="help-me" element={<HelpMe />} />
        <Route
          path="pqrs"
          element={
            <RutaProtegida roles={['solicitante', 'admin', 'director']}>
              <PQRS />
            </RutaProtegida>
          }
        />
        <Route
          path="urgente"
          element={
            <RutaProtegida roles={['admin', 'director', 'equipo']}>
              <CanalUrgente />
            </RutaProtegida>
          }
        />
        <Route
          path="seguimiento"
          element={
            <RutaProtegida roles={['admin', 'director', 'equipo']}>
              <Seguimiento />
            </RutaProtegida>
          }
        />
        <Route
          path="exportar"
          element={
            <RutaProtegida roles={['admin', 'director']}>
              <Exportar />
            </RutaProtegida>
          }
        />
        <Route
          path="usuarios"
          element={
            <RutaProtegida roles={['admin', 'director']}>
              <GestionUsuarios />
            </RutaProtegida>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
