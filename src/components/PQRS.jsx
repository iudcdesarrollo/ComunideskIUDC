import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  MessageSquarePlus, Send, X, Clock, CheckCircle2, Eye,
  AlertCircle, ThumbsUp, HelpCircle, Megaphone, Star,
  ChevronDown, MessageCircle, Shield,
} from 'lucide-react';

const TIPOS = [
  { value: 'PETICION', label: 'Peticion', icon: HelpCircle, color: 'blue' },
  { value: 'QUEJA', label: 'Queja', icon: AlertCircle, color: 'red' },
  { value: 'RECLAMO', label: 'Reclamo', icon: Megaphone, color: 'orange' },
  { value: 'SUGERENCIA', label: 'Sugerencia', icon: MessageCircle, color: 'purple' },
  { value: 'FELICITACION', label: 'Felicitacion', icon: Star, color: 'green' },
];

const TIPO_MAP = Object.fromEntries(TIPOS.map((t) => [t.value, t]));

const ESTADO_STYLES = {
  PENDIENTE: 'bg-amber-100 text-amber-700',
  EN_REVISION: 'bg-blue-100 text-blue-700',
  RESUELTA: 'bg-green-100 text-green-700',
  CERRADA: 'bg-gray-100 text-gray-600',
};

const ESTADO_LABELS = {
  PENDIENTE: 'Pendiente',
  EN_REVISION: 'En revision',
  RESUELTA: 'Resuelta',
  CERRADA: 'Cerrada',
};

const COLOR_CLASSES = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-600',   ring: 'ring-blue-500',   btnBg: 'bg-blue-600 hover:bg-blue-700' },
  red:    { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-600',    ring: 'ring-red-500',    btnBg: 'bg-red-600 hover:bg-red-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', ring: 'ring-orange-500', btnBg: 'bg-orange-600 hover:bg-orange-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', ring: 'ring-purple-500', btnBg: 'bg-purple-600 hover:bg-purple-700' },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600',  ring: 'ring-green-500',  btnBg: 'bg-green-600 hover:bg-green-700' },
};

const FORM_VACIO = { tipo: '', titulo: '', mensaje: '' };

