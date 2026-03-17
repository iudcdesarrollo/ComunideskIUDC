import { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken, clearAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // On mount: try to restore session via refresh token cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Try to refresh the access token using httpOnly cookie
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshResponse.ok) {
          const { accessToken } = await refreshResponse.json();
          setAccessToken(accessToken);

          // Get user data
          const userData = await api.get('/auth/me');
          setUsuario(userData.user);
        }
      } catch (error) {
        // No valid session — user stays null (not logged in)
        console.log('No active session');
      } finally {
        setCargando(false);
      }
    };

    restoreSession();
  }, []);

  const iniciarSesion = async (email, password) => {
    try {
      const data = await api.post('/auth/login', { email, password });
      setAccessToken(data.accessToken);
      setUsuario(data.user);
      return { exito: true };
    } catch (error) {
      return { exito: false, mensaje: error.data?.error || error.message || 'Error al iniciar sesión' };
    }
  };

  const registrarUsuario = async (email, nombre, cargo, password) => {
    try {
      const data = await api.post('/auth/register', { email, nombre, cargo, password });
      setAccessToken(data.accessToken);
      setUsuario(data.user);
      return { exito: true };
    } catch (error) {
      return { exito: false, mensaje: error.data?.error || error.message || 'Error al registrar' };
    }
  };

  const cerrarSesion = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    }
    clearAccessToken();
    setUsuario(null);
  };

  const esAdmin = () => usuario?.rol === 'admin';
  const esDirector = () => usuario?.rol === 'director';
  const esEquipo = () => usuario?.rol === 'equipo';
  const esSolicitante = () => usuario?.rol === 'solicitante';
  const puedeVerUrgentes = () => esAdmin() || esDirector() || esEquipo();
  const puedeGestionarSolicitudes = () => esAdmin() || esDirector() || esEquipo();

  return (
    <AuthContext.Provider
      value={{
        usuario,
        cargando,
        iniciarSesion,
        registrarUsuario,
        cerrarSesion,
        esAdmin,
        esDirector,
        esEquipo,
        esSolicitante,
        puedeVerUrgentes,
        puedeGestionarSolicitudes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
