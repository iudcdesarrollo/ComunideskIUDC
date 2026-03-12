import { useState, useEffect, useCallback, useRef } from 'react';
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
  Brain,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from 'recharts';

const iconosTipo = { ClipboardList, Camera, Palette, Award, FolderOpen, Radio };

// ─── Banner Carrusel ───────────────────────────────────
const BANNERS = [
  {
    id: 1,
    bg: 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700',
    iconBg: 'bg-blue-500',
    tagColor: 'bg-blue-500/40 text-white',
    ctaColor: 'bg-white text-blue-700 hover:bg-blue-50',
    icon: Radio,
    tag: 'Aviso · Radio IUDC',
    titulo: 'Valide disponibilidad en la parrilla de Radio',
    texto: 'Estimado director: le recordamos revisar y agendar los espacios disponibles en la parrilla semanal de Radio IUDC. Confirme las fechas con anticipación.',
    cta: 'Ir a Radio IUDC',
    ctaRuta: '/radio',
  },
  {
    id: 2,
    bg: 'bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700',
    iconBg: 'bg-emerald-500',
    tagColor: 'bg-emerald-500/40 text-white',
    ctaColor: null,
    icon: Shield,
    tag: 'Comunicado · Cultura Organizacional',
    titulo: 'ComuniDesk: estamos siendo el cambio',
    texto: 'Estamos implementando cultura organizacional en el área de comunicaciones. Cada proceso, cada solicitud, cada colaboración construye nuestra identidad institucional. ¡Sé parte del cambio!',
    cta: null,
    ctaRuta: null,
  },
  {
    id: 3,
    bg: 'bg-gradient-to-br from-violet-700 via-purple-600 to-fuchsia-700',
    iconBg: 'bg-violet-500',
    tagColor: 'bg-violet-500/40 text-white',
    ctaColor: 'bg-white text-violet-700 hover:bg-violet-50',
    icon: Brain,
    tag: 'Nuevo · Valle del Software · IA',
    titulo: 'Trabaja con IA en el Valle del Software',
    texto: 'Si deseas potencializar tus proyectos y los de tus estudiantes incorporando Inteligencia Artificial de forma profesional e interactiva, agenda tu espacio de trabajo.',
    cta: 'Agenda tu espacio',
    ctaRuta: '/valle-ia',
  },
];

function BannerCarrusel() {
  const navigate = useNavigate();
  const [activo, setActivo] = useState(0);

  const siguiente = useCallback(() => setActivo((p) => (p + 1) % BANNERS.length), []);
  const anterior = () => setActivo((p) => (p - 1 + BANNERS.length) % BANNERS.length);

  useEffect(() => {
    const t = setInterval(siguiente, 30000);
    return () => clearInterval(t);
  }, [siguiente]);

  const banner = BANNERS[activo];
  const Icon = banner.icon;

  return (
    <div className={`relative ${banner.bg} rounded-2xl overflow-hidden text-white shadow-lg`}>
      {/* Decoración de fondo */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16 pointer-events-none" />
      <div className="absolute bottom-0 right-12 w-32 h-32 bg-white/5 rounded-full translate-y-12 pointer-events-none" />

      <div className="relative px-4 py-5 sm:px-8 sm:py-7">
        <div className="flex items-start justify-between gap-3 sm:gap-6">
          <div className="flex-1 min-w-0">
            {/* Tag */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3 flex-wrap">
              <div className={`w-6 h-6 sm:w-7 sm:h-7 ${banner.iconBg} rounded-lg flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className={`text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 rounded-full uppercase tracking-wide ${banner.tagColor}`}>
                {banner.tag}
              </span>
            </div>
            {/* Título */}
            <h3 className="text-base sm:text-xl lg:text-2xl font-extrabold leading-tight mb-1.5 sm:mb-2 text-white drop-shadow-sm line-clamp-2">
              {banner.titulo}
            </h3>
            {/* Texto */}
            <p className="text-white/90 text-xs sm:text-sm lg:text-base leading-relaxed max-w-2xl font-medium line-clamp-3 sm:line-clamp-none">
              {banner.texto}
            </p>
            {/* CTA */}
            {banner.cta && (
              <button
                onClick={() => navigate(banner.ctaRuta)}
                className={`mt-3 sm:mt-5 inline-flex items-center gap-2 text-xs sm:text-sm font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl shadow transition-colors ${banner.ctaColor}`}
              >
                {banner.cta}
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>

          {/* Flechas de navegación */}
          <div className="flex gap-1.5 sm:gap-2 shrink-0 mt-0.5">
            <button onClick={anterior} className="p-1.5 sm:p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-colors border border-white/20">
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button onClick={siguiente} className="p-1.5 sm:p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-colors border border-white/20">
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Indicadores + contador */}
        <div className="flex items-center justify-between mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-white/15">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {BANNERS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivo(i)}
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-400 ${i === activo ? 'w-6 sm:w-8 bg-white' : 'w-1.5 sm:w-2 bg-white/35 hover:bg-white/55'}`}
              />
            ))}
          </div>
          <span className="text-[10px] sm:text-xs text-white/50 font-medium">{activo + 1} / {BANNERS.length}</span>
        </div>
      </div>
    </div>
  );
}