export default function PQRS() {
  const { usuario, esAdmin, esDirector } = useAuth();
  const esGestor = esAdmin() || esDirector();

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCrear, setModalCrear] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [exito, setExito] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [respuestaTexto, setRespuestaTexto] = useState('');
  const [enviandoRespuesta, setEnviandoRespuesta] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await api.get('/pqrs');
      setLista(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/pqrs', form);
      await cargar();
      setModalCrear(false);
      setForm(FORM_VACIO);
      setExito(true);
      setTimeout(() => setExito(false), 5000);
    } catch (err) {
      alert(err.data?.error || 'Error al enviar');
    } finally {
      setEnviando(false);
    }
  };

  const responder = async (id) => {
    if (!respuestaTexto.trim()) return;
    setEnviandoRespuesta(true);
    try {
      const updated = await api.patch(`/pqrs/${id}/responder`, {
        respuesta: respuestaTexto,
        estado: 'RESUELTA',
      });
      setModalDetalle(updated);
      setRespuestaTexto('');
      await cargar();
    } catch (err) {
      alert(err.data?.error || 'Error al responder');
    } finally {
      setEnviandoRespuesta(false);
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      const updated = await api.patch(`/pqrs/${id}/estado`, { estado });
      setModalDetalle(updated);
      await cargar();
    } catch (err) {
      alert(err.data?.error || 'Error al cambiar estado');
    }
  };

  const listaFiltrada = lista.filter((p) => {
    if (filtroTipo && p.tipo !== filtroTipo) return false;
    if (filtroEstado && p.estado !== filtroEstado) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const tipoSeleccionado = TIPOS.find((t) => t.value === form.tipo);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">PQRS</h1>
          </div>
          <p className="text-gray-500 text-sm">
            {esGestor
              ? 'Gestiona peticiones, quejas, reclamos, sugerencias y felicitaciones'
              : 'Envia una peticion, queja, reclamo, sugerencia o felicitacion de forma confidencial'}
          </p>
        </div>
        {!esGestor && (
          <button
            onClick={() => { setForm(FORM_VACIO); setModalCrear(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
          >
            <MessageSquarePlus className="w-4 h-4" />
            Nueva PQRS
          </button>
        )}
      </div>

      {/* Aviso de privacidad */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-800 font-semibold text-sm">Totalmente confidencial</p>
          <p className="text-blue-700 text-xs mt-0.5">
            {esGestor
              ? 'Solo tu y el solicitante pueden ver el contenido de cada PQRS. Esta informacion es privada.'
              : 'Solo tu y la direccion pueden ver tus PQRS. Ningun otro usuario tiene acceso a esta informacion.'}
          </p>
        </div>
      </div>

      {/* Exito */}
      {exito && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-green-800 font-semibold text-sm">PQRS enviada exitosamente</p>
            <p className="text-green-700 text-xs mt-0.5">La direccion revisara tu solicitud y te respondera.</p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="input-field pr-8 text-sm appearance-none cursor-pointer"
          >
            <option value="">Todos los tipos</option>
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="input-field pr-8 text-sm appearance-none cursor-pointer"
          >
            <option value="">Todos los estados</option>
            {Object.entries(ESTADO_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <span className="text-xs text-gray-400 self-center ml-auto">
          {listaFiltrada.length} {listaFiltrada.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {/* Lista */}
      {listaFiltrada.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquarePlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay PQRS registradas</p>
          {!esGestor && (
            <p className="text-gray-400 text-sm mt-1">Haz clic en "Nueva PQRS" para enviar una</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listaFiltrada.map((pqrs) => {
            const tipoInfo = TIPO_MAP[pqrs.tipo] || TIPOS[0];
            const Icon = tipoInfo.icon;
            const colors = COLOR_CLASSES[tipoInfo.color];
            return (
              <button
                key={pqrs.id}
                onClick={() => { setModalDetalle(pqrs); setRespuestaTexto(''); }}
                className={`w-full text-left card border-l-4 ${colors.border} hover:shadow-md transition-shadow`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm truncate">{pqrs.titulo}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {tipoInfo.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_STYLES[pqrs.estado]}`}>
                        {ESTADO_LABELS[pqrs.estado]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">{pqrs.mensaje}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(pqrs.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {esGestor && pqrs.solicitante && (
                        <span>{pqrs.solicitante.nombre}</span>
                      )}
                      {pqrs.respuesta && (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="w-3 h-3" /> Respondida
                        </span>
                      )}
                    </div>
                  </div>
                  <Eye className="w-4 h-4 text-gray-300 shrink-0 hidden sm:block" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Modal: Crear PQRS */}
      {modalCrear && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl p-4 sm:p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base sm:text-lg">Nueva PQRS</h3>
                  <p className="text-blue-200 text-sm mt-0.5">Tu mensaje es completamente confidencial</p>
                </div>
                <button onClick={() => setModalCrear(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={enviar} className="p-4 sm:p-5 space-y-4">
              {/* Selector de tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de solicitud *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIPOS.map((t) => {
                    const Icon = t.icon;
                    const colors = COLOR_CLASSES[t.color];
                    const selected = form.tipo === t.value;
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, tipo: t.value })}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                          selected
                            ? `${colors.bg} ${colors.border} ring-2 ${colors.ring}`
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${selected ? colors.text : 'text-gray-400'}`} />
                        <span className={`text-xs font-medium ${selected ? colors.text : 'text-gray-600'}`}>
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titulo *</label>
                <input
                  type="text"
                  className="input-field w-full"
                  placeholder="Resumen breve de tu solicitud"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  required
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
                <textarea
                  className="input-field w-full resize-none"
                  rows={4}
                  placeholder="Describe con detalle tu peticion, queja, reclamo, sugerencia o felicitacion..."
                  value={form.mensaje}
                  onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
                  required
                  maxLength={2000}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.mensaje.length}/2000</p>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700 flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>Esta informacion es confidencial. Solo la direccion podra ver tu mensaje y responderte.</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button type="button" onClick={() => setModalCrear(false)} className="btn-secondary sm:flex-1">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !form.tipo}
                  className={`flex-1 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                    tipoSeleccionado ? COLOR_CLASSES[tipoSeleccionado.color].btnBg : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {enviando
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                  Enviar PQRS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle */}
      {modalDetalle && (() => {
        const tipoInfo = TIPO_MAP[modalDetalle.tipo] || TIPOS[0];
        const Icon = tipoInfo.icon;
        const colors = COLOR_CLASSES[tipoInfo.color];
        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{modalDetalle.titulo}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {tipoInfo.label}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_STYLES[modalDetalle.estado]}`}>
                        {ESTADO_LABELS[modalDetalle.estado]}
                      </span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setModalDetalle(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-0.5">Fecha</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(modalDetalle.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {esGestor && modalDetalle.solicitante && (
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-0.5">Solicitante</p>
                      <p className="font-semibold text-gray-900">{modalDetalle.solicitante.nombre}</p>
                    </div>
                  )}
                </div>

                {/* Mensaje */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mensaje</p>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap">
                    {modalDetalle.mensaje}
                  </div>
                </div>

                {/* Respuesta existente */}
                {modalDetalle.respuesta && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> Respuesta de la direccion
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800 whitespace-pre-wrap">
                      {modalDetalle.respuesta}
                    </div>
                  </div>
                )}

                {/* Acciones director */}
                {esGestor && !modalDetalle.respuesta && modalDetalle.estado !== 'CERRADA' && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <p className="text-xs font-medium text-gray-700">Responder al solicitante</p>
                    <textarea
                      className="input-field w-full resize-none"
                      rows={3}
                      placeholder="Escribe tu respuesta..."
                      value={respuestaTexto}
                      onChange={(e) => setRespuestaTexto(e.target.value)}
                      maxLength={2000}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => cambiarEstado(modalDetalle.id, 'EN_REVISION')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
                      >
                        <Clock className="w-3.5 h-3.5" /> Marcar en revision
                      </button>
                      <button
                        onClick={() => responder(modalDetalle.id)}
                        disabled={enviandoRespuesta || !respuestaTexto.trim()}
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors disabled:opacity-60"
                      >
                        {enviandoRespuesta
                          ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          : <Send className="w-3.5 h-3.5" />}
                        Enviar respuesta
                      </button>
                    </div>
                  </div>
                )}

                {/* Cerrar PQRS */}
                {esGestor && modalDetalle.respuesta && modalDetalle.estado !== 'CERRADA' && (
                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={() => cambiarEstado(modalDetalle.id, 'CERRADA')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition-colors"
                    >
                      <X className="w-4 h-4" /> Cerrar PQRS
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
