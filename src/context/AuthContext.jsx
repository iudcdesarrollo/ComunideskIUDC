import { createContext, useContext, useState, useEffect } from 'react';
import {
  USUARIOS,
  obtenerUsuariosRegistrados,
  guardarUsuarioRegistrado,
  generarIdUsuario,
} from '../data/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardado = localStorage.getItem('comunidesk_usuario');
    if (guardado) {
      setUsuario(JSON.parse(guardado));
    }
    setCargando(false);
  }, []);

  const iniciarSesion = (email, password) => {
    // Buscar en usuarios predefinidos
    let user = USUARIOS.find(
      (u) => u.email === email && u.password === password
    );

    // Buscar en usuarios registrados
    if (!user) {
      const registrados = obtenerUsuariosRegistrados();
      user = registrados.find(
        (u) => u.email === email && u.password === password
      );
    }

    if (user) {
      const { password: _, ...userData } = user;
      setUsuario(userData);
      localStorage.setItem('comunidesk_usuario', JSON.stringify(userData));
      return { exito: true };
    }
    return { exito: false, mensaje: 'Correo o contraseña incorrectos' };
  };

  const registrarUsuario = (email, nombre, cargo, password) => {
    // Verificar si el correo ya existe en usuarios predefinidos
    if (USUARIOS.find((u) => u.email === email)) {
      return { exito: false, mensaje: 'Este correo ya está registrado en el sistema' };
    }

    // Verificar si el correo ya existe en usuarios registrados
    const registrados = obtenerUsuariosRegistrados();
    if (registrados.find((u) => u.email === email)) {
      return { exito: false, mensaje: 'Este correo ya está registrado' };
    }

    const nuevoUsuario = {
      id: generarIdUsuario(),
      nombre,
      email,
      password,
      rol: 'solicitante',
      cargo,
    };

    guardarUsuarioRegistrado(nuevoUsuario);

    // Iniciar sesión automáticamente tras el registro
    const { password: _, ...userData } = nuevoUsuario;
    setUsuario(userData);
    localStorage.setItem('comunidesk_usuario', JSON.stringify(userData));

    return { exito: true };
  };

  const cerrarSesion = () => {
    setUsuario(null);
    localStorage.removeItem('comunidesk_usuario');
  };

  const esAdmin = () => usuario?.rol === 'admin';
  const esDirector = () => usuario?.rol === 'director';
  const esEquipo = () => usuario?.rol === 'equipo';
  const esSolicitante = () => usuario?.rol === 'solicitante';
  const puedeVerUrgentes = () => esAdmin() || esDirector();
  const puedeGestionarSolicitudes = () => esAdmin() || esEquipo();

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
