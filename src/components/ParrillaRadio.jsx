import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  FRANJAS_RADIO,
  DIAS_SEMANA,
  PROGRAMAS_FIJOS,
  obtenerReservasRadio,
  guardarReservasRadio,
} from '../data/mockData';
import {
  ChevronLeft,
  ChevronRight,
  Radio,
  Lock,
  CheckCircle2,
  Clock,
  X,
  Send,
  Calendar,
  Eye,
  Check,
  XCircle,
  User,
  Users,
  FileText,
  Minus,
  Plus,
} from 'lucide-react';

function obtenerLunesDeSemana(fecha) {
  const d = new Date(fecha);
  const dia = d.getDay();
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatearFechaSemana(lunes) {
  const viernes = new Date(lunes);
  viernes.setDate(viernes.getDate() + 4);
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${lunes.getDate()} - ${viernes.getDate()} de ${meses[lunes.getMonth()]} ${lunes.getFullYear()}`;
}

function obtenerFechasSemana(lunes) {
  return DIAS_SEMANA.map((dia, i) => {
    const fecha = new Date(lunes);
    fecha.setDate(fecha.getDate() + i);
    return { dia, fecha: fecha.getDate() };
  });
}

function obtenerFechaDia(lunes, diaIndex) {
  const fecha = new Date(lunes);
  fecha.setDate(fecha.getDate() + diaIndex);
  return fecha.toISOString().split('T')[0];
}

const INVITADO_VACIO = { nombre: '', perfil: '', contacto: '', cedula: '' };

export default function ParrillaRadio() {
  const { usuario, puedeGestionarSolicitudes } = useAuth();
  const [semanaActual, setSemanaActual] = useState(() => obtenerLunesDeSemana(new Date()));
  const [reservas, setReservas] = useState(() => obtenerReservasRadio());
  const [modalReserva, setModalReserva] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [vistaAdmin, setVistaAdmin] = useState(false);

  // Estado del formulario completo de radio
  const [formRadio, setFormRadio] = useState({
    nombre_programa: '',
    tema: '',
    duracion: '',
    conductor: { nombre: '', perfil: '', contacto: '' },
    invitados: [{ ...INVITADO_VACIO }],
    contenido: '',
  });

  const semanaKey = semanaActual.toISOString().split('T')[0];
  const fechasSemana = useMemo(() => obtenerFechasSemana(semanaActual), [semanaActual]);

  const esProgramaFijo = (dia, hora) => PROGRAMAS_FIJOS.find((p) => p.dia === dia && p.hora === hora);
  const obtenerReserva = (dia, hora) => reservas.find((r) => r.dia === dia && r.hora === hora && r.semana === semanaKey);
  const estaDisponible = (dia, hora) => !esProgramaFijo(dia, hora) && !obtenerReserva(dia, hora);

  const pendientes = reservas.filter((r) => r.estado === 'pendiente');

  const abrirModalReserva = (dia, hora) => {
    if (!estaDisponible(dia, hora)) return;
    setSlotSeleccionado({ dia, hora });
    setFormRadio({
      nombre_programa: '',
      tema: '',
      duracion: '',
      conductor: { nombre: usuario.nombre, perfil: '', contacto: '' },
      invitados: [{ ...INVITADO_VACIO }],
      contenido: '',
    });
    setReservaExitosa(false);
    setModalReserva(true);
  };

  const verDetalle = (reserva) => {
    setReservaDetalle(reserva);
    setModalDetalle(true);
  };

  const actualizarConductor = (campo, valor) => {
    setFormRadio((prev) => ({ ...prev, conductor: { ...prev.conductor, [campo]: valor } }));
  };

  const actualizarInvitado = (index, campo, valor) => {
    setFormRadio((prev) => {
      const nuevos = [...prev.invitados];
      nuevos[index] = { ...nuevos[index], [campo]: valor };
      return { ...prev, invitados: nuevos };
    });
  };

  const agregarInvitado = () => {
    if (formRadio.invitados.length >= 5) return;
    setFormRadio((prev) => ({ ...prev, invitados: [...prev.invitados, { ...INVITADO_VACIO }] }));
  };

  const quitarInvitado = (index) => {
    if (formRadio.invitados.length <= 1) return;
    setFormRadio((prev) => ({ ...prev, invitados: prev.invitados.filter((_, i) => i !== index) }));
  };

  const reservarEspacio = (e) => {
    e.preventDefault();
    if (!formRadio.nombre_programa.trim() || !slotSeleccionado) return;

    const diaIndex = DIAS_SEMANA.indexOf(slotSeleccionado.dia);
    const fechaDia = obtenerFechaDia(semanaActual, diaIndex);

    const nuevaReserva = {
      id: Date.now(),
      dia: slotSeleccionado.dia,
      hora: slotSeleccionado.hora,
      semana: semanaKey,
      solicitante: { id: usuario.id, nombre: usuario.nombre },
      estado: 'pendiente',
      formulario: {
        responsable: usuario.nombre,
        fecha: fechaDia,
        nombre_programa: formRadio.nombre_programa.trim(),
        tema: formRadio.tema.trim(),
        duracion: formRadio.duracion.trim(),
        conductor: { ...formRadio.conductor },
        invitados: formRadio.invitados.filter((inv) => inv.nombre.trim()),
        contenido: formRadio.contenido.trim(),
      },
    };

    const nuevas = [...reservas, nuevaReserva];
    setReservas(nuevas);
    guardarReservasRadio(nuevas);
    setReservaExitosa(true);
  };

  const aprobarReserva = (id) => {
    const actualizadas = reservas.map((r) => r.id === id ? { ...r, estado: 'aprobada' } : r);
    setReservas(actualizadas);
    guardarReservasRadio(actualizadas);
    setModalDetalle(false);
  };

  const rechazarReserva = (id) => {
    const actualizadas = reservas.filter((r) => r.id !== id);
    setReservas(actualizadas);
    guardarReservasRadio(actualizadas);
    setModalDetalle(false);
  };

  const semanaAnterior = () => {
    const nueva = new Date(semanaActual);
    nueva.setDate(nueva.getDate() - 7);
    setSemanaActual(nueva);
  };

  const semanaSiguiente = () => {
    const nueva = new Date(semanaActual);
    nueva.setDate(nueva.getDate() + 7);
    setSemanaActual(nueva);
  };

  const renderCelda = (dia, hora) => {
    const fijo = esProgramaFijo(dia, hora);
    const reserva = obtenerReserva(dia, hora);
    const disponible = estaDisponible(dia, hora);

    if (fijo) {
      return (
        <div className="h-full bg-blue-600 text-white rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center text-center">
          <Lock className="w-3 h-3 mb-0.5 opacity-75 hidden sm:block" />
          <span className="text-[10px] sm:text-xs font-semibold leading-tight">{fijo.programa}</span>
        </div>
      );
    }

    if (reserva) {
      const esMia = reserva.solicitante.id === usuario.id;
      return (
        <div
          onClick={() => (puedeGestionarSolicitudes() || esMia) ? verDetalle(reserva) : null}
          className={`h-full rounded-lg p-1.5 sm:p-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:opacity-80 ${
            reserva.estado === 'aprobada'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          <span className="text-[10px] sm:text-xs font-semibold leading-tight">
            {reserva.formulario?.nombre_programa || reserva.programa || 'Reserva'}
          </span>
          <span className="text-[9px] sm:text-[10px] opacity-75 mt-0.5 hidden sm:block">
            {esMia ? 'Tu reserva' : reserva.solicitante.nombre.split(' ')[0]}
          </span>
          {reserva.estado === 'pendiente' && (
            <span className="text-[9px] flex items-center gap-0.5 mt-0.5">
              <Clock className="w-2.5 h-2.5" /> Pendiente
            </span>
          )}
        </div>
      );
    }

    if (disponible) {
      return (
        <button
          onClick={() => abrirModalReserva(dia, hora)}
          className="h-full w-full rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center group"
        >
          <span className="text-[10px] sm:text-xs text-gray-400 group-hover:text-blue-500 font-medium">
            Disponible
          </span>
        </button>
      );
    }

    return <div className="h-full bg-gray-50 rounded-lg" />;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-6 h-6 text-red-500" />
            Parrilla de Radio IUDC
          </h1>
          <p className="text-gray-500 mt-1">
            {puedeGestionarSolicitudes()
              ? 'Gestiona y aprueba las reservas de la parrilla'
              : 'Selecciona un espacio disponible para agendar tu programa'}
          </p>
        </div>

        {puedeGestionarSolicitudes() && pendientes.length > 0 && (
          <button
            onClick={() => setVistaAdmin(!vistaAdmin)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              vistaAdmin ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-700 border border-amber-300'
            }`}
          >
            <Clock className="w-4 h-4" />
            {pendientes.length} reserva(s) pendiente(s)
          </button>
        )}
      </div>

      {/* Lista de pendientes para equipo/admin */}
      {puedeGestionarSolicitudes() && vistaAdmin && pendientes.length > 0 && (
        <div className="card border-l-4 border-l-amber-400">
          <h2 className="font-semibold text-gray-900 mb-4">Reservas pendientes de aprobación</h2>
          <div className="space-y-3">
            {pendientes.map((res) => (
              <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50 rounded-xl">
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {res.formulario?.nombre_programa || 'Sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {res.dia} {res.hora} · Semana del {res.semana} · {res.solicitante.nombre}
                  </p>
                  {res.formulario?.tema && (
                    <p className="text-xs text-gray-400 mt-0.5">Tema: {res.formulario.tema}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => verDetalle(res)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ver detalle
                  </button>
                  <button onClick={() => aprobarReserva(res.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button onClick={() => rechazarReserva(res.id)} className="bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navegación de semana */}
      <div className="card">
        <div className="flex items-center justify-between">
          <button onClick={semanaAnterior} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2 justify-center">
              <Calendar className="w-4 h-4 text-blue-500" />
              Semana del {formatearFechaSemana(semanaActual)}
            </p>
          </div>
          <button onClick={semanaSiguiente} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-600 rounded" />
          <span className="text-gray-600">Programa fijo (bloqueado)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-100 border border-emerald-300 rounded" />
          <span className="text-gray-600">Reserva aprobada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-100 border border-amber-300 rounded" />
          <span className="text-gray-600">Reserva pendiente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-dashed border-gray-300 rounded" />
          <span className="text-gray-600">Disponible</span>
        </div>
      </div>

      {/* Grilla de la parrilla */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 pr-3 w-24">
                Hora
              </th>
              {fechasSemana.map(({ dia, fecha }) => (
                <th key={dia} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 px-1">
                  <span className="block">{dia}</span>
                  <span className="text-lg font-bold text-gray-900">{fecha}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRANJAS_RADIO.map((hora) => (
              <tr key={hora}>
                <td className="py-1.5 pr-3">
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap">{hora}</span>
                </td>
                {DIAS_SEMANA.map((dia) => (
                  <td key={`${dia}-${hora}`} className="py-1.5 px-1">
                    <div className="h-14 sm:h-16">{renderCelda(dia, hora)}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de reserva (formulario completo) */}
      {modalReserva && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {!reservaExitosa ? (
              <form onSubmit={reservarEspacio}>
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Reservar espacio en Radio IUDC</h3>
                  <button type="button" onClick={() => setModalReserva(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                  {/* Info del slot */}
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Radio className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          {slotSeleccionado?.dia} - {slotSeleccionado?.hora}
                        </p>
                        <p className="text-xs text-blue-600">
                          Semana del {formatearFechaSemana(semanaActual)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Responsable (auto) */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Responsable</label>
                      <input type="text" value={usuario.nombre} disabled className="input-field bg-gray-50 text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Nombre del programa <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formRadio.nombre_programa}
                        onChange={(e) => setFormRadio((p) => ({ ...p, nombre_programa: e.target.value }))}
                        placeholder="Ejemplo: Arquitectura en Voz Alta"
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Tema <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formRadio.tema}
                        onChange={(e) => setFormRadio((p) => ({ ...p, tema: e.target.value }))}
                        placeholder="Tema del programa"
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Duración del programa (máximo 1 hora) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formRadio.duracion}
                        onChange={(e) => setFormRadio((p) => ({ ...p, duracion: e.target.value }))}
                        placeholder="Ejemplo: 45 minutos"
                        className="input-field"
                        required
                      />
                    </div>
                  </div>

                  {/* Conductor / Docente líder */}
                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-500" />
                      Conductor (Docente líder del programa)
                    </h4>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Nombre <span className="text-red-500">*</span></label>
                        <input type="text" value={formRadio.conductor.nombre} onChange={(e) => actualizarConductor('nombre', e.target.value)} className="input-field text-sm" required />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Perfil profesional <span className="text-red-500">*</span></label>
                        <input type="text" value={formRadio.conductor.perfil} onChange={(e) => actualizarConductor('perfil', e.target.value)} className="input-field text-sm" required placeholder="Ej: Ingeniero Civil, Magíster..." />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Contacto <span className="text-red-500">*</span></label>
                        <input type="text" value={formRadio.conductor.contacto} onChange={(e) => actualizarConductor('contacto', e.target.value)} className="input-field text-sm" required placeholder="Teléfono" />
                      </div>
                    </div>
                  </div>

                  {/* Invitados */}
                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        Invitados (máximo 5 personas)
                      </h4>
                      {formRadio.invitados.length < 5 && (
                        <button type="button" onClick={agregarInvitado} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                          <Plus className="w-3.5 h-3.5" /> Agregar invitado
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {formRadio.invitados.map((inv, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Invitado {i + 1}</span>
                            {formRadio.invitados.length > 1 && (
                              <button type="button" onClick={() => quitarInvitado(i)} className="text-red-400 hover:text-red-600">
                                <Minus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <input type="text" value={inv.nombre} onChange={(e) => actualizarInvitado(i, 'nombre', e.target.value)} className="input-field text-sm" placeholder="Nombre completo" />
                            <input type="text" value={inv.perfil} onChange={(e) => actualizarInvitado(i, 'perfil', e.target.value)} className="input-field text-sm" placeholder="Perfil profesional" />
                            <input type="text" value={inv.contacto} onChange={(e) => actualizarInvitado(i, 'contacto', e.target.value)} className="input-field text-sm" placeholder="Contacto" />
                            <input type="text" value={inv.cedula} onChange={(e) => actualizarInvitado(i, 'cedula', e.target.value)} className="input-field text-sm" placeholder="Cédula (personas externas)" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contenido del programa */}
                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      Contenido del programa
                    </h4>
                    <textarea
                      value={formRadio.contenido}
                      onChange={(e) => setFormRadio((p) => ({ ...p, contenido: e.target.value }))}
                      className="input-field min-h-[100px] resize-y"
                      placeholder="Describe el contenido y desarrollo del programa..."
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 p-6 border-t border-gray-100">
                  <button type="submit" className="btn-primary flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar solicitud de reserva
                  </button>
                  <button type="button" onClick={() => setModalReserva(false)} className="btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">¡Solicitud de reserva enviada!</h3>
                <p className="text-sm text-gray-500 mb-1">
                  Tu solicitud para <strong>{formRadio.nombre_programa}</strong> ha sido registrada.
                </p>
                <p className="text-xs text-gray-400 mb-5">
                  El equipo de comunicaciones revisará y aprobará tu solicitud.
                </p>
                <button onClick={() => setModalReserva(false)} className="btn-primary">
                  Entendido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de detalle de reserva (para equipo/admin) */}
      {modalDetalle && reservaDetalle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Detalle de la reserva</h3>
              <button onClick={() => setModalDetalle(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Estado */}
              <div className="flex items-center gap-3">
                <span className={`badge text-sm ${
                  reservaDetalle.estado === 'aprobada' ? 'badge-completada' : 'badge-pendiente'
                }`}>
                  {reservaDetalle.estado === 'aprobada' ? 'Aprobada' : 'Pendiente de aprobación'}
                </span>
              </div>

              {/* Info general */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Responsable</p>
                  <p className="font-medium text-gray-900 text-sm">{reservaDetalle.formulario?.responsable || reservaDetalle.solicitante.nombre}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Horario</p>
                  <p className="font-medium text-gray-900 text-sm">{reservaDetalle.dia} - {reservaDetalle.hora}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Nombre del programa</p>
                  <p className="font-medium text-gray-900 text-sm">{reservaDetalle.formulario?.nombre_programa || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Tema</p>
                  <p className="font-medium text-gray-900 text-sm">{reservaDetalle.formulario?.tema || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Fecha</p>
                  <p className="font-medium text-gray-900 text-sm">{reservaDetalle.formulario?.fecha || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Duración</p>
                  <p className="font-medium text-gray-900 text-sm">{reservaDetalle.formulario?.duracion || '—'}</p>
                </div>
              </div>

              {/* Conductor */}
              {reservaDetalle.formulario?.conductor && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" /> Conductor (Docente líder)
                  </h4>
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="grid sm:grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-blue-500">Nombre</p>
                        <p className="font-medium text-blue-900">{reservaDetalle.formulario.conductor.nombre}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-500">Perfil profesional</p>
                        <p className="font-medium text-blue-900">{reservaDetalle.formulario.conductor.perfil || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-500">Contacto</p>
                        <p className="font-medium text-blue-900">{reservaDetalle.formulario.conductor.contacto || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Invitados */}
              {reservaDetalle.formulario?.invitados?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" /> Invitados
                  </h4>
                  <div className="space-y-2">
                    {reservaDetalle.formulario.invitados.map((inv, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <div className="grid sm:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-xs text-gray-400">Nombre</p>
                            <p className="font-medium text-gray-900">{inv.nombre || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Perfil</p>
                            <p className="font-medium text-gray-900">{inv.perfil || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Contacto</p>
                            <p className="font-medium text-gray-900">{inv.contacto || '—'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Cédula</p>
                            <p className="font-medium text-gray-900">{inv.cedula || '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contenido */}
              {reservaDetalle.formulario?.contenido && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" /> Contenido del programa
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{reservaDetalle.formulario.contenido}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Acciones de aprobación (solo equipo/admin) */}
            {puedeGestionarSolicitudes() && reservaDetalle.estado === 'pendiente' && (
              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button onClick={() => aprobarReserva(reservaDetalle.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors">
                  <Check className="w-4 h-4" /> Aprobar reserva
                </button>
                <button onClick={() => rechazarReserva(reservaDetalle.id)} className="btn-danger flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
                <button onClick={() => setModalDetalle(false)} className="btn-secondary ml-auto">
                  Cerrar
                </button>
              </div>
            )}

            {(!puedeGestionarSolicitudes() || reservaDetalle.estado !== 'pendiente') && (
              <div className="flex gap-3 p-6 border-t border-gray-100">
                <button onClick={() => setModalDetalle(false)} className="btn-secondary">
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
