import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart3,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Users,
  ArrowUpRight,
  Loader,
} from 'lucide-react';

export default function Seguimiento() {
  const [stats, setStats] = useState({
    total: 0, pendientes: 0, enProceso: 0, completadas: 0, rechazadas: 0,
    porTipo: [], porPrioridad: { alta: 0, media: 0, baja: 0 },
    asignaciones: {}, tasaCompletado: 0,
  });
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, solRes] = await Promise.all([
          api.get('/stats/dashboard'),
          api.get('/solicitudes'),
        ]);
        setStats(statsRes);
        setSolicitudes(Array.isArray(solRes) ? solRes : solRes.data || []);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const coloresBarraTipo = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    amber: 'bg-amber-500',
    emerald: 'bg-emerald-500',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Seguimiento de solicitudes
        </h1>
        <p className="text-gray-500 mt-1">Métricas y estado general del área de comunicaciones</p>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.tasaCompletado}%</p>
              <p className="text-xs text-gray-500">Tasa completada</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Por tipo */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Solicitudes por tipo</h2>
          <div className="space-y-4">
            {stats.porTipo.map((tipo) => (
              <div key={tipo.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{tipo.nombre}</span>
                  <span className="text-sm font-semibold text-gray-900">{tipo.cantidad}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${coloresBarraTipo[tipo.color] || 'bg-gray-400'}`}
                    style={{ width: `${stats.total > 0 ? (tipo.cantidad / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Por prioridad */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Distribución por prioridad</h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full" />
                  Alta
                </span>
                <span className="text-sm font-semibold text-gray-900">{stats.porPrioridad.alta}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-red-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.porPrioridad.alta / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-amber-500 rounded-full" />
                  Media
                </span>
                <span className="text-sm font-semibold text-gray-900">{stats.porPrioridad.media}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.porPrioridad.media / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 flex items-center gap-2">
                  <span className="w-3 h-3 bg-gray-400 rounded-full" />
                  Baja
                </span>
                <span className="text-sm font-semibold text-gray-900">{stats.porPrioridad.baja}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div
                  className="bg-gray-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${stats.total > 0 ? (stats.porPrioridad.baja / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Carga del equipo */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Carga del equipo
          </h2>

          {Object.keys(stats.asignaciones).length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              Aún no hay solicitudes asignadas al equipo.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.entries(stats.asignaciones).map(([nombre, data]) => (
                <div key={nombre} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-200 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                        {nombre.charAt(0)}
                      </div>
                      <p className="font-medium text-gray-900 text-sm">{nombre}</p>
                    </div>
                    <span className="text-lg font-bold text-gray-900">{data.total}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="badge-en-proceso">{data.enProceso} en proceso</span>
                    <span className="badge-completada">{data.completadas} completadas</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de todos los tickets */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Todos los tickets</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Ticket</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Título</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Tipo</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Solicitante</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Asignado a</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Estado</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((sol) => (
                <tr key={sol.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 text-sm font-mono font-medium text-blue-600">{sol.id}</td>
                  <td className="py-3 text-sm text-gray-900 max-w-[200px] truncate">{sol.titulo}</td>
                  <td className="py-3 text-sm text-gray-600">{sol.tipoNombre || sol.tipoSolicitud?.nombre || ''}</td>
                  <td className="py-3 text-sm text-gray-600">{sol.solicitante?.nombre || ''}</td>
                  <td className="py-3 text-sm text-gray-600">{sol.asignadoA?.nombre || '—'}</td>
                  <td className="py-3">
                    <span className={`badge ${
                      sol.estado === 'pendiente' ? 'badge-pendiente' :
                      sol.estado === 'en_proceso' ? 'badge-en-proceso' :
                      sol.estado === 'completada' ? 'badge-completada' :
                      'badge-rechazada'
                    }`}>
                      {sol.estado === 'pendiente' ? 'Pendiente' :
                       sol.estado === 'en_proceso' ? 'En proceso' :
                       sol.estado === 'completada' ? 'Completada' :
                       'Rechazada'}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-500">{sol.fechaCreacion || (sol.createdAt ? new Date(sol.createdAt).toISOString().split('T')[0] : '')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
