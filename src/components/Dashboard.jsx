import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Radio,
  ArrowRight,
  ClipboardList,
  Camera,
  Palette,
  Award,
  FolderOpen,
  Loader,
  BarChart3,
  Shield,
  Download,
} from 'lucide-react';

const iconosTipo = { ClipboardList, Camera, Palette, Award, FolderOpen, Radio };

const coloresTipo = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  pink: 'bg-pink-50 text-pink-600 border-pink-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  red: 'bg-red-50 text-red-600 border-red-100',
};

export default function Dashboard() {
  const { usuario, puedeVerUrgentes, puedeGestionarSolicitudes, esAdmin, esEquipo, esSolicitante } = useAuth();
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [urgentes, setUrgentes] = useState([]);
  const [reservasPendientesCount, setReservasPendientesCount] = useState(0);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [solRes, tiposRes] = await Promise.all([
          api.get('/solicitudes'),
          api.get('/tipos'),
        ]);
        setSolicitudes(Array.isArray(solRes) ? solRes : solRes.data || []);
        setTipos(Array.isArray(tiposRes) ? tiposRes : []);

        // Only fetch urgentes if user can see them
        if (puedeVerUrgentes()) {
          try {
            const urgRes = await api.get('/urgentes');
            setUrgentes(Array.isArray(urgRes) ? urgRes : []);
          } catch (e) { /* ignore if forbidden */ }
        }

        // Fetch radio pendientes count for admin/equipo
        if (puedeGestionarSolicitudes()) {
          try {
            const radioRes = await api.get('/radio/reservas/pendientes');
            setReservasPendientesCount(Array.isArray(radioRes) ? radioRes.length : 0);
          } catch (e) { /* ignore */ }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const misSolicitudes = solicitudes;

  const stats = {
    total: misSolicitudes.length,
    pendientes: misSolicitudes.filter((s) => s.estado === 'pendiente').length,
    enProceso: misSolicitudes.filter((s) => s.estado === 'en_proceso').length,
    completadas: misSolicitudes.filter((s) => s.estado === 'completada').length,
  };

  const reservasPendientes = reservasPendientesCount;

  const estadoBadge = (estado) => {
    const map = { pendiente: 'badge-pendiente', en_proceso: 'badge-en-proceso', completada: 'badge-completada', rechazada: 'badge-rechazada' };
    const labels = { pendiente: 'Pendiente', en_proceso: 'En proceso', completada: 'Completada', rechazada: 'Rechazada' };
    return <span className={map[estado]}>{labels[estado]}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {esAdmin() ? 'Panel de administración' : esEquipo() ? 'Mi panel de trabajo' : 'Panel principal'}
          </h1>
          <p className="text-gray-500 mt-1">
            {esAdmin()
              ? 'Vista completa de todas las operaciones del área de comunicaciones'
              : esEquipo()
                ? 'Solicitudes asignadas y pendientes por atender'
                : 'Gestiona tus solicitudes y reservas'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {(esSolicitante() || esAdmin()) && (
            <button onClick={() => navigate('/nueva-solicitud')} className="btn-primary flex items-center gap-2">
              <PlusCircle className="w-4 h-4" />
              Nueva solicitud
            </button>
          )}
          <button onClick={() => navigate('/radio')} className="btn-secondary flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Radio
          </button>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendientes}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Loader className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.enProceso}</p>
              <p className="text-xs text-gray-500">En proceso</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.completadas}</p>
              <p className="text-xs text-gray-500">Completadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alertas para admin */}
      {esAdmin() && (
        <div className="grid sm:grid-cols-2 gap-4">
          {puedeVerUrgentes() && urgentes.filter((u) => u.estado === 'pendiente').length > 0 && (
            <div
              onClick={() => navigate('/urgente')}
              className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-red-100 transition-colors"
            >
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-800">
                  {urgentes.filter((u) => u.estado === 'pendiente').length} solicitud(es) urgente(s)
                </h3>
                <p className="text-sm text-red-600 truncate">
                  {urgentes.find((u) => u.estado === 'pendiente')?.titulo}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-red-400 shrink-0" />
            </div>
          )}

          {reservasPendientes > 0 && (
            <div
              onClick={() => navigate('/radio')}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-800">
                  {reservasPendientes} reserva(s) de radio pendiente(s)
                </h3>
                <p className="text-sm text-amber-600">Requieren aprobación</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 shrink-0" />
            </div>
          )}
        </div>
      )}

      {/* Alerta para equipo */}
      {esEquipo() && (stats.pendientes > 0 || reservasPendientes > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {stats.pendientes > 0 && (
            <div
              onClick={() => navigate('/mis-solicitudes')}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-800">{stats.pendientes} solicitud(es) pendiente(s)</h3>
                <p className="text-sm text-amber-600">Por atender</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 shrink-0" />
            </div>
          )}
          {reservasPendientes > 0 && (
            <div
              onClick={() => navigate('/radio')}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-amber-100 transition-colors"
            >
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shrink-0">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-amber-800">{reservasPendientes} reserva(s) de radio</h3>
                <p className="text-sm text-amber-600">Pendientes de aprobación</p>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 shrink-0" />
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Acciones rápidas - Solo solicitantes */}
        {esSolicitante() && (
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Crear solicitud</h2>
            <div className="space-y-2">
              {tipos.filter((t) => t.id !== 'radio').map((tipo) => {
                const Icon = iconosTipo[tipo.icono];
                return (
                  <button
                    key={tipo.id}
                    onClick={() => navigate('/nueva-solicitud', { state: { tipo: tipo.id } })}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${coloresTipo[tipo.color]}`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <div className="text-left flex-1">
                      <span className="text-sm font-medium block">{tipo.nombre}</span>
                      <span className="text-[10px] opacity-60">{tipo.tiempoEntrega}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 opacity-50" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Carga de trabajo - Solo equipo */}
        {esEquipo() && (
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi carga de trabajo</h2>
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Asignadas a mí</span>
                <span className="font-bold text-gray-900">
                  {solicitudes.filter((s) => s.asignadoA?.id === usuario.id).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">En proceso</span>
                <span className="font-bold text-blue-600">
                  {solicitudes.filter((s) => s.asignadoA?.id === usuario.id && s.estado === 'en_proceso').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completadas por mí</span>
                <span className="font-bold text-emerald-600">
                  {solicitudes.filter((s) => s.asignadoA?.id === usuario.id && s.estado === 'completada').length}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-600">Sin asignar (general)</span>
                <span className="font-bold text-amber-600">
                  {solicitudes.filter((s) => !s.asignadoA).length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Accesos rápidos - Solo admin */}
        {esAdmin() && (
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos rápidos</h2>
            <div className="space-y-2">
              <button onClick={() => navigate('/nueva-solicitud')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Nueva solicitud</span>
                <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
              </button>
              <button onClick={() => navigate('/seguimiento')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Seguimiento y métricas</span>
                <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
              </button>
              <button onClick={() => navigate('/urgente')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 transition-all">
                <Shield className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-700">Canal urgente</span>
                <ArrowRight className="w-4 h-4 ml-auto text-red-400" />
              </button>
              <button onClick={() => navigate('/exportar')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all">
                <Download className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-medium text-gray-700">Exportar datos</span>
                <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
              </button>
              <button onClick={() => navigate('/radio')} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-all">
                <Radio className="w-5 h-5 text-red-500" />
                <span className="text-sm font-medium text-gray-700">Gestionar parrilla de radio</span>
                <ArrowRight className="w-4 h-4 ml-auto text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Solicitudes recientes */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {esEquipo() ? 'Solicitudes por atender' : esSolicitante() ? 'Mis solicitudes recientes' : 'Todas las solicitudes'}
            </h2>
            <button onClick={() => navigate('/mis-solicitudes')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {misSolicitudes.length === 0 ? (
              <div className="card text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{esEquipo() ? 'No hay solicitudes pendientes' : 'No hay solicitudes aún'}</p>
                {esSolicitante() && (
                  <button onClick={() => navigate('/nueva-solicitud')} className="btn-primary mt-4 inline-flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Crear primera solicitud
                  </button>
                )}
              </div>
            ) : (
              misSolicitudes.slice(0, 6).map((sol) => (
                <div key={sol.id} className="card-hover flex items-center gap-4" onClick={() => navigate('/mis-solicitudes')}>
                  <div className="hidden sm:flex w-10 h-10 bg-gray-100 rounded-xl items-center justify-center text-xs font-bold text-gray-500">
                    {sol.id.split('-')[1]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{sol.titulo}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-500">{sol.tipoNombre}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-500">{sol.fechaCreacion}</span>
                      {puedeGestionarSolicitudes() && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-500">{sol.solicitante.nombre}</span>
                        </>
                      )}
                      {sol.tiempoEntrega && esSolicitante() && (
                        <>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {sol.tiempoEntrega}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">{estadoBadge(sol.estado)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
