import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
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
  CheckCircle2,
  X,
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
  const { usuario, puedeGestionarSolicitudes, esSolicitante, esAdmin, esDirector } = useAuth();
  const [searchParams] = useSearchParams();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get('estado') || 'todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [expandida, setExpandida] = useState(searchParams.get('expand') || null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [equipo, setEquipo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bannerCerrado, setBannerCerrado] = useState(false);

  const normalizeSol = (sol) => ({
    ...sol,
    estado: (sol.estado || '').toLowerCase(),
    prioridad: (sol.prioridad || 'media').toLowerCase(),
    tipo: sol.tipo || sol.tipoId,
    tipoNombre: sol.tipoNombre || sol.tipoSolicitud?.nombre || '',
    fechaCreacion: sol.fechaCreacion || (sol.createdAt ? new Date(sol.createdAt).toISOString().split('T')[0] : ''),
    tiempoEntrega: sol.tiempoEntrega || sol.tipoSolicitud?.tiempoEntrega || '',
    solicitante: sol.solicitante || { id: sol.solicitanteId, nombre: 'Desconocido', cargo: '' },
    asignadoA: sol.asignadoA || null,
  });

  // Auto-scroll to expanded solicitud when coming from a notification
  useEffect(() => {
    const expandId = searchParams.get('expand');
    if (expandId) {
      setTimeout(() => {
        document.getElementById(`sol-${expandId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 400);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [solRes, equipoRes] = await Promise.all([
          api.get('/solicitudes'),
          api.get('/users/equipo'),
        ]);
        setSolicitudes((Array.isArray(solRes) ? solRes : solRes.data || []).map(normalizeSol));
        setEquipo(Array.isArray(equipoRes) ? equipoRes : []);
      } catch (error) {
        console.error('Error fetching solicitudes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const solicitudesFiltradas = useMemo(() => {
    let resultado = [...solicitudes];

    if (busqueda) {
      const term = busqueda.toLowerCase();
      resultado = resultado.filter(
        (s) =>
          (s.titulo || '').toLowerCase().includes(term) ||
          (s.id || '').toLowerCase().includes(term) ||
          (s.solicitante?.nombre || '').toLowerCase().includes(term)
      );
    }

    if (filtroEstado !== 'todos') {
      resultado = resultado.filter((s) => s.estado === filtroEstado);
    }

    if (filtroTipo !== 'todos') {
      resultado = resultado.filter((s) => s.tipo === filtroTipo || s.tipoId === filtroTipo);
    }

    return resultado;
  }, [solicitudes, busqueda, filtroEstado, filtroTipo]);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/solicitudes/${id}/estado`, { estado: nuevoEstado.toUpperCase() });
      setSolicitudes((prev) =>
        prev.map((s) => s.id === id ? { ...s, estado: nuevoEstado } : s)
      );
    } catch (error) {
      alert(error.data?.error || 'Error al cambiar estado');
    }
  };

  const cambiarPrioridad = async (id, nuevaPrioridad) => {
    try {
      await api.patch(`/solicitudes/${id}/prioridad`, { prioridad: nuevaPrioridad.toUpperCase() });
      setSolicitudes((prev) =>
        prev.map((s) => s.id === id ? { ...s, prioridad: nuevaPrioridad } : s)
      );
    } catch (error) {
      alert(error.data?.error || 'Error al cambiar prioridad');
    }
  };

  const asignarMiembro = async (id, miembroId) => {
    try {
      if (!miembroId) {
        await api.patch(`/solicitudes/${id}/asignar`, { asignadoAId: null });
        setSolicitudes((prev) =>
          prev.map((s) => s.id === id ? { ...s, asignadoA: null } : s)
        );
      } else {
        await api.patch(`/solicitudes/${id}/asignar`, { asignadoAId: parseInt(miembroId) });
        const idNum = parseInt(miembroId);
        const miembro = equipo.find((m) => m.id === idNum)
          || (usuario && usuario.id === idNum ? { id: usuario.id, nombre: usuario.nombre } : null);
        setSolicitudes((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  asignadoA: miembro ? { id: miembro.id, nombre: miembro.nombre } : null,
                  estado: miembro && s.estado === 'pendiente' ? 'en_proceso' : s.estado,
                }
              : s
          )
        );
      }
    } catch (error) {
      alert(error.data?.error || 'Error al asignar');
    }
  };

  const autoAsignar = async (id) => {
    try {
      await api.post(`/solicitudes/${id}/tomar`);
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                asignadoA: { id: usuario.id, nombre: usuario.nombre },
                estado: 'en_proceso',
              }
            : s
        )
      );
    } catch (error) {
      alert(error.data?.error || 'Error al tomar solicitud');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 px-4 sm:px-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
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

      {/* Banner de solicitudes completadas — solo SOLICITANTE */}
      {esSolicitante() && !bannerCerrado && (() => {
        const completadas = solicitudes.filter((s) => s.estado === 'completada');
        if (completadas.length === 0) return null;
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-emerald-800">
                {completadas.length === 1
                  ? '¡Tu solicitud fue completada!'
                  : `¡${completadas.length} solicitudes fueron completadas!`}
              </p>
              <ul className="mt-1 space-y-0.5">
                {completadas.slice(0, 3).map((s) => (
                  <li key={s.id} className="text-sm text-emerald-700 truncate">
                    · {s.titulo} <span className="text-emerald-500 text-xs">({s.id})</span>
                  </li>
                ))}
                {completadas.length > 3 && (
                  <li className="text-xs text-emerald-500">y {completadas.length - 3} más...</li>
                )}
              </ul>
            </div>
            <button
              onClick={() => setBannerCerrado(true)}
              className="text-emerald-400 hover:text-emerald-600 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })()}

      {/* Barra de filtros */}
      <div className="card p-3 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={esSolicitante() ? 'Buscar por título o ticket...' : 'Buscar por título, ticket o solicitante...'}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="input-field text-sm"
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
              className="input-field text-sm"
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
            <div key={sol.id} id={`sol-${sol.id}`} className={`card overflow-hidden ${sol.estado === 'completada' ? 'border-l-4 border-l-emerald-400' : sol.estado === 'rechazada' ? 'border-l-4 border-l-red-300' : ''} ${expandida === sol.id ? 'ring-2 ring-blue-300' : ''}`}>
              {/* Fila principal */}
              <div
                className="flex items-start sm:items-center gap-3 sm:gap-4 cursor-pointer"
                onClick={() => setExpandida(expandida === sol.id ? null : sol.id)}
              >
                <div className="hidden sm:flex w-12 h-12 bg-gray-100 rounded-xl items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-gray-500">{sol.id.split('-')[1]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{sol.titulo}</p>
                    <span className="text-xs text-gray-400 font-mono">{sol.id}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1 truncate max-w-[120px] sm:max-w-none">
                      <Tag className="w-3 h-3 shrink-0" />
                      {sol.tipoNombre}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {sol.fechaCreacion}
                    </span>
                    {!esSolicitante() && (
                      <span className="hidden sm:flex items-center gap-1">
                        <User className="w-3 h-3 shrink-0" />
                        {sol.solicitante.nombre}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3 shrink-0">
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
                  {(esAdmin() || esDirector()) && (
                  <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-100">
                    {esDirector() && !sol.asignadoA && (
                      <button
                        onClick={() => autoAsignar(sol.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-xl flex items-center gap-2 transition-colors self-end"
                      >
                        <UserCheck className="w-4 h-4" />
                        Tomar solicitud
                      </button>
                    )}
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs text-gray-500 mb-1">Asignar a</label>
                      <select
                        value={sol.asignadoA?.id || ''}
                        onChange={(e) => asignarMiembro(sol.id, e.target.value)}
                        className="input-field w-full sm:w-auto text-sm"
                      >
                        <option value="">Sin asignar</option>
                        {esDirector() && (
                          <option value={usuario.id}>{usuario.nombre} (Yo)</option>
                        )}
                        {equipo.map((m) => (
                          <option key={m.id} value={m.id}>{m.nombre} ({m.cargo})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs text-gray-500 mb-1">Estado</label>
                      <select
                        value={sol.estado}
                        onChange={(e) => cambiarEstado(sol.id, e.target.value)}
                        className="input-field w-full sm:w-auto text-sm"
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En proceso</option>
                        <option value="completada">Completada</option>
                        <option value="rechazada">Rechazada</option>
                      </select>
                    </div>
                    <div className="w-full sm:w-auto">
                      <label className="block text-xs text-gray-500 mb-1">Prioridad</label>
                      <select
                        value={sol.prioridad}
                        onChange={(e) => cambiarPrioridad(sol.id, e.target.value)}
                        className="input-field w-full sm:w-auto text-sm"
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
