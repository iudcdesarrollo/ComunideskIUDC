import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { obtenerSolicitudes, guardarSolicitudes, USUARIOS } from '../data/mockData';
import {
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Tag,
  UserCheck,
  Clock,
  MessageSquare,
} from 'lucide-react';

const estadoLabels = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  completada: 'Completada',
  rechazada: 'Rechazada',
};

const estadoBadgeClass = {
  pendiente: 'badge-pendiente',
  en_proceso: 'badge-en-proceso',
  completada: 'badge-completada',
  rechazada: 'badge-rechazada',
};

const prioridadBadge = {
  alta: 'bg-red-100 text-red-700',
  media: 'bg-amber-100 text-amber-700',
  baja: 'bg-gray-100 text-gray-600',
};

export default function MisSolicitudes() {
  const { usuario, puedeGestionarSolicitudes, esSolicitante, esAdmin } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [expandida, setExpandida] = useState(null);
  const [solicitudes, setSolicitudes] = useState(() => obtenerSolicitudes());

  const equipo = USUARIOS.filter((u) => u.rol === 'equipo');

  const solicitudesFiltradas = useMemo(() => {
    let resultado = [...solicitudes];

    // Filtrar por rol
    if (esSolicitante()) {
      resultado = resultado.filter((s) => s.solicitante.id === usuario.id);
    } else if (usuario?.rol === 'equipo') {
      // Equipo ve: las asignadas a él + las pendientes sin asignar
      resultado = resultado.filter(
        (s) => s.asignadoA?.id === usuario.id || s.estado === 'pendiente'
      );
    }
    // Admin ve todo

    if (busqueda) {
      const term = busqueda.toLowerCase();
      resultado = resultado.filter(
        (s) =>
          s.titulo.toLowerCase().includes(term) ||
          s.id.toLowerCase().includes(term) ||
          s.solicitante.nombre.toLowerCase().includes(term)
      );
    }

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((s) => s.estado === filtroEstado);
    }

    if (filtroTipo !== 'todos') {
      resultado = resultado.filter((s) => s.tipo === filtroTipo);
    }

    return resultado;
  }, [solicitudes, busqueda, filtroEstado, filtroTipo, usuario, esSolicitante]);

  const cambiarEstado = (id, nuevoEstado) => {
    const actualizadas = solicitudes.map((s) =>
      s.id === id ? { ...s, estado: nuevoEstado } : s
    );
    setSolicitudes(actualizadas);
    guardarSolicitudes(actualizadas);
  };

  const cambiarPrioridad = (id, nuevaPrioridad) => {
    const actualizadas = solicitudes.map((s) =>
      s.id === id ? { ...s, prioridad: nuevaPrioridad } : s
    );
    setSolicitudes(actualizadas);
    guardarSolicitudes(actualizadas);
  };

  const asignarMiembro = (id, miembroId) => {
    const miembro = equipo.find((m) => m.id === parseInt(miembroId));
    const actualizadas = solicitudes.map((s) =>
      s.id === id
        ? {
            ...s,
            asignadoA: miembro ? { id: miembro.id, nombre: miembro.nombre } : null,
            estado: miembro && s.estado === 'pendiente' ? 'en_proceso' : s.estado,
          }
        : s
    );
    setSolicitudes(actualizadas);
    guardarSolicitudes(actualizadas);
  };

  // Auto-asignar para miembro de equipo
  const autoAsignar = (id) => {
    const actualizadas = solicitudes.map((s) =>
      s.id === id
        ? {
            ...s,
            asignadoA: { id: usuario.id, nombre: usuario.nombre },
            estado: 'en_proceso',
          }
        : s
    );
    setSolicitudes(actualizadas);
    guardarSolicitudes(actualizadas);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {esSolicitante()
            ? 'Mis solicitudes'
            : usuario?.rol === 'equipo'
              ? 'Gestión de solicitudes'
              : 'Todas las solicitudes'}
        </h1>
        <p className="text-gray-500 mt-1">
          {esSolicitante()
            ? 'Consulta el estado de tus solicitudes'
            : usuario?.rol === 'equipo'
              ? 'Atiende y da seguimiento a las solicitudes asignadas'
              : `${solicitudesFiltradas.length} solicitud(es) en el sistema`}
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={esSolicitante() ? 'Buscar por título o ticket...' : 'Buscar por título, ticket o solicitante...'}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input-field w-auto"
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="completada">Completada</option>
              <option value="rechazada">Rechazada</option>
            </select>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="input-field w-auto"
            >
              <option value="todos">Todos los tipos</option>
              <option value="registro_control">Registro y Control</option>
              <option value="cubrimiento_eventos">Cubrimiento de Eventos</option>
              <option value="piezas_graficas">Piezas Gráficas</option>
              <option value="certificados">Certificados</option>
              <option value="proyectos">Proyectos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contador */}
      <p className="text-sm text-gray-500">{solicitudesFiltradas.length} resultado(s)</p>

      {/* Lista de solicitudes */}
      <div className="space-y-3">
        {solicitudesFiltradas.length === 0 ? (
          <div className="card text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No se encontraron solicitudes</p>
          </div>
        ) : (
          solicitudesFiltradas.map((sol) => (
            <div key={sol.id} className="card overflow-hidden">
              {/* Fila principal */}
              <div
                className="flex items-center gap-4 cursor-pointer"
                onClick={() => setExpandida(expandida === sol.id ? null : sol.id)}
              >
                <div className="hidden sm:flex w-12 h-12 bg-gray-100 rounded-xl items-center justify-center">
                  <span className="text-xs font-bold text-gray-500">{sol.id.split('-')[1]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm">{sol.titulo}</p>
                    <span className="text-xs text-gray-400">{sol.id}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {sol.tipoNombre}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {sol.fechaCreacion}
                    </span>
                    {!esSolicitante() && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {sol.solicitante.nombre}
                      </span>
                    )}
                    {sol.tiempoEntrega && (
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock className="w-3 h-3" />
                        {sol.tiempoEntrega}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {!esSolicitante() && (
                    <span className={`badge ${prioridadBadge[sol.prioridad]} hidden sm:inline-flex`}>
                      {sol.prioridad === 'alta' ? 'Alta' : sol.prioridad === 'media' ? 'Media' : 'Baja'}
                    </span>
                  )}
                  <span className={estadoBadgeClass[sol.estado]}>
                    {estadoLabels[sol.estado]}
                  </span>
                  {expandida === sol.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Detalle expandido */}
              {expandida === sol.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                  {/* Info del solicitante (visible para equipo/admin) */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Solicitante</p>
                      <p className="text-sm text-gray-900">{sol.solicitante.nombre}</p>
                      <p className="text-xs text-gray-500">{sol.solicitante.cargo}</p>
                    </div>
                    {sol.asignadoA && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Asignado a</p>
                        <p className="text-sm text-gray-900 flex items-center gap-1">
                          <UserCheck className="w-4 h-4 text-blue-500" />
                          {sol.asignadoA.nombre}
                        </p>
                      </div>
                    )}
                    {sol.tiempoEntrega && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">Tiempo estimado de entrega</p>
                        <p className="text-sm text-gray-700 flex items-center gap-1">
                          <Clock className="w-4 h-4 text-amber-500" />
                          {sol.tiempoEntrega}
                        </p>
                      </div>
                    )}
                  </div>

                  {sol.descripcion && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Descripción</p>
                      <p className="text-sm text-gray-700">{sol.descripcion}</p>
                    </div>
                  )}

                  {sol.datos && Object.keys(sol.datos).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Datos de la solicitud</p>
                      <div className="bg-gray-50 rounded-xl p-4 grid sm:grid-cols-2 gap-3">
                        {Object.entries(sol.datos).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-gray-400 capitalize">
                              {key.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-gray-700">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VISTA SOLICITANTE: solo puede ver estado, no modificar */}
                  {esSolicitante() && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <p className="text-sm text-blue-700 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {sol.estado === 'pendiente' && 'Tu solicitud ha sido recibida y será atendida pronto.'}
                        {sol.estado === 'en_proceso' && `Tu solicitud está siendo atendida por ${sol.asignadoA?.nombre || 'el equipo de comunicaciones'}.`}
                        {sol.estado === 'completada' && '¡Tu solicitud ha sido completada!'}
                        {sol.estado === 'rechazada' && 'Tu solicitud ha sido rechazada. Contacta al área de comunicaciones para más información.'}
                      </p>
                    </div>
                  )}

                  {/* VISTA EQUIPO: puede tomar solicitud, cambiar estado */}
                  {usuario?.rol === 'equipo' && (
                    <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                      {!sol.asignadoA && (
                        <button
                          onClick={() => autoAsignar(sol.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
                        >
                          <UserCheck className="w-4 h-4" />
                          Tomar esta solicitud
                        </button>
                      )}
                      {sol.asignadoA?.id === usuario.id && (
                        <select
                          value={sol.estado}
                          onChange={(e) => cambiarEstado(sol.id, e.target.value)}
                          className="input-field w-auto text-sm"
                        >
                          <option value="en_proceso">En proceso</option>
                          <option value="completada">Completada</option>
                          <option value="rechazada">Rechazada</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* VISTA ADMIN: control total */}
                  {esAdmin() && (
                    <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-100">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Asignar a</label>
                        <select
                          value={sol.asignadoA?.id || ''}
                          onChange={(e) => asignarMiembro(sol.id, e.target.value)}
                          className="input-field w-auto text-sm"
                        >
                          <option value="">Sin asignar</option>
                          {equipo.map((m) => (
                            <option key={m.id} value={m.id}>{m.nombre} ({m.cargo})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Estado</label>
                        <select
                          value={sol.estado}
                          onChange={(e) => cambiarEstado(sol.id, e.target.value)}
                          className="input-field w-auto text-sm"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En proceso</option>
                          <option value="completada">Completada</option>
                          <option value="rechazada">Rechazada</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Prioridad</label>
                        <select
                          value={sol.prioridad}
                          onChange={(e) => cambiarPrioridad(sol.id, e.target.value)}
                          className="input-field w-auto text-sm"
                        >
                          <option value="alta">Alta</option>
                          <option value="media">Media</option>
                          <option value="baja">Baja</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
