import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Brain, CheckCircle2, Clock, X, Send, Check, XCircle,
  ChevronLeft, ChevronRight, Calendar, Monitor,
} from 'lucide-react';

function obtenerLunesDeSemana(fecha) {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function obtenerFechaDia(lunes, diaIndex) {
  const fecha = new Date(lunes);
  fecha.setDate(fecha.getDate() + diaIndex);
  return fecha.toISOString().split('T')[0];
}

function formatearSemana(lunes) {
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  const jue = new Date(lunes);
  jue.setDate(jue.getDate() + 3);
  return `${lunes.getDate()} ${meses[lunes.getMonth()]} — ${jue.getDate()} ${meses[jue.getMonth()]} ${jue.getFullYear()}`;
}

const FORM_VACIO = { nombre_docente: '', nombre_proyecto: '', descripcion: '', contacto: '' };
const DIA_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves'];
const HOY = new Date().toISOString().split('T')[0];

function esDiaPasado(fechaDia) {
  return fechaDia < HOY;
}

// Franjas fijas: 9:30 a.m. — 1:00 p.m.
const FRANJAS_FIJAS = [
  '9:30 a.m.', '10:00 a.m.', '10:30 a.m.', '11:00 a.m.',
  '11:30 a.m.', '12:00 p.m.', '12:30 p.m.', '1:00 p.m.',
];

export default function ValleIA() {
  const { puedeGestionarSolicitudes } = useAuth();
  const [semanaActual, setSemanaActual] = useState(() => obtenerLunesDeSemana(new Date()));
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [modalReserva, setModalReserva] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);

  const semanaKey = semanaActual.toISOString().split('T')[0];

  const cargarReservas = useCallback(async () => {
    try {
      const res = await api.get(`/valle-ia/reservas?semana=${semanaKey}`);
      setReservas(Array.isArray(res) ? res : []);
    } catch (e) { console.error(e); }
  }, [semanaKey]);

  useEffect(() => {
    const cargar = async () => {
      try {
        await cargarReservas();
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    cargar();
  }, [semanaKey]);

  const getReserva = (fechaDia, hora) =>
    reservas.find((r) => r.dia === fechaDia && r.hora === hora && r.estado !== 'RECHAZADA');

  const abrirSlot = (diaIndex, hora) => {
    const fechaDia = obtenerFechaDia(semanaActual, diaIndex);
    const existente = getReserva(fechaDia, hora);
    if (existente) {
      setReservaDetalle(existente);
      setModalDetalle(true);
    } else {
      setSlotSeleccionado({ dia: fechaDia, diaLabel: DIA_LABELS[diaIndex], hora });
      setForm(FORM_VACIO);
      setModalReserva(true);
    }
  };

  const enviarReserva = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      await api.post('/valle-ia/reservas', {
        dia: slotSeleccionado.dia,
        hora: slotSeleccionado.hora,
        semana: semanaKey,
        formulario: form,
      });
      await cargarReservas();
      setModalReserva(false);
      setReservaExitosa(true);
      setTimeout(() => setReservaExitosa(false), 5000);
    } catch (err) {
      alert(err.data?.error || 'Error al crear la reserva');
    } finally {
      setEnviando(false);
    }
  };

  const cambiarEstado = async (id, estado) => {
    try {
      await api.patch(`/valle-ia/reservas/${id}/estado`, { estado });
      await cargarReservas();
      setModalDetalle(false);
    } catch (err) {
      alert(err.data?.error || 'Error al actualizar');
    }
  };

  const semanaAnterior = () => {
    const d = new Date(semanaActual); d.setDate(d.getDate() - 7); setSemanaActual(d);
  };
  const semanaSiguiente = () => {
    const d = new Date(semanaActual); d.setDate(d.getDate() + 7); setSemanaActual(d);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  // Día activo (por defecto el primero disponible)
  const diaActivo = diaSeleccionado ?? 0;
  const fechaDiaActivo = obtenerFechaDia(semanaActual, diaActivo);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Valle del Software · IA</h1>
          </div>
          <p className="text-gray-500 text-sm">
            Agenda un equipo para trabajar con IA · Horario: <span className="font-semibold text-purple-600">9:30 a.m. — 1:00 p.m.</span> · Lunes a Jueves
          </p>
        </div>
      </div>

      {/* Notificación éxito */}
      {reservaExitosa && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="text-green-800 font-semibold text-sm">¡Equipo agendado exitosamente!</p>
            <p className="text-green-700 text-xs mt-0.5">Tu solicitud está pendiente de confirmación por el equipo.</p>
          </div>
        </div>
      )}

      {/* Navegación de semana */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
          <button onClick={semanaAnterior} className="p-2 hover:bg-white rounded-xl transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <Calendar className="w-4 h-4 text-purple-500" />
            {formatearSemana(semanaActual)}
          </div>
          <button onClick={semanaSiguiente} className="p-2 hover:bg-white rounded-xl transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Selector de día */}
        <div className="grid grid-cols-4 gap-0 border-b border-gray-100">
          {DIA_LABELS.map((dia, i) => {
            const fecha = obtenerFechaDia(semanaActual, i);
            const reservasDia = reservas.filter((r) => r.dia === fecha && r.estado !== 'RECHAZADA').length;
            const isHoy = fecha === new Date().toISOString().split('T')[0];
            return (
              <button
                key={dia}
                onClick={() => setDiaSeleccionado(i)}
                className={`flex flex-col items-center gap-1 py-4 px-2 transition-colors border-r last:border-r-0 border-gray-100 ${
                  diaActivo === i
                    ? 'bg-purple-600 text-white'
                    : 'hover:bg-purple-50 text-gray-700'
                }`}
              >
                <span className={`text-xs font-medium uppercase tracking-wide ${diaActivo === i ? 'text-purple-200' : 'text-gray-400'}`}>
                  {dia.slice(0, 3)}
                </span>
                <span className={`text-lg font-bold leading-none ${isHoy && diaActivo !== i ? 'text-purple-600' : ''}`}>
                  {fecha.slice(8)}
                </span>
                {reservasDia > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    diaActivo === i ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {reservasDia} {reservasDia === 1 ? 'reserva' : 'reservas'}
                  </span>
                )}
                {isHoy && (
                  <span className={`text-[10px] font-semibold ${diaActivo === i ? 'text-purple-200' : 'text-purple-500'}`}>hoy</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Slots del día seleccionado */}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-semibold text-gray-700">
              {DIA_LABELS[diaActivo]} · {fechaDiaActivo.slice(8)}/{fechaDiaActivo.slice(5,7)}
            </span>
            <span className="text-xs text-gray-400">— Selecciona un horario para agendar un equipo</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FRANJAS_FIJAS.map((hora) => {
              const reserva = getReserva(fechaDiaActivo, hora);
              const esAprobada = reserva?.estado === 'APROBADA';
              const esPendiente = reserva?.estado === 'PENDIENTE';

              return (
                <button
                  key={hora}
                  onClick={() => abrirSlot(diaActivo, hora)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 text-center group ${
                    esAprobada
                      ? 'bg-green-50 border-green-300 cursor-pointer'
                      : esPendiente
                        ? 'bg-amber-50 border-amber-300 cursor-pointer'
                        : 'bg-white border-gray-200 hover:border-purple-400 hover:bg-purple-50 cursor-pointer hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {esAprobada
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : esPendiente
                        ? <Clock className="w-4 h-4 text-amber-500" />
                        : <Clock className="w-4 h-4 text-gray-300 group-hover:text-purple-400 transition-colors" />
                    }
                    <span className={`text-sm font-bold ${
                      esAprobada ? 'text-green-700' : esPendiente ? 'text-amber-700' : 'text-gray-800'
                    }`}>
                      {hora}
                    </span>
                  </div>

                  {reserva ? (
                    <>
                      <span className={`text-[11px] font-semibold leading-tight ${
                        esAprobada ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {reserva.formulario?.nombre_docente || 'Reservado'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        esAprobada ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {esAprobada ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-gray-400 group-hover:text-purple-500 transition-colors font-medium">
                      Disponible
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-4 mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-gray-200 bg-white" /><span>Disponible — clic para agendar</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-amber-300 bg-amber-50" /><span>Pendiente de confirmación</span></div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-green-300 bg-green-50" /><span>Confirmado</span></div>
          </div>
        </div>
      </div>

      {/* Modal: Nueva reserva */}
      {modalReserva && slotSeleccionado && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-t-2xl p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">Agendar equipo · IA</h3>
                  <p className="text-purple-200 text-sm mt-0.5">
                    {slotSeleccionado.diaLabel} {slotSeleccionado.dia.slice(8)}/{slotSeleccionado.dia.slice(5,7)} · {slotSeleccionado.hora}
                  </p>
                </div>
                <button onClick={() => setModalReserva(false)} className="p-2 hover:bg-white/20 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={enviarReserva} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del docente *</label>
                <input type="text" className="input-field w-full" placeholder="Tu nombre completo"
                  value={form.nombre_docente} onChange={(e) => setForm({ ...form, nombre_docente: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proyecto / programa *</label>
                <input type="text" className="input-field w-full" placeholder="¿En qué proyecto trabajarás con IA?"
                  value={form.nombre_proyecto} onChange={(e) => setForm({ ...form, nombre_proyecto: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción breve</label>
                <textarea className="input-field w-full resize-none" rows={2}
                  placeholder="¿Qué necesitas hacer o aprender?"
                  value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contacto (email / ext.)</label>
                <input type="text" className="input-field w-full" placeholder="email@iudc.edu.co"
                  value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} />
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-xs text-purple-700 flex items-start gap-2">
                <Brain className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>El equipo del Valle del Software confirmará tu reserva. Recibirás la respuesta por el canal de comunicaciones.</span>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModalReserva(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={enviando}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
                  {enviando ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  Agendar equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle */}
      {modalDetalle && reservaDetalle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Detalle del agendamiento</h3>
              <button onClick={() => setModalDetalle(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Día</p>
                  <p className="font-semibold text-gray-900">{reservaDetalle.dia}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Hora</p>
                  <p className="font-semibold text-gray-900">{reservaDetalle.hora}</p>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                {[
                  ['Docente', reservaDetalle.formulario?.nombre_docente],
                  ['Proyecto', reservaDetalle.formulario?.nombre_proyecto],
                  ['Descripción', reservaDetalle.formulario?.descripcion],
                  ['Contacto', reservaDetalle.formulario?.contacto],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  reservaDetalle.estado === 'APROBADA' ? 'bg-green-100 text-green-700'
                  : reservaDetalle.estado === 'RECHAZADA' ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
                }`}>
                  {reservaDetalle.estado === 'APROBADA' ? 'Confirmado' : reservaDetalle.estado === 'RECHAZADA' ? 'Rechazado' : 'Pendiente'}
                </span>
                <span className="text-xs text-gray-400">Solicitado por {reservaDetalle.solicitante?.nombre}</span>
              </div>
              {puedeGestionarSolicitudes() && reservaDetalle.estado === 'PENDIENTE' && (
                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button onClick={() => cambiarEstado(reservaDetalle.id, 'RECHAZADA')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium transition-colors">
                    <XCircle className="w-4 h-4" /> Rechazar
                  </button>
                  <button onClick={() => cambiarEstado(reservaDetalle.id, 'APROBADA')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors">
                    <Check className="w-4 h-4" /> Confirmar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
