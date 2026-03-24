import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  ChevronLeft, ChevronRight, Radio, Lock, CheckCircle2, Clock,
  X, Send, Calendar, Eye, Check, XCircle, User, Users, FileText,
  Minus, Plus, Download, MessageSquare, AlertCircle,
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
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  return `${lunes.getDate()} - ${viernes.getDate()} de ${meses[lunes.getMonth()]} ${lunes.getFullYear()}`;
}

function obtenerFechaDia(lunes, diaIndex) {
  const fecha = new Date(lunes);
  fecha.setDate(fecha.getDate() + diaIndex);
  return fecha.toISOString().split('T')[0];
}

function parsearHora12a24(horaTexto) {
  const normalizada = horaTexto.toLowerCase().replace(/\s+/g, '');
  const match = normalizada.match(/^(\d{1,2}):(\d{2})(a\.?m\.?|p\.?m\.?)$/);
  if (!match) return null;
  let horas = Number(match[1]);
  const minutos = Number(match[2]);
  const periodo = match[3];
  if (periodo.startsWith('p') && horas !== 12) horas += 12;
  if (periodo.startsWith('a') && horas === 12) horas = 0;
  return { horas, minutos };
}

const INVITADO_VACIO = { nombre: '', perfil: '', contacto: '', cedula: '' };

