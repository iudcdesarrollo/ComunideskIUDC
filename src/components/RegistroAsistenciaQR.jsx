import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader2, Users, Clock, Calendar, User } from 'lucide-react';

const API_BASE = import.meta.env.PROD ? '' : '';

export default function RegistroAsistenciaQR() {
  const { token } = useParams();
  const [reserva, setReserva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [registrado, setRegistrado] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [form, setForm] = useState({
    nombreCompleto: '',
    cedula: '',
    programa: '',
    semestre: '',
    telefono: '',
  });

  useEffect(() => {
    const cargar = async () => {
      try {
        const resp = await fetch(`/api/valle-ia/qr/${token}`);
        if (!resp.ok) {
          setError('Este código QR no es válido o la reserva ya no está activa.');
          setCargando(false);
          return;
        }
        const data = await resp.json();
        setReserva(data);
      } catch {
        setError('No se pudo conectar con el servidor.');
      }
      setCargando(false);
    };
    cargar();
  }, [token]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.nombreCompleto.trim() || !form.cedula.trim()) return;

    setEnviando(true);
    try {
      const resp = await fetch(`/api/valle-ia/qr/${token}/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await resp.json();
      if (resp.ok) {
        setRegistrado(true);
        setResultado(data);
      } else {
        setError(data.error || 'Error al registrar asistencia');
      }
    } catch {
      setError('No se pudo conectar con el servidor.');
    }
    setEnviando(false);
  };

  // ─── Loading ────────────────────────────────
  if (cargando) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // ─── Error ──────────────────────────────────
  if (error && !reserva) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-800 mb-2">QR no válido</h2>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ─── Registrado exitosamente ────────────────
  if (registrado) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {resultado?.yaExistia ? 'Asistencia confirmada' : 'Registro exitoso'}
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            {resultado?.yaExistia
              ? 'Tu asistencia ha sido confirmada correctamente.'
              : 'Te has registrado y confirmado tu asistencia.'}
          </p>
          <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-1">
            <p><span className="font-medium text-gray-600">Docente:</span> {reserva.nombreDocente}</p>
            <p><span className="font-medium text-gray-600">Horario:</span> {reserva.dia} · {reserva.hora}</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulario ─────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white">
          <h1 className="text-lg font-bold">Valle del Software · IA</h1>
          <p className="text-indigo-100 text-sm mt-1">Registro de asistencia</p>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{reserva.nombreDocente}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{reserva.dia}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{reserva.hora}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{reserva.totalConfirmados} de {reserva.totalRegistrados} confirmados</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={enviar} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
            <input
              type="text"
              value={form.nombreCompleto}
              onChange={e => setForm({ ...form, nombreCompleto: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cédula *</label>
            <input
              type="text"
              value={form.cedula}
              onChange={e => setForm({ ...form, cedula: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Tu número de cédula"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Programa</label>
            <input
              type="text"
              value={form.programa}
              onChange={e => setForm({ ...form, programa: e.target.value })}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Ej: Ingeniería de Sistemas"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semestre</label>
              <input
                type="text"
                value={form.semestre}
                onChange={e => setForm({ ...form, semestre: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Ej: 5to"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={e => setForm({ ...form, telefono: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                placeholder="Opcional"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-xl font-medium text-sm hover:shadow-lg transition-all disabled:opacity-50"
          >
            {enviando ? 'Registrando...' : 'Confirmar asistencia'}
          </button>

          <p className="text-xs text-gray-400 text-center">
            IUDC · Área de Comunicaciones · ComuniDesk
          </p>
        </form>
      </div>
    </div>
  );
}
