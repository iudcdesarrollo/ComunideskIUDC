import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Radio, Eye, EyeOff, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { USUARIOS } from '../data/mockData';

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

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!validarDominio(email)) {
      setError('Ingresa un correo válido con dominio (ejemplo: nombre@iudc.edu.co)');
      return;
    }

    setCargando(true);
    setTimeout(() => {
      const resultado = iniciarSesion(email, password);
      if (!resultado.exito) {
        setError(resultado.mensaje);
      }
      setCargando(false);
    }, 500);
  };

  const handleRegistro = (e) => {
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
    setTimeout(() => {
      const resultado = registrarUsuario(email, nombre.trim(), cargo.trim(), password);
      if (!resultado.exito) {
        setError(resultado.mensaje);
      }
      setCargando(false);
    }, 500);
  };

  const seleccionarDemo = (user) => {
    setModo('login');
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
    setEmail('');
    setPassword('');
    setNombre('');
    setCargo('');
  };

  const rolesDemo = [
    { ...USUARIOS[0], etiqueta: 'Super Admin' },
    { ...USUARIOS[2], etiqueta: 'Equipo' },
    { ...USUARIOS[6], etiqueta: 'Solicitante' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center p-4">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@iudc.edu.co"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico <span className="text-red-500">*</span>
                </label>
                <input
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ejemplo: Prof. Juan Pérez"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Cargo o área <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ejemplo: Docente - Facultad de Ingeniería"
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
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

          {/* Acceso rápido demo */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3 uppercase tracking-wider font-medium">
              Acceso rápido (demostración)
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {rolesDemo.map((user) => (
                <button
                  key={user.id}
                  onClick={() => seleccionarDemo(user)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-lg text-xs font-medium text-gray-600 transition-all duration-200"
                >
                  {user.etiqueta}
                </button>
              ))}
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
