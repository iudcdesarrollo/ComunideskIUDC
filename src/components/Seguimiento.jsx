import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  BarChart3, FileText, Clock, CheckCircle2, XCircle,
  TrendingUp, Users, AlertTriangle, Target, Activity,
  Filter, ChevronUp, ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, RadialBarChart, RadialBar,
  ComposedChart, Line,
} from 'recharts';

const COLORES_ESTADO = { pendiente: '#f59e0b', en_proceso: '#3b82f6', completada: '#10b981', rechazada: '#ef4444' };
const PALETA = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#f97316'];

export default function Seguimiento() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tablaFiltro, setTablaFiltro] = useState('todos');
  const [tablaOrden, setTablaOrden] = useState({ campo: 'fecha', dir: 'desc' });

  const fetchData = useCallback(async () => {
    try {
      const solRes = await api.get('/solicitudes?limit=1000');
      setSolicitudes(Array.isArray(solRes) ? solRes : solRes.data || []);
    } catch (error) {
      console.error('Error fetching solicitudes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // ── Métricas calculadas desde solicitudes ────────────────
  const total       = solicitudes.length;
  const pendientes  = solicitudes.filter(s => (s.estado||'').toUpperCase() === 'PENDIENTE').length;
  const enProceso   = solicitudes.filter(s => (s.estado||'').toUpperCase() === 'EN_PROCESO').length;
  const completadas = solicitudes.filter(s => (s.estado||'').toUpperCase() === 'COMPLETADA').length;
  const rechazadas  = solicitudes.filter(s => (s.estado||'').toUpperCase() === 'RECHAZADA').length;
  const tasaCompletado = total > 0 ? Math.round((completadas / total) * 100) : 0;
  const altaCount  = solicitudes.filter(s => (s.prioridad||'').toLowerCase() === 'alta').length;
  const mediaCount = solicitudes.filter(s => (s.prioridad||'').toLowerCase() === 'media').length;
  const bajaCount  = solicitudes.filter(s => (s.prioridad||'').toLowerCase() === 'baja').length;
  const stats = { total, pendientes, enProceso, completadas, rechazadas, tasaCompletado,
    porPrioridad: { alta: altaCount, media: mediaCount, baja: bajaCount } };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const tt = {
    contentStyle: { borderRadius: '10px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: '11px', padding: '8px 12px' },
  };

  // ── Datos para gráficas ──────────────────────────────────────

  const dataEstados = [
    { name: 'Pendientes',  value: stats.pendientes,  color: '#f59e0b' },
    { name: 'En proceso',  value: stats.enProceso,   color: '#3b82f6' },
    { name: 'Completadas', value: stats.completadas, color: '#10b981' },
    { name: 'Rechazadas',  value: stats.rechazadas,  color: '#ef4444' },
  ].filter(d => d.value > 0);

  const dataPrioridad = [
    { name: 'Alta',  value: stats.porPrioridad.alta,  fill: '#ef4444' },
    { name: 'Media', value: stats.porPrioridad.media, fill: '#f59e0b' },
    { name: 'Baja',  value: stats.porPrioridad.baja,  fill: '#9ca3af' },
  ];

  // Por tipo — calculado desde solicitudes
  const porTipoObj = solicitudes.reduce((acc, s) => {
    const n = s.tipoNombre || s.tipoSolicitud?.nombre || s.tipo?.nombre || s.tipoId || 'Otro';
    acc[n] = (acc[n] || 0) + 1;
    return acc;
  }, {});
  const dataTipo = Object.entries(porTipoObj)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], i) => ({ name: name.length > 16 ? name.slice(0, 14) + '…' : name, value, fill: PALETA[i % PALETA.length] }));

  // Tendencia 12 meses
  const now = new Date();
  const dataMeses = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      mes: d.toLocaleString('es-CO', { month: 'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      Pendientes: 0, EnProceso: 0, Completadas: 0,
    };
  });
  solicitudes.forEach(s => {
    const fecha = s.createdAt || s.fechaCreacion || '';
    if (!fecha) return;
    const key = fecha.slice(0, 7);
    const mes = dataMeses.find(m => m.key === key);
    if (!mes) return;
    const est = (s.estado||'').toUpperCase();
    if (est === 'PENDIENTE') mes.Pendientes++;
    else if (est === 'EN_PROCESO') mes.EnProceso++;
    else if (est === 'COMPLETADA') mes.Completadas++;
  });

  // Carga del equipo — calculada desde solicitudes
  const asignacionesObj = solicitudes.filter(s => s.asignadoA).reduce((acc, s) => {
    const n = s.asignadoA?.nombre || 'Sin nombre';
    if (!acc[n]) acc[n] = { Asignadas: 0, Completadas: 0, EnProceso: 0 };
    acc[n].Asignadas++;
    const est2 = (s.estado||'').toUpperCase();
    if (est2 === 'COMPLETADA') acc[n].Completadas++;
    else if (est2 === 'EN_PROCESO') acc[n].EnProceso++;
    return acc;
  }, {});
  const dataEquipo = Object.entries(asignacionesObj)
    .map(([nombre, d]) => ({
      nombre,
      Asignadas: d.Asignadas,
      Completadas: d.Completadas,
      EnProceso: d.EnProceso,
      tasa: d.Asignadas > 0 ? Math.round((d.Completadas / d.Asignadas) * 100) : 0,
    }))
    .sort((a, b) => b.Asignadas - a.Asignadas);

  // Radial para tasa de completitud
  const dataRadial = [{ name: 'Completitud', value: stats.tasaCompletado, fill: '#10b981' }];

  // Tabla filtrada y ordenada
  const solFiltradas = solicitudes
    .filter(s => tablaFiltro === 'todos' || (s.estado||'').toUpperCase() === tablaFiltro.toUpperCase())
    .sort((a, b) => {
      const dir = tablaOrden.dir === 'asc' ? 1 : -1;
      if (tablaOrden.campo === 'fecha') {
        return ((a.createdAt || '') > (b.createdAt || '') ? 1 : -1) * dir;
      }
      if (tablaOrden.campo === 'tipo') {
        return ((a.tipoNombre || '') > (b.tipoNombre || '') ? 1 : -1) * dir;
      }
      return 0;
    });

  const ordenar = (campo) => {
    setTablaOrden(prev => ({ campo, dir: prev.campo === campo && prev.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const OrdenIcon = ({ campo }) => tablaOrden.campo === campo
    ? (tablaOrden.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
    : <span className="w-3 h-3" />;

  const estadoBadge = (estado) => {
    const key = (estado||'').toUpperCase();
    const map = { PENDIENTE: 'badge-pendiente', EN_PROCESO: 'badge-en-proceso', COMPLETADA: 'badge-completada', RECHAZADA: 'badge-rechazada' };
    const labels = { PENDIENTE: 'Pendiente', EN_PROCESO: 'En proceso', COMPLETADA: 'Completada', RECHAZADA: 'Rechazada' };
    return <span className={map[key] || 'badge-pendiente'}>{labels[key] || estado}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6">

      {/* ── Encabezado ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            Seguimiento y métricas
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Análisis detallado de todas las solicitudes del sistema</p>
        </div>
        <span className="self-start sm:self-auto text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium whitespace-nowrap">
          {stats.total} tickets totales
        </span>
      </div>

      {/* ── KPI strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total',       value: stats.total,         from: '#eff6ff', to: '#bfdbfe', num: '#1d4ed8', icon: FileText    },
          { label: 'Pendientes',  value: stats.pendientes,    from: '#fffbeb', to: '#fde68a', num: '#b45309', icon: Clock       },
          { label: 'En proceso',  value: stats.enProceso,     from: '#eff6ff', to: '#bfdbfe', num: '#2563eb', icon: TrendingUp  },
          { label: 'Completadas', value: stats.completadas,   from: '#ecfdf5', to: '#a7f3d0', num: '#047857', icon: CheckCircle2 },
          { label: 'Rechazadas',  value: stats.rechazadas,    from: '#fef2f2', to: '#fecaca', num: '#b91c1c', icon: XCircle     },
          { label: 'Completitud', value: `${stats.tasaCompletado}%`, from: '#f5f3ff', to: '#ddd6fe', num: '#5b21b6', icon: Target },
        ].map(({ label, value, from, to, num, icon: Icon }) => (
          <div key={label} style={{ background: `linear-gradient(135deg, ${from}, ${to})` }} className="rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: num }}>{label}</p>
              <Icon className="w-4 h-4 opacity-50" style={{ color: num }} />
            </div>
            <p className="text-2xl font-black" style={{ color: num }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Fila 1: Donut grande + Tendencia 12m ─────── */}
      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">

        {/* Donut estados — grande con centro stats */}
        <div className="md:col-span-1 lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Distribución por estado</h2>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Actual</span>
          </div>
          {dataEstados.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-sm text-gray-400">Sin datos</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={dataEstados} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                    paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {dataEstados.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip {...tt} formatter={(v, n) => [`${v} solicitudes`, n]} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {dataEstados.map(d => (
                  <div key={d.name} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                    <div>
                      <p className="text-xs font-semibold text-gray-700">{d.value}</p>
                      <p className="text-[10px] text-gray-400">{d.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Tendencia 12 meses apilada */}
        <div className="md:col-span-1 lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Tendencia últimos 12 meses</h2>
            <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Por estado</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={dataMeses} margin={{ left: -14, right: 4, top: 4, bottom: 0 }}>
              <defs>
                {[['gP','#f59e0b'],['gE','#3b82f6'],['gC','#10b981']].map(([id, color]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.03} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tt} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="Pendientes"  stroke="#f59e0b" strokeWidth={2} fill="url(#gP)" dot={false} />
              <Area type="monotone" dataKey="EnProceso"   stroke="#3b82f6" strokeWidth={2} fill="url(#gE)" dot={false} name="En proceso" />
              <Area type="monotone" dataKey="Completadas" stroke="#10b981" strokeWidth={2} fill="url(#gC)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Fila 2: Tipo (barras) + Prioridad + Radial completitud ── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Por tipo — barras horizontales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Solicitudes por tipo / área</h2>
          {dataTipo.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-sm text-gray-400">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dataTipo} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={90} axisLine={false} tickLine={false} />
                <Tooltip {...tt} formatter={(v) => [v, 'Solicitudes']} />
                <Bar dataKey="value" name="Solicitudes" radius={[0, 6, 6, 0]}>
                  {dataTipo.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Prioridad — barras verticales */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 text-sm mb-4">Distribución por prioridad</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dataPrioridad} margin={{ left: -10, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tt} formatter={(v) => [v, 'Solicitudes']} />
              <Bar dataKey="value" name="Solicitudes" radius={[6, 6, 0, 0]}>
                {dataPrioridad.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Leyenda detallada */}
          <div className="mt-3 space-y-2">
            {dataPrioridad.map(d => (
              <div key={d.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
                  <span className="text-xs text-gray-600">{d.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-100 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full" style={{ width: `${stats.total > 0 ? (d.value / stats.total) * 100 : 0}%`, backgroundColor: d.fill }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-5 text-right">{d.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasa completitud — radial */}
        <div className="sm:col-span-2 lg:col-span-1 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center justify-center">
          <h2 className="font-semibold text-gray-800 text-sm mb-2 self-start">Tasa de completitud</h2>
          <div className="relative w-full max-w-[200px]">
            <ResponsiveContainer width="100%" height={180}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="65%" outerRadius="90%"
                data={[{ value: stats.tasaCompletado, fill: '#10b981' }, { value: 100 - stats.tasaCompletado, fill: '#f3f4f6' }]}
                startAngle={200} endAngle={-20}>
                <RadialBar dataKey="value" cornerRadius={8} background={false} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-black text-emerald-600">{stats.tasaCompletado}%</p>
              <p className="text-[10px] text-gray-400 font-medium">completitud</p>
            </div>
          </div>
          <div className="w-full mt-3 space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Completadas</span><span className="font-semibold text-emerald-600">{stats.completadas}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>En curso</span><span className="font-semibold text-blue-600">{stats.pendientes + stats.enProceso}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Rechazadas</span><span className="font-semibold text-red-500">{stats.rechazadas}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fila 3: Carga del equipo detallada ──────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-gray-800 text-sm">Rendimiento del equipo</h2>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full ml-auto">{dataEquipo.length} miembro(s)</span>
        </div>

        {dataEquipo.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Sin solicitudes asignadas aún</p>
        ) : (
          <>
            {/* Barras grouped */}
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dataEquipo} margin={{ left: -8, right: 8, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v.split(' ')[0]} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip {...tt} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Asignadas"  name="Asignadas"   radius={[4,4,0,0]} fill="#3b82f6" />
                <Bar dataKey="EnProceso"  name="En proceso"  radius={[4,4,0,0]} fill="#f59e0b" />
                <Bar dataKey="Completadas" name="Completadas" radius={[4,4,0,0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>

            {/* Tabla detalle por miembro */}
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dataEquipo.map(m => (
                <div key={m.nombre} className="bg-gray-50 rounded-xl p-3.5">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
                      {m.nombre.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{m.nombre}</p>
                      <p className="text-[10px] text-gray-400">{m.Asignadas} solicitudes</p>
                    </div>
                    <span className="text-sm font-black text-emerald-600">{m.tasa}%</span>
                  </div>
                  {/* Mini progress */}
                  <div className="space-y-1.5">
                    {[
                      { label: 'Completadas', value: m.Completadas, color: '#10b981' },
                      { label: 'En proceso',  value: m.EnProceso,   color: '#f59e0b' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 w-20 shrink-0">{item.label}</span>
                        <div className="flex-1 bg-white rounded-full h-1.5 border border-gray-200">
                          <div className="h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${m.Asignadas > 0 ? (item.value / m.Asignadas) * 100 : 0}%`, backgroundColor: item.color }} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-600 w-4 text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Tabla de tickets ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400" />
              Todos los tickets
            </h2>
            <span className="text-[10px] text-gray-400">{solFiltradas.length} resultado(s)</span>
          </div>
          {/* Filtro estado — scrollable en móvil */}
          <div className="overflow-x-auto -mx-1 px-1 pb-1">
            <div className="flex items-center gap-2 min-w-max">
              <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              {['todos', 'pendiente', 'en_proceso', 'completada', 'rechazada'].map(f => (
                <button key={f} onClick={() => setTablaFiltro(f)}
                  className={`text-[10px] font-semibold px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    tablaFiltro === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  {f === 'todos' ? 'Todos' : f === 'en_proceso' ? 'En proceso' : f.charAt(0).toUpperCase() + f.slice(1)}
                  {f !== 'todos' && (
                    <span className="ml-1 opacity-70">
                      ({solicitudes.filter(s => (s.estado||'').toUpperCase() === f.toUpperCase()).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Ticket</th>
                <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Título</th>
                <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer select-none"
                  onClick={() => ordenar('tipo')}>
                  <span className="flex items-center gap-1">Tipo <OrdenIcon campo="tipo" /></span>
                </th>
                <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Solicitante</th>
                <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Asignado</th>
                <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Prioridad</th>
                <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3">Estado</th>
                <th className="text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer select-none"
                  onClick={() => ordenar('fecha')}>
                  <span className="flex items-center gap-1">Fecha <OrdenIcon campo="fecha" /></span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {solFiltradas.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-sm text-gray-400">Sin resultados</td></tr>
              ) : solFiltradas.map(sol => (
                <tr key={sol.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{sol.id}</td>
                  <td className="px-4 py-3 text-gray-800 max-w-[180px] truncate font-medium">{sol.titulo}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{sol.tipoNombre || sol.tipoSolicitud?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{sol.solicitante?.nombre || '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    {sol.asignadoA ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-[9px] font-bold text-blue-700">
                          {sol.asignadoA.nombre.charAt(0)}
                        </div>
                        <span className="text-gray-600">{sol.asignadoA.nombre.split(' ')[0]}</span>
                      </div>
                    ) : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      (sol.prioridad || '').toLowerCase() === 'alta'  ? 'bg-red-100 text-red-700' :
                      (sol.prioridad || '').toLowerCase() === 'media' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        (sol.prioridad || '').toLowerCase() === 'alta'  ? 'bg-red-500' :
                        (sol.prioridad || '').toLowerCase() === 'media' ? 'bg-amber-500' :
                        'bg-gray-400'
                      }`} />
                      {sol.prioridad ? sol.prioridad.charAt(0).toUpperCase() + sol.prioridad.slice(1).toLowerCase() : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{estadoBadge(sol.estado)}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {sol.fechaCreacion || (sol.createdAt ? new Date(sol.createdAt).toLocaleDateString('es-ES') : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
