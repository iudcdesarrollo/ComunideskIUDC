import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  AlertTriangle,
  Send,
  Clock,
  CheckCircle2,
  Shield,
  UserPlus,
  Users,
  X,
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
  const [equipo, setEquipo] = useState([]);
  const [modalAsignar, setModalAsignar] = useState(null); // urgente id
  const [seleccionados, setSeleccionados] = useState([]);

  const esGestor = esAdmin() || esDirector();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/urgentes');
        const data = Array.isArray(res) ? res : res.data || [];
        setUrgentes(data.map(u => ({ ...u, estado: (u.estado || '').toLowerCase() })));

        if (esGestor) {
          try {
            const eq = await api.get('/urgentes/equipo');
            setEquipo(Array.isArray(eq) ? eq : eq.data || []);
          } catch {}
        }
      } catch (error) {
        console.error('Error fetching urgentes:', error);
        if (error.status === 403) {
          alert('No tienes permisos para ver el canal urgente.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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

  const abrirModalAsignar = (urg) => {
    setModalAsignar(urg.id);
    setSeleccionados(urg.asignados?.map(a => a.id) || []);
  };

  const toggleSeleccion = (id) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const guardarAsignacion = async () => {
    try {
      const res = await api.patch(`/urgentes/${modalAsignar}/asignar`, {
        asignadoIds: seleccionados,
      });
      setUrgentes(prev =>
        prev.map(u => u.id === modalAsignar ? { ...u, asignados: res.asignados } : u)
      );
      setModalAsignar(null);
    } catch (error) {
      alert(error.data?.error || 'Error al asignar');
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

      {/* Formulario — solo Admin/Director */}
      {esGestor && (
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-900">{urg.titulo}</h3>
                        <span className={`badge border ${config.clase}`}>
                          <IconEstado className="w-3 h-3 mr-1" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{urg.descripcion}</p>

                      {/* Asignados */}
                      {urg.asignados?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {urg.asignados.map(a => (
                            <span key={a.id} className="flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5">
                              <Users className="w-3 h-3" />
                              {a.nombre}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                        <span>{urg.solicitante?.nombre}</span>
                        <span>{urg.solicitante?.cargo}</span>
                        <span>{urg.fechaCreacion || (urg.createdAt ? new Date(urg.createdAt).toISOString().split('T')[0] : '')}</span>
                      </div>
                    </div>

                    {esGestor && (
                      <div className="shrink-0 flex flex-col gap-2">
                        <select
                          value={urg.estado}
                          onChange={(e) => cambiarEstado(urg.id, e.target.value)}
                          className="input-field text-sm w-full sm:w-auto"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En proceso</option>
                          <option value="resuelto">Resuelto</option>
                        </select>

                        <button
                          onClick={() => abrirModalAsignar(urg)}
                          className="flex items-center justify-center gap-1.5 text-sm px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Asignar ({urg.asignados?.length || 0})
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de asignación */}
      {modalAsignar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                Asignar responsables
              </h3>
              <button onClick={() => setModalAsignar(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-sm text-gray-500 mb-4">Selecciona uno o más miembros del equipo:</p>
              <div className="space-y-2">
                {equipo.map(m => {
                  const activo = seleccionados.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleSeleccion(m.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                        activo
                          ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        activo ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {m.nombre.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{m.nombre}</p>
                        <p className="text-xs text-gray-500 truncate">{m.cargo}</p>
                      </div>
                      {activo && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t flex gap-3">
              <button
                onClick={() => setModalAsignar(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={guardarAsignacion}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Guardar ({seleccionados.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