export default function ParrillaRadio() {
  const { usuario, puedeGestionarSolicitudes } = useAuth();
  const [semanaActual, setSemanaActual] = useState(() => obtenerLunesDeSemana(new Date()));
  const [reservas, setReservas] = useState([]);
  const [modalReserva, setModalReserva] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [modalRechazo, setModalRechazo] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [reservaDetalle, setReservaDetalle] = useState(null);
  const [reservaARechazo, setReservaARechazo] = useState(null);
  const [modalFijo, setModalFijo] = useState(null);
  const [comentarioRechazo, setComentarioRechazo] = useState('');
  const [rechazandoId, setRechazandoId] = useState(null);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [vistaAdmin, setVistaAdmin] = useState(false);
  const [FRANJAS_RADIO, setFranjasRadio] = useState([]);
  const [DIAS_SEMANA, setDiasSemana] = useState([]);
  const [PROGRAMAS_FIJOS, setProgramasFijos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formRadio, setFormRadio] = useState({
    nombre_programa: '',
    tema: '',
    duracion: '',
    conductor: { nombre: '', perfil: '', contacto: '' },
    invitados: [{ ...INVITADO_VACIO }],
    contenido: '',
  });

  const semanaKey = semanaActual.toISOString().split('T')[0];

  const fechasSemana = useMemo(() => {
    return DIAS_SEMANA.map((dia, i) => {
      const fecha = new Date(semanaActual);
      fecha.setDate(fecha.getDate() + i);
      return { dia, fecha: fecha.getDate() };
    });
  }, [semanaActual, DIAS_SEMANA]);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [configRes, programasRes] = await Promise.all([
          api.get('/radio/config'),
          api.get('/radio/programas-fijos'),
        ]);
        setFranjasRadio(configRes.franjas || []);
        setDiasSemana(configRes.dias || []);
        setProgramasFijos(Array.isArray(programasRes) ? programasRes : []);
      } catch (error) {
        console.error('Error fetching radio config:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!semanaActual) return;
    const fetchReservas = async () => {
      try {
        const res = await api.get(`/radio/reservas?semana=${semanaKey}`);
        const data = Array.isArray(res) ? res : res.reservas || [];
        setReservas(data.map(r => ({ ...r, estado: r.estado?.toLowerCase() })));
      } catch (error) {
        console.error('Error fetching reservas:', error);
      }
    };
    fetchReservas();
  }, [semanaActual, semanaKey]);

  const esProgramaFijo = (dia, hora) => PROGRAMAS_FIJOS.find((p) => p.dia === dia && p.hora === hora);
  const obtenerReserva = (dia, hora) => reservas.find((r) => r.dia === dia && r.hora === hora && r.semana === semanaKey);
  const esPasado = (dia, hora) => {
    const diaIndex = DIAS_SEMANA.indexOf(dia);
    if (diaIndex < 0) return false;
    const horaParseada = parsearHora12a24(hora);
    if (!horaParseada) return false;
    const fechaDia = obtenerFechaDia(semanaActual, diaIndex);
    const fechaSlot = new Date(`${fechaDia}T00:00:00`);
    fechaSlot.setHours(horaParseada.horas, horaParseada.minutos, 0, 0);
    return fechaSlot < new Date();
  };
  const estaDisponible = (dia, hora) => {
    const reserva = obtenerReserva(dia, hora);
    return !esPasado(dia, hora) && !esProgramaFijo(dia, hora) && (!reserva || reserva.estado === 'rechazada');
  };

  // Returns true if the given slot is happening right now (within the 30-min window)
  const esEnVivo = (dia, hora) => {
    const diaIndex = DIAS_SEMANA.indexOf(dia);
    if (diaIndex < 0) return false;
    const horaParseada = parsearHora12a24(hora);
    if (!horaParseada) return false;
    const fechaDia = obtenerFechaDia(semanaActual, diaIndex);
    const inicio = new Date(`${fechaDia}T00:00:00`);
    inicio.setHours(horaParseada.horas, horaParseada.minutos, 0, 0);
    const fin = new Date(inicio.getTime() + 30 * 60 * 1000); // slot of 30 minutes
    const ahora = new Date();
    return ahora >= inicio && ahora < fin;
  };

  const pendientes = reservas.filter((r) => r.estado === 'pendiente');

  // Find any live program right now (aprobada or fijo) in the current week
  const programaEnVivoAhora = (() => {
    for (const dia of DIAS_SEMANA) {
      for (const hora of FRANJAS_RADIO) {
        if (!esEnVivo(dia, hora)) continue;
        const fijo = esProgramaFijo(dia, hora);
        if (fijo) return { nombre: fijo.programa, dia, hora, tipo: 'fijo' };
        const res = obtenerReserva(dia, hora);
        if (res && res.estado === 'aprobada') return { nombre: res.formulario?.nombre_programa, dia, hora, tipo: 'reserva' };
      }
    }
    return null;
  })();

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

  const reservarEspacio = async (e) => {
    e.preventDefault();
    if (!formRadio.nombre_programa.trim() || !slotSeleccionado) return;
    try {
      const diaIndex = DIAS_SEMANA.indexOf(slotSeleccionado.dia);
      const fechaDia = obtenerFechaDia(semanaActual, diaIndex);
      const nuevaReserva = await api.post('/radio/reservas', {
        dia: slotSeleccionado.dia,
        hora: slotSeleccionado.hora,
        semana: semanaKey,
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
      });
      setReservas((prev) => [...prev, { ...nuevaReserva, estado: 'pendiente' }]);
      setReservaExitosa(true);
    } catch (error) {
      alert(error.data?.error || 'Error al reservar espacio');
    }
  };

  const aprobarReserva = async (id) => {
    try {
      await api.patch(`/radio/reservas/${id}/aprobar`);
      setReservas((prev) => prev.map((r) => r.id === id ? { ...r, estado: 'aprobada' } : r));
      setModalDetalle(false);
    } catch (error) {
      alert(error.data?.error || 'Error al aprobar');
    }
  };

  // Opens the rejection comment modal
  const iniciarRechazo = (reserva) => {
    setReservaARechazo(reserva);
    setComentarioRechazo('');
    setModalDetalle(false);
    setModalRechazo(true);
  };

  const confirmarRechazo = async () => {
    if (!comentarioRechazo.trim() || comentarioRechazo.trim().length < 5) return;
    setRechazandoId(reservaARechazo.id);
    try {
      const updated = await api.patch(`/radio/reservas/${reservaARechazo.id}/rechazar`, {
        comentario: comentarioRechazo.trim(),
      });
      setReservas((prev) =>
        prev.map((r) => r.id === reservaARechazo.id
          ? { ...r, estado: 'rechazada', comentario: updated.comentario, gestionadoPor: updated.gestionadoPor }
          : r
        )
      );
      setModalRechazo(false);
      setReservaARechazo(null);
    } catch (error) {
      alert(error.data?.error || 'Error al rechazar');
    } finally {
      setRechazandoId(null);
    }
  };

  const exportarNovedades = () => {
    const url = `/api/radio/reservas/novedades/csv?semana=${semanaKey}`;
    window.open(url, '_blank');
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
    const slotPasado = esPasado(dia, hora);

    const enVivo = esEnVivo(dia, hora);

    if (fijo) {
      return (
        <div
          onClick={() => setModalFijo(fijo)}
          className="h-full bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center text-center px-1 py-2 relative overflow-hidden cursor-pointer hover:bg-blue-700 transition-colors"
        >
          {enVivo && (
            <span className="absolute top-1 right-1 flex items-center gap-0.5 bg-red-500 text-white text-[7px] font-black px-1 py-0.5 rounded-full animate-pulse">
              ● EN VIVO
            </span>
          )}
          <Lock className="w-3 h-3 mb-0.5 opacity-60" />
          <span className="text-[10px] font-semibold leading-tight">{fijo.programa}</span>
        </div>
      );
    }

    if (reserva && reserva.estado === 'rechazada') {
      return (
        <div
          onClick={() => (puedeGestionarSolicitudes() || reserva.solicitante?.id === usuario?.id) ? verDetalle(reserva) : null}
          className="h-full bg-red-50 border border-red-200 rounded-xl flex flex-col items-center justify-center text-center px-1 py-2 cursor-pointer hover:bg-red-100 transition-colors"
        >
          <XCircle className="w-3 h-3 text-red-400 mb-0.5" />
          <span className="text-[9px] font-medium text-red-600 leading-tight">Rechazada</span>
          {reserva.comentario && (
            <span className="text-[8px] text-red-400 mt-0.5 line-clamp-2 leading-tight px-0.5">
              {reserva.comentario}
            </span>
          )}
        </div>
      );
    }

    if (reserva) {
      const esMia = reserva.solicitante?.id === usuario?.id;
      const aprobadaPasada = reserva.estado === 'aprobada' && slotPasado;
      const aprobadaFutura = reserva.estado === 'aprobada' && !slotPasado;

      const cellClass = aprobadaPasada
        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200'
        : aprobadaFutura
          ? 'bg-blue-500 text-white hover:bg-blue-600'
          : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-200';

      return (
        <div
          onClick={() => (puedeGestionarSolicitudes() || esMia) ? verDetalle(reserva) : null}
          className={`h-full rounded-xl flex flex-col items-center justify-center text-center px-1 py-2 cursor-pointer transition-colors relative overflow-hidden ${cellClass}`}
        >
          {enVivo && reserva.estado === 'aprobada' && (
            <span className="absolute top-1 right-1 flex items-center gap-0.5 bg-red-500 text-white text-[7px] font-black px-1 py-0.5 rounded-full animate-pulse">
              ● EN VIVO
            </span>
          )}
          <span className="text-[10px] font-semibold leading-tight">
            {reserva.formulario?.nombre_programa || 'Reserva'}
          </span>
          <span className="text-[9px] opacity-80 mt-0.5">
            {aprobadaPasada ? 'Finalizado' : esMia ? 'Mi reserva' : reserva.solicitante?.nombre?.split(' ')[0]}
          </span>
          {reserva.estado === 'pendiente' && (
            <span className="text-[8px] flex items-center gap-0.5 mt-0.5 opacity-70">
              <Clock className="w-2 h-2" /> Pendiente
            </span>
          )}
        </div>
      );
    }

    if (slotPasado) {
      return (
        <div className="h-full bg-gray-100 rounded-xl flex items-center justify-center">
          <span className="text-[10px] text-gray-400">No disponible</span>
        </div>
      );
    }

    return (
      <button
        onClick={() => abrirModalReserva(dia, hora)}
        className="h-full w-full rounded-xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center group"
      >
        <span className="text-[10px] text-gray-400 group-hover:text-blue-500 font-medium">Disponible</span>
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto px-4 sm:px-6">

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 shrink-0" />
            Parrilla de Radio IUDC
          </h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {puedeGestionarSolicitudes()
              ? 'Gestiona y aprueba las reservas de la parrilla'
              : 'Selecciona un espacio disponible para agendar tu programa'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
          {puedeGestionarSolicitudes() && pendientes.length > 0 && (
            <button
              onClick={() => setVistaAdmin(!vistaAdmin)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                vistaAdmin ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              {pendientes.length} pendiente(s)
            </button>
          )}
          {puedeGestionarSolicitudes() && (
            <button
              onClick={exportarNovedades}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar novedades CSV</span>
              <span className="sm:hidden">CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Radio en Vivo */}
      {programaEnVivoAhora && (
        <div className="bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg">
          <div className="relative shrink-0">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full animate-ping opacity-75" />
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-black text-sm uppercase tracking-wide">● RADIO EN VIVO</span>
              <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">AHORA</span>
            </div>
            <p className="text-white/90 text-sm font-medium truncate mt-0.5">{programaEnVivoAhora.nombre}</p>
            <p className="text-white/60 text-xs">{programaEnVivoAhora.dia} · {programaEnVivoAhora.hora}</p>
          </div>
          <span className="shrink-0 bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl animate-pulse border border-white/30">
            EN ANTENA
          </span>
        </div>
      )}

      {/* Lista de pendientes */}
      {puedeGestionarSolicitudes() && vistaAdmin && pendientes.length > 0 && (
        <div className="card border-l-4 border-l-amber-400">
          <h2 className="font-semibold text-gray-900 mb-3 text-sm">Reservas pendientes de aprobación</h2>
          <div className="space-y-2">
            {pendientes.map((res) => (
              <div key={res.id} className="flex flex-col gap-3 p-3.5 bg-amber-50 rounded-xl sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{res.formulario?.nombre_programa || 'Sin nombre'}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{res.dia} {res.hora} · {res.semana} · {res.solicitante?.nombre}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => verDetalle(res)} className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button onClick={() => aprobarReserva(res.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button onClick={() => iniciarRechazo(res)} className="bg-red-500 hover:bg-red-600 text-white text-xs py-1.5 px-3 rounded-xl flex items-center gap-1 transition-colors">
                    <XCircle className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navegación semana */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
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

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3 text-xs">
        {[
          { color: 'bg-blue-600', label: 'Programa fijo' },
          { color: 'bg-blue-500', label: 'Aprobada' },
          { color: 'bg-amber-100 border border-amber-200', label: 'Pendiente' },
          { color: 'bg-red-50 border border-red-200', label: 'Rechazada' },
          { color: 'border-2 border-dashed border-gray-300', label: 'Disponible' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded ${color}`} />
            <span className="text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      {/* Grilla */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="w-24 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider px-4 py-3">
                Hora
              </th>
              {fechasSemana.map(({ dia, fecha }) => (
                <th key={dia} className="text-center px-1 py-3">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{dia}</span>
                  <span className="text-lg font-black text-gray-800">{fecha}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FRANJAS_RADIO.map((hora, idx) => (
              <tr key={hora} className={idx % 2 === 0 ? 'bg-gray-50/40' : ''}>
                <td className="px-4 py-1.5">
                  <span className="text-xs font-medium text-gray-500 whitespace-nowrap">{hora}</span>
                </td>
                {DIAS_SEMANA.map((dia) => (
                  <td key={`${dia}-${hora}`} className="px-1 py-1.5">
                    <div className="h-16">{renderCelda(dia, hora)}</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Modal de reserva ───────────────────────────── */}
      {modalReserva && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {!reservaExitosa ? (
              <form onSubmit={reservarEspacio}>
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Reservar espacio en Radio IUDC</h3>
                  <button type="button" onClick={() => setModalReserva(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
                <div className="p-4 sm:p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                  <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                    <Radio className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-blue-900">{slotSeleccionado?.dia} — {slotSeleccionado?.hora}</p>
                      <p className="text-xs text-blue-600">Semana del {formatearFechaSemana(semanaActual)}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Responsable</label>
                      <input type="text" value={usuario.nombre} disabled className="input-field bg-gray-50 text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre del programa <span className="text-red-500">*</span></label>
                      <input type="text" value={formRadio.nombre_programa} onChange={(e) => setFormRadio((p) => ({ ...p, nombre_programa: e.target.value }))} className="input-field" required placeholder="Ej: Arquitectura en Voz Alta" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Tema <span className="text-red-500">*</span></label>
                      <input type="text" value={formRadio.tema} onChange={(e) => setFormRadio((p) => ({ ...p, tema: e.target.value }))} className="input-field" required placeholder="Tema del programa" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración (máx. 1 hora) <span className="text-red-500">*</span></label>
                      <input type="text" value={formRadio.duracion} onChange={(e) => setFormRadio((p) => ({ ...p, duracion: e.target.value }))} className="input-field" required placeholder="Ej: 45 minutos" />
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Conductor (Docente líder)</h4>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div><label className="block text-xs text-gray-500 mb-1">Nombre <span className="text-red-500">*</span></label><input type="text" value={formRadio.conductor.nombre} onChange={(e) => actualizarConductor('nombre', e.target.value)} className="input-field text-sm" required /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Perfil profesional <span className="text-red-500">*</span></label><input type="text" value={formRadio.conductor.perfil} onChange={(e) => actualizarConductor('perfil', e.target.value)} className="input-field text-sm" required placeholder="Ej: Ingeniero Civil" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">Contacto <span className="text-red-500">*</span></label><input type="text" value={formRadio.conductor.contacto} onChange={(e) => actualizarConductor('contacto', e.target.value)} className="input-field text-sm" required placeholder="Teléfono" /></div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Invitados (máx. 5)</h4>
                      {formRadio.invitados.length < 5 && (
                        <button type="button" onClick={agregarInvitado} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Agregar</button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {formRadio.invitados.map((inv, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Invitado {i + 1}</span>
                            {formRadio.invitados.length > 1 && <button type="button" onClick={() => quitarInvitado(i)} className="text-red-400 hover:text-red-600"><Minus className="w-4 h-4" /></button>}
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2">
                            <input type="text" value={inv.nombre} onChange={(e) => actualizarInvitado(i, 'nombre', e.target.value)} className="input-field text-sm" placeholder="Nombre completo" />
                            <input type="text" value={inv.perfil} onChange={(e) => actualizarInvitado(i, 'perfil', e.target.value)} className="input-field text-sm" placeholder="Perfil profesional" />
                            <input type="text" value={inv.contacto} onChange={(e) => actualizarInvitado(i, 'contacto', e.target.value)} className="input-field text-sm" placeholder="Contacto" />
                            <input type="text" value={inv.cedula} onChange={(e) => actualizarInvitado(i, 'cedula', e.target.value)} className="input-field text-sm" placeholder="Cédula (externos)" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Contenido del programa</h4>
                    <textarea value={formRadio.contenido} onChange={(e) => setFormRadio((p) => ({ ...p, contenido: e.target.value }))} className="input-field min-h-[100px] resize-y" placeholder="Describe el contenido y desarrollo..." required />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-6 border-t border-gray-100">
                  <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Enviar solicitud</button>
                  <button type="button" onClick={() => setModalReserva(false)} className="btn-secondary">Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="p-8 text-center">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">¡Solicitud enviada!</h3>
                <p className="text-sm text-gray-500 mb-5">Tu solicitud para <strong>{formRadio.nombre_programa}</strong> fue registrada y será revisada por el equipo.</p>
                <button onClick={() => setModalReserva(false)} className="btn-primary">Entendido</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal de detalle ───────────────────────────── */}
      {modalDetalle && reservaDetalle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">Detalle de reserva</h3>
              <button onClick={() => setModalDetalle(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`badge text-sm ${
                  reservaDetalle.estado === 'aprobada' ? 'badge-completada' :
                  reservaDetalle.estado === 'rechazada' ? 'badge-rechazada' : 'badge-pendiente'
                }`}>
                  {reservaDetalle.estado === 'aprobada' ? 'Aprobada' : reservaDetalle.estado === 'rechazada' ? 'Rechazada' : 'Pendiente'}
                </span>
              </div>

              {/* Motivo rechazo */}
              {reservaDetalle.estado === 'rechazada' && reservaDetalle.comentario && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-800 mb-1">Motivo del rechazo</p>
                    <p className="text-sm text-red-700">{reservaDetalle.comentario}</p>
                    {reservaDetalle.gestionadoPor && (
                      <p className="text-xs text-red-400 mt-1">Gestionado por: {reservaDetalle.gestionadoPor}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { label: 'Responsable', val: reservaDetalle.formulario?.responsable || reservaDetalle.solicitante?.nombre },
                  { label: 'Horario', val: `${reservaDetalle.dia} — ${reservaDetalle.hora}` },
                  { label: 'Programa', val: reservaDetalle.formulario?.nombre_programa },
                  { label: 'Tema', val: reservaDetalle.formulario?.tema },
                  { label: 'Fecha', val: reservaDetalle.formulario?.fecha },
                  { label: 'Duración', val: reservaDetalle.formulario?.duracion },
                ].map(({ label, val }) => val ? (
                  <div key={label} className="bg-gray-50 rounded-xl p-3.5">
                    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                    <p className="text-sm font-medium text-gray-900">{val}</p>
                  </div>
                ) : null)}
              </div>

              {reservaDetalle.formulario?.conductor && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2"><User className="w-4 h-4 text-blue-500" /> Conductor</h4>
                  <div className="bg-blue-50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-blue-400">Nombre</p><p className="font-medium text-blue-900">{reservaDetalle.formulario.conductor.nombre}</p></div>
                    <div><p className="text-xs text-blue-400">Perfil</p><p className="font-medium text-blue-900">{reservaDetalle.formulario.conductor.perfil || '—'}</p></div>
                    <div><p className="text-xs text-blue-400">Contacto</p><p className="font-medium text-blue-900">{reservaDetalle.formulario.conductor.contacto || '—'}</p></div>
                  </div>
                </div>
              )}

              {reservaDetalle.formulario?.invitados?.filter(i => i.nombre)?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Invitados</h4>
                  <div className="space-y-2">
                    {reservaDetalle.formulario.invitados.filter(i => i.nombre).map((inv, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                        <div><p className="text-xs text-gray-400">Nombre</p><p className="font-medium">{inv.nombre}</p></div>
                        <div><p className="text-xs text-gray-400">Perfil</p><p className="font-medium">{inv.perfil || '—'}</p></div>
                        <div><p className="text-xs text-gray-400">Contacto</p><p className="font-medium">{inv.contacto || '—'}</p></div>
                        <div><p className="text-xs text-gray-400">Cédula</p><p className="font-medium">{inv.cedula || '—'}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {reservaDetalle.formulario?.contenido && (
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Contenido</h4>
                  <div className="bg-gray-50 rounded-xl p-4"><p className="text-sm text-gray-700 whitespace-pre-wrap">{reservaDetalle.formulario.contenido}</p></div>
                </div>
              )}
            </div>

            {/* Acciones para PENDIENTE */}
            {puedeGestionarSolicitudes() && reservaDetalle.estado === 'pendiente' && (
              <div className="flex flex-wrap gap-3 p-4 sm:p-6 border-t border-gray-100">
                <button onClick={() => aprobarReserva(reservaDetalle.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors">
                  <Check className="w-4 h-4" /> Aprobar
                </button>
                <button onClick={() => iniciarRechazo(reservaDetalle)} className="btn-danger flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Rechazar
                </button>
                <button onClick={() => setModalDetalle(false)} className="btn-secondary sm:ml-auto">Cerrar</button>
              </div>
            )}
            {/* Cancelar reserva APROBADA — solo equipo/admin, solo si no ha pasado */}
            {puedeGestionarSolicitudes() && reservaDetalle.estado === 'aprobada' && !esPasado(reservaDetalle.dia, reservaDetalle.hora) && (
              <div className="flex flex-wrap gap-3 p-4 sm:p-6 border-t border-gray-100">
                <button onClick={() => iniciarRechazo(reservaDetalle)} className="btn-danger flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Cancelar reserva
                </button>
                <button onClick={() => setModalDetalle(false)} className="btn-secondary sm:ml-auto">Cerrar</button>
              </div>
            )}
            {puedeGestionarSolicitudes() && reservaDetalle.estado === 'rechazada' && (
              <div className="flex flex-wrap gap-3 p-4 sm:p-6 border-t border-gray-100">
                <button
                  onClick={async () => {
                    if (!confirm('¿Liberar este espacio? La reserva rechazada se eliminará.')) return;
                    try {
                      await api.delete(`/radio/reservas/${reservaDetalle.id}`);
                      setReservas(prev => prev.filter(r => r.id !== reservaDetalle.id));
                      setModalDetalle(false);
                    } catch (err) { alert(err.data?.error || 'Error al liberar'); }
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 px-5 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <XCircle className="w-4 h-4" /> Liberar espacio
                </button>
                <button onClick={() => setModalDetalle(false)} className="btn-secondary sm:ml-auto">Cerrar</button>
              </div>
            )}
            {!puedeGestionarSolicitudes() && (
              <div className="flex gap-3 p-4 sm:p-6 border-t border-gray-100">
                <button onClick={() => setModalDetalle(false)} className="btn-secondary">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal de rechazo con comentario obligatorio ─ */}
      {modalRechazo && reservaARechazo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-red-500" />
                {reservaARechazo?.estado === 'aprobada' ? 'Motivo de cancelación' : 'Motivo de rechazo'}
              </h3>
              <button onClick={() => setModalRechazo(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-50 rounded-xl p-3.5">
                <p className="text-sm font-medium text-red-800">{reservaARechazo.formulario?.nombre_programa}</p>
                <p className="text-xs text-red-600 mt-0.5">{reservaARechazo.dia} — {reservaARechazo.hora}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {reservaARechazo?.estado === 'aprobada' ? 'Motivo de la cancelación' : 'Motivo del rechazo'} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={comentarioRechazo}
                  onChange={(e) => setComentarioRechazo(e.target.value)}
                  className="input-field min-h-[100px] resize-none"
                  placeholder={reservaARechazo?.estado === 'aprobada'
                    ? 'Explica por qué se cancela este programa (cambio de horario, cancelación del docente, etc.). Quedará visible en el calendario y en el CSV de novedades.'
                    : 'Explica el motivo del rechazo. Quedará visible en el calendario y en el CSV de novedades.'}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">{comentarioRechazo.length} caracteres (mín. 5)</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 p-4 sm:p-5 border-t border-gray-100">
              <button
                onClick={confirmarRechazo}
                disabled={comentarioRechazo.trim().length < 5 || rechazandoId !== null}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                {rechazandoId
                  ? 'Procesando...'
                  : reservaARechazo?.estado === 'aprobada' ? 'Confirmar cancelación' : 'Confirmar rechazo'}
              </button>
              <button onClick={() => setModalRechazo(false)} className="btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal de programa fijo ─────────────────────── */}
      {modalFijo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                Programa fijo
              </h3>
              <button onClick={() => setModalFijo(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-xs text-blue-400 mb-0.5">Programa</p>
                <p className="text-sm font-semibold text-blue-900">{modalFijo.programa}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Día</p>
                  <p className="text-sm font-medium text-gray-900">{modalFijo.dia}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Hora</p>
                  <p className="text-sm font-medium text-gray-900">{modalFijo.hora}</p>
                </div>
              </div>
            </div>
            {puedeGestionarSolicitudes() && (
              <div className="flex flex-wrap gap-3 p-5 border-t border-gray-100">
                <button
                  onClick={async () => {
                    if (!confirm(`¿Eliminar el programa fijo "${modalFijo.programa}"? El horario quedará libre para reservas.`)) return;
                    try {
                      await api.delete(`/radio/programas-fijos/${modalFijo.id}`);
                      setProgramasFijos(prev => prev.filter(p => p.id !== modalFijo.id));
                      setModalFijo(null);
                    } catch (err) { alert(err.data?.error || 'Error al eliminar'); }
                  }}
                  className="btn-danger flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" /> Eliminar programa
                </button>
                <button onClick={() => setModalFijo(null)} className="btn-secondary sm:ml-auto">Cerrar</button>
              </div>
            )}
            {!puedeGestionarSolicitudes() && (
              <div className="flex gap-3 p-5 border-t border-gray-100">
                <button onClick={() => setModalFijo(null)} className="btn-secondary">Cerrar</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
