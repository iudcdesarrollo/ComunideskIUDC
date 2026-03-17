import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  AlertTriangle,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
} from 'lucide-react';

const estadoConfig = {
  pendiente: {
    clase: 'bg-amber-100 text-amber-700 border-amber-200',
    icono: Clock,
    label: 'Pendiente',
  },
  en_proceso: {
    clase: 'bg-blue-100 text-blue-700 border-blue-200',
    icono: Clock,
    label: 'En proceso',
  },
  resuelto: {
    clase: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icono: CheckCircle2,
    label: 'Resuelto',
  },
};

export default function CanalUrgente() {
  const { usuario, esAdmin, esDirector } = useAuth();
  const [urgentes, setUrgentes] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUrgentes = async () => {
      try {
        const res = await api.get('/urgentes');
        const data = Array.isArray(res) ? res : res.data || [];
        setUrgentes(data.map(u => ({ ...u, estado: (u.estado || '').toLowerCase() })));
      } catch (error) {
        console.error('Error fetching urgentes:', error);
        // Show fetch error if it's a 403 (permissions issue)
        if (error.status === 403) {
          alert('No tienes permisos para ver el canal urgente.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUrgentes();
  }, []);

  const enviarUrgente = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !descripcion.trim()) return;

    try {
      const nuevo = await api.post('/urgentes', {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
      });
      setUrgentes((prev) => [{ ...nuevo, estado: (nuevo.estado || '').toLowerCase() }, ...prev]);
      setTitulo('');
      setDescripcion('');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 3000);
    } catch (error) {
      alert(error.data?.error || 'Error al enviar urgente');
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      await api.patch(`/urgentes/${id}/estado`, { estado: nuevoEstado.toUpperCase() });
      setUrgentes((prev) =>
        prev.map((u) => u.id === id ? { ...u, estado: nuevoEstado } : u)
      );
    } catch (error) {
      alert(error.data?.error || 'Error al cambiar estado');
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
    <div className="max-w-4xl mx-auto space-y-6 px-4 sm:px-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Canal urgente</h1>
          <p className="text-gray-500 mt-0.5 text-sm flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Solo visible para Administración y Equipo
          </p>
        </div>
      </div>

      {/* Formulario de solicitud urgente — solo Admin/Director */}
      {(esAdmin() || esDirector()) && (
        <div className="card border-l-4 border-l-red-500">
          <h2 className="font-semibold text-gray-900 mb-4">Nueva solicitud urgente</h2>

          {enviado && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Solicitud urgente enviada correctamente.
            </div>
          )}

          <form onSubmit={enviarUrgente} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Asunto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Describe brevemente la urgencia"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Descripción detallada <span className="text-red-500">*</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Explica todos los detalles de la solicitud urgente..."
                className="input-field min-h-[120px] resize-y"
                required
              />
            </div>

            <button type="submit" className="btn-danger flex items-center gap-2">
              <Send className="w-4 h-4" />
              Enviar solicitud urgente
            </button>
          </form>
        </div>
      )}

      {/* Lista de urgentes */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Historial de solicitudes urgentes
        </h2>

        {urgentes.length === 0 ? (
          <div className="card text-center py-10">
            <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay solicitudes urgentes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgentes.map((urg) => {
              const config = estadoConfig[urg.estado] || estadoConfig.pendiente;
              const IconEstado = config.icono;
              return (
                <div key={urg.id} className="card border-l-4 border-l-red-400">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">{urg.titulo}</h3>
                        <span className={`badge border ${config.clase}`}>
                          <IconEstado className="w-3 h-3 mr-1" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{urg.descripcion}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                        <span>{urg.solicitante?.nombre}</span>
                        <span>{urg.solicitante?.cargo}</span>
                        <span>{urg.fechaCreacion || (urg.createdAt ? new Date(urg.createdAt).toISOString().split('T')[0] : '')}</span>
                      </div>
                    </div>

                    {(esAdmin() || esDirector()) && (
                      <div className="shrink-0">
                        <select
                          value={urg.estado}
                          onChange={(e) => cambiarEstado(urg.id, e.target.value)}
                          className="input-field text-sm w-full sm:w-auto"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En proceso</option>
                          <option value="resuelto">Resuelto</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
