import { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Download,
  FileSpreadsheet,
  Radio,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function Exportar() {
  const [tipoExportacion, setTipoExportacion] = useState('solicitudes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [exportado, setExportado] = useState(false);

  const [solicitudes, setSolicitudes] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [urgentes, setUrgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [solRes, radioRes, urgRes] = await Promise.all([
          api.get('/solicitudes'),
          api.get('/radio/reservas?semana=all').catch(() => []),
          api.get('/urgentes').catch(() => []),
        ]);
        setSolicitudes(Array.isArray(solRes) ? solRes : solRes.data || []);
        setReservas(Array.isArray(radioRes) ? radioRes : radioRes.reservas || []);
        setUrgentes(Array.isArray(urgRes) ? urgRes : []);
      } catch (error) {
        console.error('Error fetching export data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const opciones = [
    {
      id: 'solicitudes',
      nombre: 'Solicitudes',
      descripcion: 'Todas las solicitudes registradas con sus datos completos',
      icono: FileText,
      color: 'blue',
      cantidad: solicitudes.length,
    },
    {
      id: 'radio',
      nombre: 'Reservas de Radio',
      descripcion: 'Historial de reservas de la parrilla de Radio IUDC',
      icono: Radio,
      color: 'red',
      cantidad: reservas.length,
    },
    {
      id: 'urgentes',
      nombre: 'Solicitudes Urgentes',
      descripcion: 'Registro de todas las solicitudes del canal urgente',
      icono: AlertTriangle,
      color: 'amber',
      cantidad: urgentes.length,
    },
  ];

  const descargar = async () => {
    setDescargando(true);
    try {
      const endpoint = tipoExportacion === 'solicitudes' ? '/exportar/solicitudes'
        : tipoExportacion === 'radio' ? '/exportar/radio'
        : '/exportar/urgentes';

      const blob = await api.get(endpoint);

      const filename = tipoExportacion === 'solicitudes' ? 'solicitudes_comunidesk.csv'
        : tipoExportacion === 'radio' ? 'reservas_radio_comunidesk.csv'
        : 'urgentes_comunidesk.csv';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportado(true);
      setTimeout(() => setExportado(false), 3000);
    } catch (error) {
      alert(error.data?.error || 'Error al exportar');
    } finally {
      setDescargando(false);
    }
  };

  const coloresOpcion = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', active: 'ring-blue-200 border-blue-400' },
    red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600', active: 'ring-red-200 border-red-400' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', active: 'ring-amber-200 border-amber-400' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Download className="w-6 h-6 text-blue-600" />
          Exportar datos
        </h1>
        <p className="text-gray-500 mt-1">Descarga la información del sistema en formato CSV</p>
      </div>

      {/* Selección de tipo */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">¿Qué datos deseas exportar?</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {opciones.map((op) => {
            const Icon = op.icono;
            const colores = coloresOpcion[op.color];
            const activo = tipoExportacion === op.id;
            return (
              <button
                key={op.id}
                onClick={() => setTipoExportacion(op.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                  activo
                    ? `${colores.bg} ${colores.active} ring-2`
                    : `bg-white border-gray-200 hover:${colores.bg} hover:${colores.border}`
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${colores.icon}`} />
                <p className="font-semibold text-gray-900 text-sm">{op.nombre}</p>
                <p className="text-xs text-gray-500 mt-1">{op.cantidad} registros</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Vista previa */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Vista previa</h2>
          <span className="text-sm text-gray-500">
            {tipoExportacion === 'solicitudes' ? solicitudes.length :
             tipoExportacion === 'radio' ? reservas.length :
             urgentes.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          {tipoExportacion === 'solicitudes' && (
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Ticket</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Título</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Tipo</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.slice(0, 5).map((s) => (
                  <tr key={s.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono text-blue-600">{s.id}</td>
                    <td className="py-2 text-gray-900 truncate max-w-[200px]">{s.titulo}</td>
                    <td className="py-2 text-gray-600">{s.tipoNombre || s.tipoSolicitud?.nombre || ''}</td>
                    <td className="py-2">
                      <span className={`badge ${
                        s.estado === 'pendiente' ? 'badge-pendiente' :
                        s.estado === 'en_proceso' ? 'badge-en-proceso' :
                        'badge-completada'
                      }`}>
                        {s.estado === 'pendiente' ? 'Pendiente' :
                         s.estado === 'en_proceso' ? 'En proceso' : 'Completada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tipoExportacion === 'radio' && (
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Programa</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Día</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Hora</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Solicitante</th>
                </tr>
              </thead>
              <tbody>
                {reservas.slice(0, 5).map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{r.formulario?.nombre_programa || 'Sin nombre'}</td>
                    <td className="py-2 text-gray-600">{r.dia}</td>
                    <td className="py-2 text-gray-600">{r.hora}</td>
                    <td className="py-2 text-gray-600">{r.solicitante?.nombre || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tipoExportacion === 'urgentes' && (
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Título</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Solicitante</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Estado</th>
                  <th className="text-left pb-2 text-xs font-semibold text-gray-500">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {urgentes.slice(0, 5).map((u) => (
                  <tr key={u.id} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{u.titulo}</td>
                    <td className="py-2 text-gray-600">{u.solicitante?.nombre || ''}</td>
                    <td className="py-2 text-gray-600 capitalize">{u.estado}</td>
                    <td className="py-2 text-gray-600">{u.fechaCreacion || (u.createdAt ? new Date(u.createdAt).toISOString().split('T')[0] : '')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Botón de descarga */}
      <div className="card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
          <div>
            <p className="font-semibold text-gray-900">Descargar como CSV</p>
            <p className="text-xs text-gray-500">Compatible con Excel, Google Sheets y otros</p>
          </div>
        </div>

        <button onClick={descargar} disabled={descargando} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50">
          <Download className="w-4 h-4" />
          {descargando ? 'Descargando...' : 'Descargar'}
        </button>
      </div>

      {exportado && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Archivo descargado exitosamente.
        </div>
      )}
    </div>
  );
}