const coloresTipo = {
  blue: 'bg-blue-50 text-blue-600 border-blue-100',
  purple: 'bg-purple-50 text-purple-600 border-purple-100',
  pink: 'bg-pink-50 text-pink-600 border-pink-100',
  amber: 'bg-amber-50 text-amber-600 border-amber-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  red: 'bg-red-50 text-red-600 border-red-100',
};

// ─── Helpers para "Radio en vivo" ──────────────────────
function obtenerLunesDeHoy() {
  const d = new Date();
  const dia = d.getDay();
  const diff = d.getDate() - dia + (dia === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}
function fechaDiaIndex(lunes, i) {
  const f = new Date(lunes); f.setDate(f.getDate() + i); return f.toISOString().split('T')[0];
}
function parsearHora(horaTexto) {
  const m = horaTexto.toLowerCase().replace(/\s+/g, '').match(/^(\d{1,2}):(\d{2})(a\.?m\.?|p\.?m\.?)$/);
  if (!m) return null;
  let h = Number(m[1]); const min = Number(m[2]);
  if (m[3].startsWith('p') && h !== 12) h += 12;
  if (m[3].startsWith('a') && h === 12) h = 0;
  return { h, min };
}
function estaEnVivo(lunes, dias, dia, hora) {
  const idx = dias.indexOf(dia); if (idx < 0) return false;
  const t = parsearHora(hora); if (!t) return false;
  const inicio = new Date(`${fechaDiaIndex(lunes, idx)}T00:00:00`);
  inicio.setHours(t.h, t.min, 0, 0);
  const fin = new Date(inicio.getTime() + 30 * 60 * 1000);
  const ahora = new Date();
  return ahora >= inicio && ahora < fin;
}

function RadioEnVivoBanner() {
  const navigate = useNavigate();
  const [programa, setPrograma] = useState(null);

  useEffect(() => {
    const lunes = obtenerLunesDeHoy();
    const lunesKey = lunes.toISOString().split('T')[0];

    Promise.all([
      api.get('/radio/config'),
      api.get('/radio/programas-fijos'),
      api.get(`/radio/reservas?semana=${lunesKey}`),
    ]).then(([cfg, fijos, reservas]) => {
      const dias = cfg.franjas ? cfg.dias || [] : [];
      const franjas = cfg.franjas || [];
      const programasFijos = Array.isArray(fijos) ? fijos : [];
      const reservasList = Array.isArray(reservas) ? reservas : [];

      for (const dia of dias) {
        for (const hora of franjas) {
          if (!estaEnVivo(lunes, dias, dia, hora)) continue;
          // Check programas fijos first
          const fijo = programasFijos.find(p => p.dia === dia && p.hora === hora);
          if (fijo) { setPrograma({ nombre: fijo.programa, dia, hora }); return; }
          // Check approved reservas
          const res = reservasList.find(r => r.dia === dia && r.hora === hora && r.estado === 'aprobada');
          if (res) { setPrograma({ nombre: res.formulario?.nombre_programa || 'Programa', dia, hora }); return; }
        }
      }
    }).catch(() => {});
  }, []);

  if (!programa) return null;

  return (
    <div
      onClick={() => navigate('/radio')}
      className="bg-gradient-to-r from-red-600 to-rose-500 rounded-2xl px-5 py-4 flex items-center gap-4 shadow-lg cursor-pointer hover:opacity-95 transition-opacity"
    >
      <div className="relative shrink-0">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-bold text-sm">● RADIO EN VIVO</span>
          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">AHORA</span>
        </div>
        <p className="text-white/90 text-sm font-medium truncate mt-0.5">{programa.nombre}</p>
        <p className="text-white/60 text-xs">{programa.dia} · {programa.hora}</p>
      </div>
      <span className="shrink-0 bg-white/20 text-white font-bold text-xs px-3 py-2 rounded-xl animate-pulse border border-white/30">
        EN ANTENA
      </span>
    </div>
  );
}

export default function Dashboard() {
  const { usuario, puedeVerUrgentes, puedeGestionarSolicitudes, esAdmin, esDirector, esEquipo, esSolicitante } = useAuth();
  const navigate = useNavigate();

  const [solicitudes, setSolicitudes] = useState([]);
  const [urgentes, setUrgentes] = useState([]);
  const [reservasPendientesCount, setReservasPendientesCount] = useState(0);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Refs estables para evitar recrear el interval en cada render
  const puedeVerUrgentesRef = useRef(puedeVerUrgentes);
  const puedeGestionarRef = useRef(puedeGestionarSolicitudes);
  useEffect(() => { puedeVerUrgentesRef.current = puedeVerUrgentes; });
  useEffect(() => { puedeGestionarRef.current = puedeGestionarSolicitudes; });

  const fetchData = useCallback(async () => {
    try {
      const [solRes, tiposRes] = await Promise.all([
        api.get('/solicitudes'),
        api.get('/tipos'),
      ]);
      setSolicitudes(Array.isArray(solRes) ? solRes : solRes.data || []);
      setTipos(Array.isArray(tiposRes) ? tiposRes : []);

      if (puedeVerUrgentesRef.current()) {
        try {
          const urgRes = await api.get('/urgentes');
          setUrgentes(Array.isArray(urgRes) ? urgRes : urgRes.data || []);
        } catch (e) { /* ignore */ }
      }

      if (puedeGestionarRef.current()) {
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
  }, []); // deps vacías → función estable, no se recrea

  useEffect(() => {
    fetchData();
    // Polling cada 20s
    const poll = setInterval(fetchData, 20000);
    // Refetch al volver a la pestaña/ventana
    const onVisible = () => { if (document.visibilityState === 'visible') fetchData(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [fetchData]);

  const misSolicitudes = solicitudes;

  // Para equipo: solo pendientes + en proceso (activas), ordenadas por prioridad
  const ORDEN_PRIORIDAD = { ALTA: 0, MEDIA: 1, BAJA: 2 };
  const solicitudesPorAtender = esEquipo()
    ? solicitudes
        .filter((s) => {
          const est = (s.estado || '').toUpperCase();
          return est === 'PENDIENTE' || est === 'EN_PROCESO';
        })
        .sort((a, b) => {
          const pa = ORDEN_PRIORIDAD[(a.prioridad || '').toUpperCase()] ?? 1;
          const pb = ORDEN_PRIORIDAD[(b.prioridad || '').toUpperCase()] ?? 1;
          return pa - pb;
        })
    : misSolicitudes;

  const stats = {
    total: misSolicitudes.length,
    pendientes: misSolicitudes.filter((s) => (s.estado||'').toUpperCase() === 'PENDIENTE').length,
    enProceso: misSolicitudes.filter((s) => (s.estado||'').toUpperCase() === 'EN_PROCESO').length,
    completadas: misSolicitudes.filter((s) => (s.estado||'').toUpperCase() === 'COMPLETADA').length,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {(esAdmin() || esDirector()) ? 'Panel de administración' : esEquipo() ? 'Mi panel de trabajo' : 'Panel principal'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {(esAdmin() || esDirector())
              ? 'Vista completa de todas las operaciones del área de comunicaciones'
              : esEquipo()
                ? 'Solicitudes asignadas y pendientes por atender'
                : 'Gestiona tus solicitudes y reservas'}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {(esSolicitante() || esAdmin() || esDirector()) && (
            <button onClick={() => navigate('/nueva-solicitud')} className="btn-primary flex items-center gap-2 text-sm whitespace-nowrap">
              <PlusCircle className="w-4 h-4 shrink-0" />
              Nueva solicitud
            </button>
          )}
          <button onClick={() => navigate('/radio')} className="btn-secondary flex items-center gap-2 text-sm whitespace-nowrap">
            <Radio className="w-4 h-4 shrink-0" />
            Radio
          </button>
        </div>
      </div>

      {/* Banner carrusel */}
      <BannerCarrusel />

      {/* Banner Radio en Vivo */}
      <RadioEnVivoBanner />

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total',      value: stats.total,      filtro: 'todos',      icon: FileText,    bg: 'bg-blue-100',    color: 'text-blue-600'    },
          { label: 'Pendientes', value: stats.pendientes, filtro: 'pendiente',  icon: Clock,       bg: 'bg-amber-100',   color: 'text-amber-600'   },
          { label: 'En proceso', value: stats.enProceso,  filtro: 'en_proceso', icon: Loader,      bg: 'bg-blue-100',    color: 'text-blue-600'    },
          { label: 'Completadas',value: stats.completadas,filtro: 'completada', icon: CheckCircle2,bg: 'bg-emerald-100', color: 'text-emerald-600' },
        ].map(({ label, value, filtro, icon: Icon, bg, color }) => (
          <div
            key={label}
            className="card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-3 sm:p-5"
            onClick={() => navigate(`/mis-solicitudes?estado=${filtro}`)}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas para admin */}
      {(esAdmin() || esDirector()) && (
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

      {/* ─── Panel analítico — solo Admin y Director ─── */}
      {(esAdmin() || esDirector()) && (() => {
        const total = solicitudes.length;
        const rechazadas = solicitudes.filter(s => s.estado === 'rechazada').length;
        const tasaCompletitud = total > 0 ? Math.round((stats.completadas / total) * 100) : 0;
        const altaCount  = solicitudes.filter(s => (s.prioridad||'').toLowerCase() === 'alta').length;
        const mediaCount = solicitudes.filter(s => (s.prioridad||'').toLowerCase() === 'media').length;
        const bajaCount  = solicitudes.filter(s => (s.prioridad||'').toLowerCase() === 'baja').length;

        const C_ESTADO = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];
        const C_PRIOR  = ['#ef4444', '#f59e0b', '#9ca3af'];
        const C_TIPO   = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];
        const EMPTY    = [{ name: 'Sin datos', value: 1 }];

        const dataTorta = [
          { name: 'Pendientes',  value: stats.pendientes },
          { name: 'En proceso',  value: stats.enProceso  },
          { name: 'Completadas', value: stats.completadas },
          { name: 'Rechazadas',  value: rechazadas        },
        ].filter(d => d.value > 0);

        const dataPrior = [
          { name: 'Alta',  value: altaCount  },
          { name: 'Media', value: mediaCount },
          { name: 'Baja',  value: bajaCount  },
        ].filter(d => d.value > 0);

        const porTipoObj = solicitudes.reduce((acc, s) => {
          const n = s.tipoNombre || s.tipoSolicitud?.nombre || s.tipoId || 'Otro';
          acc[n] = (acc[n] || 0) + 1;
          return acc;
        }, {});
        const dataTipo = Object.entries(porTipoObj)
          .sort((a, b) => b[1] - a[1])
          .map(([name, value]) => ({ name: name.length > 14 ? name.slice(0, 12) + '…' : name, value }));

        const now = new Date();
        const dataMeses = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return { mes: d.toLocaleString('es-CO', { month: 'short' }), key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, Solicitudes: 0 };
        });
        solicitudes.forEach(s => {
          const fecha = s.createdAt || s.fechaCreacion || '';
          if (!fecha) return;
          const mes = dataMeses.find(m => m.key === fecha.slice(0, 7));
          if (mes) mes.Solicitudes++;
        });

        const porSolObj = solicitudes.reduce((acc, s) => {
          const n = s.solicitante?.nombre || 'Desconocido';
          acc[n] = (acc[n] || 0) + 1; return acc;
        }, {});
        const dataSol = Object.entries(porSolObj).sort((a, b) => b[1] - a[1]).slice(0, 5)
          .map(([name, value]) => ({ name: name.split(' ')[0], value }));

        const porAsigObj = solicitudes.filter(s => s.asignadoA).reduce((acc, s) => {
          const n = s.asignadoA?.nombre || 'Sin nombre';
          if (!acc[n]) acc[n] = { Asignadas: 0, Completadas: 0 };
          acc[n].Asignadas++;
          if ((s.estado||'').toUpperCase() === 'COMPLETADA') acc[n].Completadas++;
          return acc;
        }, {});
        const dataEquipo = Object.entries(porAsigObj).sort((a, b) => b[1].Asignadas - a[1].Asignadas)
          .map(([name, v]) => ({ name: name.split(' ')[0], ...v }));

        const tt = { contentStyle: { borderRadius: '10px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '11px', padding: '6px 10px' } };

        const ChartCard = ({ title, accent, children }) => (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3 pt-3 pb-0">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>{title}</p>
            </div>
            {children}
          </div>
        );

        const EmptyChart = () => (
          <div className="h-[148px] flex flex-col items-center justify-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-dashed border-gray-300" />
            </div>
            <p className="text-[10px] text-gray-300 font-medium">Sin datos aún</p>
          </div>
        );

        return (
          <div className="space-y-3">

            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-0.5 h-4 rounded-full" style={{ background: 'linear-gradient(to bottom, #3b82f6, #6366f1)' }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analíticas del sistema</span>
              <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, #e5e7eb, transparent)' }} />
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{total} solicitudes</span>
            </div>

            {/* KPI chips — gradiente */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Alta prioridad',   value: altaCount,   from: '#fef2f2', to: '#fecaca', num: '#dc2626', dot: '#ef4444' },
                { label: 'Media prioridad',  value: mediaCount,  from: '#fffbeb', to: '#fde68a', num: '#b45309', dot: '#f59e0b' },
                { label: 'Sin asignar',      value: solicitudes.filter(s => !s.asignadoA).length, from: '#faf5ff', to: '#e9d5ff', num: '#6d28d9', dot: '#8b5cf6' },
                { label: 'Completitud',      value: `${tasaCompletitud}%`, from: '#ecfdf5', to: '#a7f3d0', num: '#047857', dot: '#10b981' },
              ].map(k => (
                <div key={k.label} style={{ background: `linear-gradient(135deg, ${k.from}, ${k.to})` }} className="rounded-xl px-3 py-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: k.dot + '22' }}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: k.dot }} />
                  </div>
                  <div>
                    <p className="text-2xl font-black leading-none" style={{ color: k.num }}>{k.value}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 leading-tight">{k.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Gráficas — 4 columnas compactas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

              {/* Donut estados */}
              <ChartCard title="Estados" accent="#f59e0b">
                <ResponsiveContainer width="100%" height={168}>
                  <PieChart>
                    <Pie data={dataTorta.length > 0 ? dataTorta : EMPTY} cx="50%" cy="50%"
                      innerRadius={38} outerRadius={60} paddingAngle={dataTorta.length > 0 ? 3 : 0}
                      dataKey="value" startAngle={90} endAngle={-270}>
                      {(dataTorta.length > 0 ? dataTorta : EMPTY).map((_, i) => (
                        <Cell key={i} fill={dataTorta.length > 0 ? C_ESTADO[i % C_ESTADO.length] : '#e5e7eb'} />
                      ))}
                    </Pie>
                    {dataTorta.length > 0 && <Tooltip {...tt} formatter={(v, n) => [v, n]} />}
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Donut prioridad */}
              <ChartCard title="Prioridad" accent="#ef4444">
                <ResponsiveContainer width="100%" height={168}>
                  <PieChart>
                    <Pie data={dataPrior.length > 0 ? dataPrior : EMPTY} cx="50%" cy="50%"
                      outerRadius={60} paddingAngle={dataPrior.length > 0 ? 3 : 0}
                      dataKey="value" startAngle={90} endAngle={-270}>
                      {(dataPrior.length > 0 ? dataPrior : EMPTY).map((_, i) => (
                        <Cell key={i} fill={dataPrior.length > 0 ? C_PRIOR[i % C_PRIOR.length] : '#e5e7eb'} />
                      ))}
                    </Pie>
                    {dataPrior.length > 0 && <Tooltip {...tt} />}
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              {/* Área — tendencia 6 meses */}
              <ChartCard title="Tendencia 6m" accent="#3b82f6">
                <div className="px-2 pb-2">
                  <ResponsiveContainer width="100%" height={148}>
                    <AreaChart data={dataMeses} margin={{ left: -18, right: 4, top: 6, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip {...tt} />
                      <Area type="monotone" dataKey="Solicitudes" stroke="#3b82f6" strokeWidth={2.5}
                        fill="url(#gS)" dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#2563eb' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              {/* Barras por tipo */}
              <ChartCard title="Por área / tipo" accent="#8b5cf6">
                <div className="px-2 pb-2">
                  {dataTipo.length === 0 ? <EmptyChart /> : (
                    <ResponsiveContainer width="100%" height={148}>
                      <BarChart data={dataTipo} layout="vertical" margin={{ left: 4, right: 14, top: 6, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={82} axisLine={false} tickLine={false} />
                        <Tooltip {...tt} />
                        <Bar dataKey="value" name="Solicitudes" radius={[0, 5, 5, 0]}>
                          {dataTipo.map((_, i) => <Cell key={i} fill={C_TIPO[i % C_TIPO.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>

            {/* Fila inferior: Top solicitantes + Carga equipo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ChartCard title="Top solicitantes" accent="#6366f1">
                <div className="px-2 pb-2">
                  {dataSol.length === 0 ? <EmptyChart /> : (
                    <ResponsiveContainer width="100%" height={148}>
                      <BarChart data={dataSol} margin={{ left: -8, right: 8, top: 6, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip {...tt} formatter={(v) => [v, 'Solicitudes']} />
                        <Bar dataKey="value" name="Solicitudes" radius={[5, 5, 0, 0]}>
                          {dataSol.map((_, i) => (
                            <Cell key={i} fill={['#3b82f6','#6366f1','#8b5cf6','#a78bfa','#c4b5fd'][i] || '#c4b5fd'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>

              <ChartCard title="Carga del equipo" accent="#10b981">
                <div className="px-2 pb-2">
                  {dataEquipo.length === 0 ? <EmptyChart /> : (
                    <ResponsiveContainer width="100%" height={148}>
                      <BarChart data={dataEquipo} margin={{ left: -8, right: 8, top: 6, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip {...tt} />
                        <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px' }} />
                        <Bar dataKey="Asignadas"   radius={[4, 4, 0, 0]} fill="#3b82f6" />
                        <Bar dataKey="Completadas" radius={[4, 4, 0, 0]} fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>

          </div>
        );
      })()}

      <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
        {/* Acciones rápidas - Solo solicitantes */}
        {esSolicitante() && (
          <div className="md:col-span-1">
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
          <div className="md:col-span-1">
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
                  {solicitudes.filter((s) => s.asignadoA?.id === usuario.id && (s.estado||'').toUpperCase() === 'EN_PROCESO').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Completadas por mí</span>
                <span className="font-bold text-emerald-600">
                  {solicitudes.filter((s) => s.asignadoA?.id === usuario.id && (s.estado||'').toUpperCase() === 'COMPLETADA').length}
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

        {/* Accesos rápidos - Admin y Director */}
        {(esAdmin() || esDirector()) && (
          <div className="md:col-span-1">
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
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {esEquipo() ? 'Solicitudes por atender' : esSolicitante() ? 'Mis solicitudes recientes' : 'Todas las solicitudes'}
            </h2>
            <button onClick={() => navigate('/mis-solicitudes')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {solicitudesPorAtender.length === 0 ? (
              <div className="card text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{esEquipo() ? '¡Todo al día! No hay solicitudes pendientes' : 'No hay solicitudes aún'}</p>
                {esSolicitante() && (
                  <button onClick={() => navigate('/nueva-solicitud')} className="btn-primary mt-4 inline-flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Crear primera solicitud
                  </button>
                )}
              </div>
            ) : (
              solicitudesPorAtender.slice(0, 6).map((sol) => {
                const prioridad = (sol.prioridad || '').toUpperCase();
                const prioridadColor = prioridad === 'ALTA' ? 'bg-red-500' : prioridad === 'MEDIA' ? 'bg-amber-400' : 'bg-gray-300';
                return (
                  <div key={sol.id} className="card-hover flex items-center gap-4" onClick={() => navigate(`/mis-solicitudes?expand=${sol.id}`)}>
                    <div className="hidden sm:flex w-10 h-10 bg-gray-100 rounded-xl items-center justify-center text-xs font-bold text-gray-500 relative">
                      {sol.id.split('-')[1]}
                      {esEquipo() && <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${prioridadColor}`} title={sol.prioridad} />}
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
                            <span className="text-xs text-gray-500">{sol.solicitante?.nombre}</span>
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
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
