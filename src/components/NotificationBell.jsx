import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import api from '../services/api.js';

const TIPO_COLORES = {
  solicitud_estado: 'bg-blue-500',
  solicitud_asignada: 'bg-green-500',
  radio_aprobada: 'bg-emerald-500',
  radio_rechazada: 'bg-red-500',
  urgente_nuevo: 'bg-amber-500',
};

function tiempoRelativo(fecha) {
  const ahora = new Date();
  const diff = ahora - new Date(fecha);
  const minutos = Math.floor(diff / 60000);
  const horas = Math.floor(diff / 3600000);
  const dias = Math.floor(diff / 86400000);

  if (minutos < 1) return 'Ahora';
  if (minutos < 60) return `Hace ${minutos} min`;
  if (horas < 24) return `Hace ${horas}h`;
  if (dias === 1) return 'Ayer';
  return `Hace ${dias} días`;
}

export default function NotificationBell() {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(false);
  const ref = useRef(null);

  const fetchNoLeidas = useCallback(async () => {
    try {
      const data = await api.get('/notificaciones/no-leidas/count');
      setNoLeidas(data.count);
    } catch {
      // Silently fail — don't break UI
    }
  }, []);

  const fetchNotificaciones = useCallback(async () => {
    setCargando(true);
    try {
      const data = await api.get('/notificaciones');
      setNotificaciones(data.data);
    } catch {
      // Silently fail
    } finally {
      setCargando(false);
    }
  }, []);

  // Poll unread count every 30s
  useEffect(() => {
    fetchNoLeidas();
    const interval = setInterval(fetchNoLeidas, 30000);
    return () => clearInterval(interval);
  }, [fetchNoLeidas]);

  // Fetch full list when dropdown opens
  useEffect(() => {
    if (abierto) {
      fetchNotificaciones();
    }
  }, [abierto, fetchNotificaciones]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const marcarLeida = async (id) => {
    try {
      await api.patch(`/notificaciones/${id}/leer`);
      setNotificaciones((prev) =>
        prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
      );
      setNoLeidas((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.patch('/notificaciones/leer-todas');
      setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
      setNoLeidas(0);
    } catch {
      // Silently fail
    }
  };

  const eliminar = async (id) => {
    try {
      const notif = notificaciones.find((n) => n.id === id);
      await api.delete(`/notificaciones/${id}`);
      setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      if (notif && !notif.leida) {
        setNoLeidas((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // Silently fail
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button
                  onClick={marcarTodasLeidas}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Leer todas
                </button>
              )}
              <button
                onClick={() => setAbierto(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-96 overflow-y-auto">
            {cargando ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Cargando...
              </div>
            ) : notificaciones.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No tienes notificaciones</p>
              </div>
            ) : (
              notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                    !notif.leida ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {/* Color dot */}
                  <div className="pt-1.5 flex-shrink-0">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        TIPO_COLORES[notif.tipo] || 'bg-gray-400'
                      }`}
                    />
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => !notif.leida && marcarLeida(notif.id)}
                  >
                    <p className={`text-sm ${!notif.leida ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notif.titulo}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                      {notif.mensaje}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {tiempoRelativo(notif.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.leida && (
                      <button
                        onClick={() => marcarLeida(notif.id)}
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                        title="Marcar como leída"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-500" />
                      </button>
                    )}
                    <button
                      onClick={() => eliminar(notif.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
