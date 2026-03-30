import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Headset,
  Send,
  Clock,
  CheckCircle2,
  UserCheck,
  Monitor,
  Code,
  Wifi,
  Key,
  HelpCircle,
  Timer,
  BarChart3,
  Users,
  Building2,
  Filter,
  RefreshCw,
  UserPlus,
  X,
  Trash2,
  Play,
  Square,
  ArrowUpRight,
  AlertTriangle,
  MapPin,
  MessageSquare,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ── Constantes ──────────────────────────────────────────
const CATEGORIAS = [
  { value: 'HARDWARE', label: 'Equipos y dispositivos', desc: 'Mouse, teclado, pantalla, cargador, diadema, silla...', icon: Monitor, color: 'blue' },
  { value: 'SOFTWARE', label: 'Programas y aplicaciones', desc: 'Instalar programa, error en app, actualizar sistema...', icon: Code, color: 'purple' },
  { value: 'RED_INTERNET', label: 'Internet y red', desc: 'No tengo internet, WiFi lento, no carga una pagina...', icon: Wifi, color: 'amber' },
  { value: 'ACCESOS', label: 'Usuarios y contrasenas', desc: 'No puedo entrar, olvide clave, necesito acceso a...', icon: Key, color: 'emerald' },
  { value: 'OTROS', label: 'Otra solicitud', desc: 'Cualquier otro problema o necesidad de TI', icon: HelpCircle, color: 'gray' },
];

const SEDES = [
  { value: 'Casa Verde', label: 'Casa Verde' },
  { value: 'Sede 2', label: 'Sede 2', sub: [
    'Torre Madera', 'Torre A', 'Golfistas', 'Rampa', 'Curas', 'Tonala', 'Gimnasio', 'Laboratorios',
  ]},
  { value: 'Sede 3', label: 'Sede 3' },
  { value: 'Opus', label: 'Opus' },
  { value: 'Navarrete', label: 'Navarrete' },
  { value: 'Casa Martha', label: 'Casa Martha' },
  { value: 'Jesuitas', label: 'Jesuitas' },
  { value: 'IPS', label: 'IPS' },
  { value: 'Enfermeria', label: 'Enfermeria' },
  { value: 'Veterinaria', label: 'Veterinaria' },
];

