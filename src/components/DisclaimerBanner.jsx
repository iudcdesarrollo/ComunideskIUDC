import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

// El banner se oculta automáticamente después del 19 de marzo de 2026 a las 14:00
const EXPIRA = new Date('2026-03-19T14:00:00');
const STORAGE_KEY = 'disclaimer_cerrado_20260318';

export default function DisclaimerBanner() {
  const [cerrado, setCerrado] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const ahora = new Date();
  if (ahora >= EXPIRA || cerrado) return null;

  const handleCerrar = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setCerrado(true);
  };

  return (
    <div className="w-full bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800">
            Aviso del Área de Comunicaciones — {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">
            Hoy nuestro equipo se encuentra adelantando una jornada institucional de gran envergadura.
            Continuamos recibiendo todas las solicitudes con la misma atención de siempre;
            sin embargo, su gestión y seguimiento se retomarán a partir del día de mañana.
            Agradecemos tu comprensión y paciencia — ¡tu solicitud es importante para nosotros!
          </p>
        </div>
        <button
          onClick={handleCerrar}
          className="shrink-0 text-amber-500 hover:text-amber-700 transition-colors mt-0.5"
          title="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
