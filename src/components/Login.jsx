import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio, Eye, EyeOff, AlertCircle, UserPlus, LogIn, Monitor, Users, Sparkles, Clock } from 'lucide-react';
import DisclaimerBanner from './DisclaimerBanner';

export default function Login() {
  const { iniciarSesion, registrarUsuario } = useAuth();
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargo, setCargo] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const validarDominio = (correo) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(correo);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarDominio(email)) {
      setError('Ingresa un correo válido con dominio (ejemplo: nombre@iudc.edu.co)');
      return;
    }

    setCargando(true);
    const resultado = await iniciarSesion(email, password);
    if (!resultado.exito) {
      setError(resultado.mensaje);
    }
    setCargando(false);
  };

  const handleRegistro = async (e) => {
    e.preventDefault();
    setError('');

    if (!validarDominio(email)) {
      setError('Ingresa un correo válido con dominio (ejemplo: nombre@iudc.edu.co)');
      return;
    }

    if (!nombre.trim()) {
      setError('Ingresa tu nombre completo');
      return;
    }

    if (!cargo.trim()) {
      setError('Ingresa tu cargo o área');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    const resultado = await registrarUsuario(email, nombre.trim(), cargo.trim(), password);
    if (!resultado.exito) {
      setError(resultado.mensaje);
    }
    setCargando(false);
  };


  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
    setEmail('');
    setPassword('');
    setNombre('');
    setCargo('');
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mb-4">
        <DisclaimerBanner />
      </div>
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl mb-4">
            <Radio className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">ComuniDesk</h1>
          <p className="text-blue-200 mt-1">Universitaria de Colombia - IUDC</p>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Tabs */}
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => cambiarModo('login')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                modo === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => cambiarModo('registro')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                modo === 'registro'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Crear cuenta
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Formulario de inicio de sesión */}
          {modo === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@iudc.edu.co"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="input-field pr-11"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <title>Cargando</title>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Ingresando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿No tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => cambiarModo('registro')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Regístrate aquí
                </button>
              </p>
            </form>
          )}

          {/* Formulario de registro */}
          {modo === 'registro' && (
            <form onSubmit={handleRegistro} className="space-y-4">
              <div>
                <label htmlFor="registro-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  id="registro-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@iudc.edu.co"
                  className="input-field"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Usa tu correo institucional con dominio</p>
              </div>

              <div>
                <label htmlFor="registro-nombre" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  id="registro-nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ejemplo: Prof. Juan Pérez"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="registro-cargo" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cargo o área <span className="text-red-500">*</span>
                </label>
                <input
                  id="registro-cargo"
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ejemplo: Docente - Facultad de Ingeniería"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label htmlFor="registro-password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="registro-password"
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="input-field pr-11"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword(!mostrarPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cargando ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <title>Cargando</title>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Registrando...
                  </span>
                ) : (
                  'Crear cuenta'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <button
                  type="button"
                  onClick={() => cambiarModo('login')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Inicia sesión
                </button>
              </p>
            </form>
          )}

        </div>

        {/* ── Banner Valle del Software · IA Nocturna ── */}
        <div className="mt-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 p-5 sm:p-6 shadow-xl">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col sm:flex-row items-start gap-4">
            {/* Icono izquierdo */}
            <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
              <Monitor className="w-6 h-6 text-white" />
            </div>

            {/* Contenido */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-400 text-yellow-900 uppercase tracking-wide">
                  Proximamente
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/20 text-white uppercase tracking-wide">
                  Jornada Nocturna
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight">
                Valle del Software · IA Nocturna
              </h3>
              <p className="text-purple-200 text-sm mt-1.5 leading-relaxed">
                Muy pronto abriremos nuevos espacios de capacitacion en IA para los estudiantes de la jornada nocturna. Agenda tu equipo, reserva tu horario y trabaja con inteligencia artificial.
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                  <Clock className="w-3 h-3" />
                  Franja nocturna
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                  <Users className="w-3 h-3" />
                  Capacitaciones con docentes
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/15 text-white">
                  <Sparkles className="w-3 h-3" />
                  Herramientas IA
                </span>
              </div>

              {/* Botón */}
              <a
                href="/login"
                onClick={(e) => { e.preventDefault(); cambiarModo('registro'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-semibold text-sm rounded-xl transition-all hover:shadow-lg hover:shadow-yellow-400/30 active:scale-95"
              >
                <Users className="w-4 h-4" />
                Quiero inscribirme
              </a>
            </div>

            {/* Icono IA derecho (solo desktop) */}
            <div className="hidden sm:flex w-14 h-14 bg-white/15 backdrop-blur-sm rounded-2xl items-center justify-center shrink-0">
              <Sparkles className="w-7 h-7 text-yellow-300" />
              <span className="absolute -bottom-0.5 text-[10px] font-bold text-white/70">IA</span>
            </div>
          </div>
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          Área de Comunicaciones - IUDC © 2026
        </p>
      </div>
    </div>
  );
}