const PRIORIDADES_LABELS = {
  ALTA: { label: 'Urgente', clase: 'bg-red-100 text-red-700 border-red-200' },
  MEDIA: { label: 'Necesita atencion', clase: 'bg-amber-100 text-amber-700 border-amber-200' },
  BAJA: { label: 'Puede esperar', clase: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const ESTADOS_CONFIG = {
  PENDIENTE: { clase: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock, label: 'Sin asignar' },
  ASIGNADO: { clase: 'bg-blue-50 text-blue-700 border-blue-200', icon: MapPin, label: 'Tecnico en camino' },
  EN_PROCESO: { clase: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Timer, label: 'En atencion' },
  CUMPLIDO: { clase: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Resuelto' },
  ESCALADO: { clase: 'bg-purple-50 text-purple-700 border-purple-200', icon: ArrowUpRight, label: 'Escalado al coordinador' },
};

const COLORES_CHART = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#6b7280'];
const COLORES_PRIORIDAD = { ALTA: '#ef4444', MEDIA: '#f59e0b', BAJA: '#9ca3af', SIN_CLASIFICAR: '#d1d5db' };

// ── Componente Cronómetro ───────────────────────────────
function Cronometro({ desde, label }) {
  const [elapsed, setElapsed] = useState('');
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(desde).getTime();
      const totalSecs = Math.floor(diff / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      setElapsed(hrs > 0 ? `${hrs}h ${mins}m ${secs}s` : `${mins}m ${secs}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [desde]);
  return (
    <span className="inline-flex items-center gap-1 text-sm font-mono text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
      <Timer className="w-3.5 h-3.5 animate-pulse" />{label ? `${label}: ` : ''}{elapsed}
    </span>
  );
}

function TiempoResolucion({ desde, hasta, label }) {
  const diff = new Date(hasta).getTime() - new Date(desde).getTime();
  const totalMins = Math.floor(diff / 60000);
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const texto = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
      <CheckCircle2 className="w-3.5 h-3.5" />{label ? `${label}: ` : ''}{texto}
    </span>
  );
}

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════
export default function HelpMe() {
  const { usuario, esAdmin, esDirector, esEquipo, esSolicitante } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [metricas, setMetricas] = useState(null);
  const [equipo, setEquipo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('tickets');

  // Formulario
  const [descripcion, setDescripcion] = useState('');
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [subSede, setSubSede] = useState('');
  const [categoria, setCategoria] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroSede, setFiltroSede] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [modalAsignar, setModalAsignar] = useState(null);
  const [modalEscalar, setModalEscalar] = useState(null);
  const [motivoEscalar, setMotivoEscalar] = useState('');
  const [modalFinalizar, setModalFinalizar] = useState(null);
  const [notaFinalizar, setNotaFinalizar] = useState('');

  // Formulario crear colaborador
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoCargo, setNuevoCargo] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [creandoColaborador, setCreandoColaborador] = useState(false);

  const esGestor = esAdmin() || esDirector();
  const esAgente = esEquipo() || esGestor;

  // Sede con sub-ubicación
  const sedeActual = SEDES.find(s => s.value === sedeSeleccionada);
  const tieneSub = sedeActual?.sub?.length > 0;
  const sedeCompleta = tieneSub && subSede
    ? `${sedeSeleccionada} - ${subSede}`
    : sedeSeleccionada;

  // ── Fetch ───────────────────────────────────────────
  const fetchData = async () => {
    try {
      const res = await api.get('/helpme');
      const data = Array.isArray(res) ? res : res.data || [];
      setTickets(data);

      if (esAgente) {
        try {
          const ag = await api.get('/helpme/agentes');
          setAgentes(Array.isArray(ag) ? ag : ag.data || []);
        } catch {}
      }

      if (esGestor) {
        if (tab === 'metricas') {
          try { setMetricas(await api.get('/helpme/metricas')); } catch {}
        }
        if (tab === 'equipo') {
          try {
            const eq = await api.get('/helpme/equipo');
            setEquipo(Array.isArray(eq) ? eq : eq.data || []);
          } catch {}
        }
      }
    } catch (error) {
      console.error('Error fetching helpme:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [tab]);
  useEffect(() => {
    if (tab === 'metricas' && esGestor) {
      api.get('/helpme/metricas').then(setMetricas).catch(() => {});
    }
    if (tab === 'equipo' && esGestor) {
      api.get('/helpme/equipo').then(eq => setEquipo(Array.isArray(eq) ? eq : eq.data || [])).catch(() => {});
    }
  }, [tab]);

  // ── Filtros ─────────────────────────────────────────
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter(t => {
      if (filtroEstado !== 'todos' && t.estado !== filtroEstado) return false;
      if (filtroCategoria !== 'todos' && t.categoria !== filtroCategoria) return false;
      if (filtroSede !== 'todos' && !t.sede.startsWith(filtroSede)) return false;
      if (busqueda && !t.descripcion.toLowerCase().includes(busqueda.toLowerCase())) return false;
      return true;
    });
  }, [tickets, filtroEstado, filtroCategoria, filtroSede, busqueda]);

  // ── Handlers ────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descripcion.trim() || !sedeSeleccionada || !categoria) return;
    if (tieneSub && !subSede) return;
    setEnviando(true);
    try {
      const nuevo = await api.post('/helpme', {
        descripcion: descripcion.trim(),
        sede: sedeCompleta,
        categoria,
      });
      setTickets(prev => [nuevo, ...prev]);
      setDescripcion('');
      setSedeSeleccionada('');
      setSubSede('');
      setCategoria('');
      setEnviado(true);
      setTimeout(() => setEnviado(false), 4000);
    } catch (error) {
      alert(error.data?.error || 'Error al crear solicitud');
    } finally {
      setEnviando(false);
    }
  };

  const iniciarTicket = async (id) => {
    try {
      const updated = await api.patch(`/helpme/${id}/iniciar`);
      setTickets(prev => prev.map(t => t.id === id ? updated : t));
      const ag = await api.get('/helpme/agentes');
      setAgentes(Array.isArray(ag) ? ag : ag.data || []);
    } catch (error) {
      alert(error.data?.error || 'Error al iniciar');
    }
  };

  const finalizarTicket = async () => {
    if (!modalFinalizar) return;
    try {
      const updated = await api.patch(`/helpme/${modalFinalizar}/finalizar`, { nota: notaFinalizar.trim() || null });
      setTickets(prev => prev.map(t => t.id === modalFinalizar ? updated : t));
      setModalFinalizar(null);
      setNotaFinalizar('');
      const ag = await api.get('/helpme/agentes');
      setAgentes(Array.isArray(ag) ? ag : ag.data || []);
    } catch (error) {
      alert(error.data?.error || 'Error al finalizar');
    }
  };

  const escalarTicket = async () => {
    if (!modalEscalar) return;
    try {
      const updated = await api.patch(`/helpme/${modalEscalar}/escalar`, { motivo: motivoEscalar.trim() || null });
      setTickets(prev => prev.map(t => t.id === modalEscalar ? updated : t));
      setModalEscalar(null);
      setMotivoEscalar('');
      const ag = await api.get('/helpme/agentes');
      setAgentes(Array.isArray(ag) ? ag : ag.data || []);
    } catch (error) {
      alert(error.data?.error || 'Error al escalar');
    }
  };

  const asignarTicket = async (ticketId, agenteId) => {
    try {
      const updated = await api.patch(`/helpme/${ticketId}/asignar`, { agenteId });
      setTickets(prev => prev.map(t => t.id === ticketId ? updated : t));
      setModalAsignar(null);
      const ag = await api.get('/helpme/agentes');
      setAgentes(Array.isArray(ag) ? ag : ag.data || []);
    } catch (error) {
      alert(error.data?.error || 'Error al asignar');
    }
  };

  const clasificarTicket = async (id, prioridad) => {
    try {
      const updated = await api.patch(`/helpme/${id}/clasificar`, { prioridad });
      setTickets(prev => prev.map(t => t.id === id ? updated : t));
    } catch (error) {
      alert(error.data?.error || 'Error al clasificar');
    }
  };

  const crearColaborador = async (e) => {
    e.preventDefault();
    setCreandoColaborador(true);
    try {
      const nuevo = await api.post('/helpme/equipo', {
        nombre: nuevoNombre.trim(),
        email: nuevoEmail.trim(),
        cargo: nuevoCargo.trim(),
        password: nuevoPassword,
      });
      setEquipo(prev => [...prev, nuevo]);
      setNuevoNombre('');
      setNuevoEmail('');
      setNuevoCargo('');
      setNuevoPassword('');
    } catch (error) {
      alert(error.data?.error || 'Error al crear colaborador');
    } finally {
      setCreandoColaborador(false);
    }
  };

  const eliminarColaborador = async (id) => {
    if (!confirm('¿Estas seguro de eliminar este colaborador?')) return;
    try {
      await api.delete(`/helpme/equipo/${id}`);
      setEquipo(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      alert(error.data?.error || 'Error al eliminar');
    }
  };

  // ── Loading ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 px-4 sm:px-6">
      {/* ── Encabezado ──────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Headset className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Help-Me TI</h1>
            <p className="text-gray-500 mt-0.5 text-sm">¿Tienes un problema tecnico? Estamos para ayudarte</p>
          </div>
        </div>

        {esGestor && (
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {['tickets', 'metricas', 'equipo'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t === 'tickets' && <><Headset className="w-4 h-4 inline mr-1.5" />Solicitudes</>}
                {t === 'metricas' && <><BarChart3 className="w-4 h-4 inline mr-1.5" />Metricas</>}
                {t === 'equipo' && <><Users className="w-4 h-4 inline mr-1.5" />Mi Equipo</>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: TICKETS                                   */}
      {/* ══════════════════════════════════════════════ */}
      {tab === 'tickets' && (
        <>
          {/* Semáforo de agentes */}
          {esAgente && agentes.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Estado del equipo
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {agentes.map(agente => (
                  <div
                    key={agente.id}
                    className={`card flex items-center gap-3 p-3 border-l-4 ${
                      agente.ocupado ? 'border-l-red-500 bg-red-50/30' : 'border-l-emerald-500'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      agente.ocupado ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{agente.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {agente.ocupado ? 'Ocupado' : 'Disponible'}
                        {agente.rol === 'DIRECTOR' || agente.rol === 'ADMIN' ? ' · Coord.' : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Formulario ──────────────────────────── */}
          <div className="card border-l-4 border-l-indigo-500">
            <h2 className="font-semibold text-gray-900 mb-1">Necesito ayuda con...</h2>
            <p className="text-sm text-gray-500 mb-5">Cuentanos que te pasa y te ayudamos lo mas rapido posible</p>

            {enviado && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl mb-4 text-sm">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Listo, ya recibimos tu solicitud. Un tecnico fue asignado automaticamente y va en camino.
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Paso 1: Tipo de problema */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                  1. ¿Que tipo de problema tienes?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {CATEGORIAS.map(c => {
                    const CatIcon = c.icon;
                    const activo = categoria === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => setCategoria(c.value)}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                          activo
                            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          activo ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <CatIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${activo ? 'text-indigo-900' : 'text-gray-800'}`}>{c.label}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Paso 2: Descripción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  2. Cuentanos que te pasa <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-400 mb-2">Escribe con tus palabras, no importa si no sabes el nombre tecnico</p>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ejemplo: Mi mouse no responde, la pantalla se queda negra, necesito que me instalen Excel, no me conecta el WiFi..."
                  className="input-field min-h-[100px] resize-y"
                  required
                />
              </div>

              {/* Paso 3: Sede */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  3. ¿En que sede estas? <span className="text-red-500">*</span>
                </label>
                <select
                  value={sedeSeleccionada}
                  onChange={(e) => { setSedeSeleccionada(e.target.value); setSubSede(''); }}
                  className="input-field max-w-md"
                  required
                >
                  <option value="">Selecciona tu sede...</option>
                  {SEDES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>

                {tieneSub && (
                  <div className="mt-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      ¿En que parte de {sedeSeleccionada}? <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={subSede}
                      onChange={(e) => setSubSede(e.target.value)}
                      className="input-field max-w-md"
                      required
                    >
                      <option value="">Selecciona ubicacion...</option>
                      {sedeActual.sub.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center text-base py-3 px-6"
              >
                <Send className="w-4 h-4" />
                {enviando ? 'Enviando...' : 'Enviar mi solicitud'}
              </button>
            </form>
          </div>

          {/* ── Filtros ─────────────────────────────── */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Filter className="w-4 h-4" />
              Filtros:
            </div>
            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input-field text-sm w-auto">
              <option value="todos">Todos los estados</option>
              <option value="PENDIENTE">Sin asignar</option>
              <option value="ASIGNADO">Tecnico en camino</option>
              <option value="EN_PROCESO">En atencion</option>
              <option value="CUMPLIDO">Resuelto</option>
              <option value="ESCALADO">Escalado</option>
            </select>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="input-field text-sm w-auto">
              <option value="todos">Todos los tipos</option>
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)} className="input-field text-sm w-auto">
              <option value="todos">Todas las sedes</option>
              {SEDES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar..."
              className="input-field text-sm w-auto min-w-[180px]"
            />
            <button onClick={fetchData} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Actualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* ── Lista de tickets ────────────────────── */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {esSolicitante() ? 'Mis solicitudes' : 'Solicitudes de ayuda'}
              <span className="text-sm font-normal text-gray-400 ml-2">({ticketsFiltrados.length})</span>
            </h2>

            {ticketsFiltrados.length === 0 ? (
              <div className="card text-center py-10">
                <Headset className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No hay solicitudes</p>
              </div>
            ) : (
              <div className="space-y-3">
                {ticketsFiltrados.map(ticket => {
                  const estadoConf = ESTADOS_CONFIG[ticket.estado] || ESTADOS_CONFIG.PENDIENTE;
                  const IconEstado = estadoConf.icon;
                  const catConf = CATEGORIAS.find(c => c.value === ticket.categoria);
                  const CatIcon = catConf?.icon || HelpCircle;
                  const prioConf = ticket.prioridad ? PRIORIDADES_LABELS[ticket.prioridad] : null;
                  const esMiTicket = ticket.agenteId === usuario?.id;

                  return (
                    <div
                      key={ticket.id}
                      className={`card border-l-4 ${
                        ticket.estado === 'CUMPLIDO' ? 'border-l-emerald-500'
                        : ticket.estado === 'EN_PROCESO' ? 'border-l-indigo-500'
                        : ticket.estado === 'ASIGNADO' ? 'border-l-blue-500'
                        : ticket.estado === 'ESCALADO' ? 'border-l-purple-500'
                        : ticket.prioridad === 'ALTA' ? 'border-l-red-500'
                        : 'border-l-gray-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Badges */}
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className={`badge border ${estadoConf.clase}`}>
                              <IconEstado className="w-3 h-3 mr-1" />{estadoConf.label}
                            </span>
                            {prioConf ? (
                              <span className={`badge border ${prioConf.clase}`}>
                                {prioConf.label}
                              </span>
                            ) : (
                              <span className="badge border border-dashed border-gray-300 bg-gray-50 text-gray-400">
                                Sin clasificar
                              </span>
                            )}
                            <span className="badge border bg-gray-50 text-gray-600 border-gray-200">
                              <CatIcon className="w-3 h-3 mr-1" />{catConf?.label || ticket.categoria}
                            </span>
                          </div>

                          {/* Descripción */}
                          <p className="text-sm text-gray-800 mb-2">{ticket.descripcion}</p>

                          {/* Nota del técnico */}
                          {ticket.nota && (
                            <div className="flex items-start gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-2">
                              <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
                              <span>{ticket.nota}</span>
                            </div>
                          )}

                          {/* Agente asignado */}
                          {ticket.agente && (
                            <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-0.5 w-fit mb-2">
                              <UserCheck className="w-3 h-3" />
                              {ticket.estado === 'ASIGNADO' ? 'En camino' : 'Atendido por'}: {ticket.agente.nombre}
                            </div>
                          )}

                          {/* Cronómetros */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {ticket.estado === 'ASIGNADO' && ticket.asignadoAt && (
                              <Cronometro desde={ticket.asignadoAt} label="Esperando" />
                            )}
                            {ticket.estado === 'EN_PROCESO' && ticket.iniciadoAt && (
                              <Cronometro desde={ticket.iniciadoAt} label="Atendiendo" />
                            )}
                            {ticket.estado === 'CUMPLIDO' && ticket.iniciadoAt && ticket.cumplidoAt && (
                              <TiempoResolucion desde={ticket.iniciadoAt} hasta={ticket.cumplidoAt} label="Atencion" />
                            )}
                          </div>

                          {/* Info del ticket */}
                          <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap mt-2">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />{ticket.sede}
                            </span>
                            <span>{ticket.solicitante?.nombre}</span>
                            <span>#{ticket.id}</span>
                            <span>
                              {ticket.createdAt
                                ? new Date(ticket.createdAt).toLocaleDateString('es-CO', {
                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                        </div>

                        {/* ── Acciones ─────────────────────── */}
                        <div className="shrink-0 flex flex-col gap-2">
                          {/* Coordinador: clasificar prioridad */}
                          {esGestor && ticket.estado !== 'CUMPLIDO' && (
                            <select
                              value={ticket.prioridad || ''}
                              onChange={(e) => clasificarTicket(ticket.id, e.target.value)}
                              className={`input-field text-sm w-full ${
                                ticket.prioridad === 'ALTA' ? 'border-red-300 bg-red-50 text-red-700'
                                : ticket.prioridad === 'MEDIA' ? 'border-amber-300 bg-amber-50 text-amber-700'
                                : ticket.prioridad === 'BAJA' ? 'border-gray-300 bg-gray-50 text-gray-700'
                                : 'border-dashed border-gray-300 text-gray-400'
                              }`}
                            >
                              <option value="" disabled>Clasificar...</option>
                              <option value="BAJA">Puede esperar</option>
                              <option value="MEDIA">Necesita atencion</option>
                              <option value="ALTA">Urgente</option>
                            </select>
                          )}

                          {/* Coordinador: asignar (PENDIENTE o ESCALADO) */}
                          {(ticket.estado === 'PENDIENTE' || ticket.estado === 'ESCALADO') && esGestor && (
                            <button
                              onClick={() => setModalAsignar(ticket.id)}
                              className="flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium"
                            >
                              <UserPlus className="w-4 h-4" />
                              Asignar
                            </button>
                          )}

                          {/* Técnico: INICIAR (cuando está asignado a él) */}
                          {ticket.estado === 'ASIGNADO' && esMiTicket && (
                            <button
                              onClick={() => iniciarTicket(ticket.id)}
                              className="flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium animate-pulse"
                            >
                              <Play className="w-4 h-4" />
                              Iniciar atencion
                            </button>
                          )}

                          {/* Técnico: FINALIZAR (cuando está en proceso) */}
                          {ticket.estado === 'EN_PROCESO' && esMiTicket && (
                            <button
                              onClick={() => { setModalFinalizar(ticket.id); setNotaFinalizar(''); }}
                              className="flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                            >
                              <Square className="w-4 h-4" />
                              Finalizar solicitud
                            </button>
                          )}

                          {/* Técnico: ESCALAR (asignado o en proceso) */}
                          {['ASIGNADO', 'EN_PROCESO'].includes(ticket.estado) && esMiTicket && esEquipo() && (
                            <button
                              onClick={() => { setModalEscalar(ticket.id); setMotivoEscalar(''); }}
                              className="flex items-center justify-center gap-1.5 text-sm px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                              Escalar al coordinador
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: METRICAS                                  */}
      {/* ══════════════════════════════════════════════ */}
      {tab === 'metricas' && <MetricasDashboard metricas={metricas} />}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: MI EQUIPO                                 */}
      {/* ══════════════════════════════════════════════ */}
      {tab === 'equipo' && esGestor && (
        <div className="space-y-6">
          <div className="card border-l-4 border-l-indigo-500">
            <h2 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Agregar nuevo colaborador de TI
            </h2>
            <p className="text-sm text-gray-500 mb-4">Crea un usuario para un miembro de tu equipo de soporte</p>

            <form onSubmit={crearColaborador} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Juan Perez" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo electronico</label>
                <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="juan@correo.com" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                <input type="text" value={nuevoCargo} onChange={(e) => setNuevoCargo(e.target.value)} placeholder="Tecnico de soporte" className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
                <input type="password" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} placeholder="Minimo 6 caracteres" className="input-field" required minLength={6} />
              </div>
              <div className="sm:col-span-2">
                <button type="submit" disabled={creandoColaborador} className="btn-primary flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {creandoColaborador ? 'Creando...' : 'Agregar colaborador'}
                </button>
              </div>
            </form>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mi equipo de soporte
              <span className="text-sm font-normal text-gray-400">({equipo.length})</span>
            </h2>

            {equipo.length === 0 ? (
              <div className="card text-center py-10">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Aun no hay colaboradores</p>
                <p className="text-sm text-gray-400 mt-1">Agrega a los tecnicos de tu equipo arriba</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {equipo.map(col => (
                  <div key={col.id} className="card flex items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-sm font-bold text-indigo-600 shrink-0">
                      {col.nombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{col.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">{col.cargo}</p>
                      <p className="text-xs text-gray-400 truncate">{col.email}</p>
                    </div>
                    <button
                      onClick={() => eliminarColaborador(col.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* MODAL: Asignar ticket                          */}
      {/* ══════════════════════════════════════════════ */}
      {modalAsignar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                ¿A quien le asignas esta solicitud?
              </h3>
              <button onClick={() => setModalAsignar(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1">
              <p className="text-sm text-gray-500 mb-4">Selecciona un tecnico de tu equipo:</p>
              <div className="space-y-2">
                {agentes.map(agente => (
                  <button
                    key={agente.id}
                    onClick={() => asignarTicket(modalAsignar, agente.id)}
                    disabled={agente.ocupado}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      agente.ocupado
                        ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full shrink-0 ${
                      agente.ocupado ? 'bg-red-500' : 'bg-emerald-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{agente.nombre}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {agente.cargo} · {agente.ocupado ? 'Ocupado' : 'Disponible'}
                      </p>
                    </div>
                    {!agente.ocupado && (
                      <span className="text-xs text-indigo-600 font-medium shrink-0">Asignar</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t">
              <button onClick={() => setModalAsignar(null)} className="w-full btn-secondary">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* MODAL: Finalizar solicitud                     */}
      {/* ══════════════════════════════════════════════ */}
      {modalFinalizar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Finalizar solicitud
              </h3>
              <button onClick={() => setModalFinalizar(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ¿Que hiciste para resolver el problema?
                </label>
                <textarea
                  value={notaFinalizar}
                  onChange={(e) => setNotaFinalizar(e.target.value)}
                  placeholder="Ejemplo: Se cambio el mouse, se reinstalo el programa, se configuro la red..."
                  className="input-field min-h-[80px] resize-y"
                />
                <p className="text-xs text-gray-400 mt-1">Opcional pero recomendado para el registro</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModalFinalizar(null)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button onClick={finalizarTicket} className="flex-1 btn-primary bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Finalizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* MODAL: Escalar al coordinador                  */}
      {/* ══════════════════════════════════════════════ */}
      {modalEscalar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-purple-600" />
                Escalar al coordinador
              </h3>
              <button onClick={() => setModalEscalar(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start gap-2 bg-purple-50 border border-purple-100 text-purple-700 px-4 py-3 rounded-xl text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Esta solicitud se pasara al coordinador y quedaras disponible para nuevas solicitudes.</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ¿Por que necesitas escalar?
                </label>
                <textarea
                  value={motivoEscalar}
                  onChange={(e) => setMotivoEscalar(e.target.value)}
                  placeholder="Ejemplo: Necesita compra de equipo nuevo, requiere permisos de administrador, el problema es mas complejo..."
                  className="input-field min-h-[80px] resize-y"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setModalEscalar(null)} className="flex-1 btn-secondary">
                  Cancelar
                </button>
                <button onClick={escalarTicket} className="flex-1 btn-primary bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2">
                  <ArrowUpRight className="w-4 h-4" />
                  Escalar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPONENTE MÉTRICAS
// ══════════════════════════════════════════════════════════
function MetricasDashboard({ metricas }) {
  if (!metricas) {
    return (
      <div className="card text-center py-10">
        <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Cargando metricas...</p>
      </div>
    );
  }

  const categoriaLabels = {
    HARDWARE: 'Equipos y dispositivos',
    SOFTWARE: 'Programas y apps',
    RED_INTERNET: 'Internet y red',
    ACCESOS: 'Usuarios y claves',
    OTROS: 'Otros',
  };

  const categoriasData = (metricas.porCategoria || []).map((c, i) => ({
    name: categoriaLabels[c.categoria] || c.categoria,
    value: c.total,
    fill: COLORES_CHART[i % COLORES_CHART.length],
  }));

  const agentesData = (metricas.porAgente || []).map(a => ({
    name: a.nombre,
    atendidos: a.totalAtendidos,
    cumplidos: a.cumplidos,
    escalados: a.escalados,
    tiempoPromedio: a.tiempoPromedioAtencion,
  }));

  const sedesData = (metricas.porSede || []).map(s => ({
    name: s.sede,
    tickets: s.total,
    tiempoPromedio: s.tiempoPromedioAtencion,
  }));

  const prioridadLabels = { ALTA: 'Urgente', MEDIA: 'Necesita atencion', BAJA: 'Puede esperar', SIN_CLASIFICAR: 'Sin clasificar' };
  const prioridadData = (metricas.porPrioridad || []).map(p => ({
    name: prioridadLabels[p.prioridad] || p.prioridad,
    value: p.total,
    fill: COLORES_PRIORIDAD[p.prioridad] || '#9ca3af',
  }));

  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-900">{metricas.total}</p>
          <p className="text-xs text-gray-500 mt-1">Total solicitudes</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-amber-600">{metricas.pendientes + (metricas.escalados || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Sin atender</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-blue-600">{metricas.asignados + metricas.enProceso}</p>
          <p className="text-xs text-gray-500 mt-1">En curso</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-emerald-600">{metricas.cumplidos}</p>
          <p className="text-xs text-gray-500 mt-1">Resueltos</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-indigo-600">{metricas.tiempoAtencionPromedio}m</p>
          <p className="text-xs text-gray-500 mt-1">Tiempo atencion prom.</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-gray-600">{metricas.tiempoTotalPromedio}m</p>
          <p className="text-xs text-gray-500 mt-1">Tiempo total prom.</p>
        </div>
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Por tipo de problema</h3>
          {categoriasData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={categoriasData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {categoriasData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sin datos</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Por urgencia</h3>
          {prioridadData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={prioridadData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {prioridadData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sin datos</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Rendimiento por tecnico</h3>
          {agentesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={agentesData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value, name) => {
                  if (name === 'cumplidos') return [value, 'Resueltos'];
                  if (name === 'escalados') return [value, 'Escalados'];
                  return [value, 'Atendidos'];
                }} />
                <Bar dataKey="cumplidos" fill="#10b981" radius={[0, 6, 6, 0]} stackId="a" />
                <Bar dataKey="escalados" fill="#8b5cf6" radius={[0, 6, 6, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sin datos</p>}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Solicitudes por sede</h3>
          {sedesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sedesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(value, name) => name === 'tickets' ? [value, 'Solicitudes'] : [`${value}m`, 'Tiempo prom.']} />
                <Bar dataKey="tickets" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-10">Sin datos</p>}
        </div>
      </div>
    </div>
  );
}
