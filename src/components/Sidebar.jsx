import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Radio,
  AlertTriangle,
  BarChart3,
  Download,
  Users,
  Brain,
  X,
} from 'lucide-react';

const iconMap = {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Radio,
  Brain,
  AlertTriangle,
  BarChart3,
  Download,
  Users,
};

export default function Sidebar({ abierto, cerrar }) {
  const { usuario, puedeVerUrgentes, puedeGestionarSolicitudes } = useAuth();

  const enlaces = [
    {
      to: '/dashboard',
      label: 'Panel principal',
      icon: 'LayoutDashboard',
      visible: true,
    },
    {
      to: '/nueva-solicitud',
      label: 'Nueva solicitud',
      icon: 'PlusCircle',
      visible: true,
    },
    {
      to: '/mis-solicitudes',
      label: usuario?.rol === 'solicitante' ? 'Mis solicitudes' : 'Solicitudes',
      icon: 'FileText',
      visible: true,
    },
    {
      to: '/radio',
      label: 'Parrilla de Radio',
      icon: 'Radio',
      visible: true,
    },
    {
      to: '/valle-ia',
      label: 'Valle del Software · IA',
      icon: 'Brain',
      visible: true,
    },
    {
      to: '/urgente',
      label: 'Canal urgente',
      icon: 'AlertTriangle',
      visible: puedeVerUrgentes(),
    },
    {
      to: '/seguimiento',
      label: 'Seguimiento',
      icon: 'BarChart3',
      visible: puedeGestionarSolicitudes(),
    },
    {
      to: '/exportar',
      label: 'Exportar datos',
      icon: 'Download',
      visible: usuario?.rol === 'admin' || usuario?.rol === 'director',
    },
    {
      to: '/usuarios',
      label: 'Gestión de Usuarios',
      icon: 'Users',
      visible: usuario?.rol === 'admin' || usuario?.rol === 'director',
    },
  ];

  return (
    <>
      {/* Overlay móvil */}
      {abierto && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={cerrar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto flex flex-col ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Cabecera */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">ComuniDesk</h2>
              <p className="text-xs text-gray-500">IUDC</p>
            </div>
          </div>
          <button
            onClick={cerrar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navegación */}
        <nav className="p-3 space-y-1 mt-2 flex-1 overflow-y-auto">
          {enlaces
            .filter((e) => e.visible)
            .map((enlace) => {
              const Icon = iconMap[enlace.icon];
              return (
                <NavLink
                  key={enlace.to}
                  to={enlace.to}
                  onClick={cerrar}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {enlace.label}
                  {enlace.to === '/urgente' && (
                    <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </NavLink>
              );
            })}
        </nav>

        {/* Info usuario */}
        <div className="shrink-0 p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 shrink-0">
              {usuario?.nombre?.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{usuario?.nombre}</p>
              <p className="text-xs text-gray-500 truncate">{usuario?.cargo}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
