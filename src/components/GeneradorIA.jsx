import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Sparkles,
  Wand2,
  Download,
  RefreshCw,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Smartphone,
  Monitor,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Palette,
  Camera,
  Paintbrush,
  X,
} from 'lucide-react';

const ASPECT_RATIOS = [
  { value: 'square_1_1', label: 'Cuadrado', desc: '1:1', icon: Square },
  { value: 'classic_4_3', label: 'Clasico', desc: '4:3', icon: RectangleHorizontal },
  { value: 'widescreen_16_9', label: 'Panoramico', desc: '16:9', icon: Monitor },
  { value: 'traditional_3_4', label: 'Vertical', desc: '3:4', icon: RectangleVertical },
  { value: 'social_story_9_16', label: 'Historia', desc: '9:16', icon: Smartphone },
  { value: 'standard_3_2', label: 'Estandar', desc: '3:2', icon: RectangleHorizontal },
];

const MODELOS = [
  { value: 'realism', label: 'Realismo', desc: 'Fotos hiperrealistas', icon: Camera },
  { value: 'fluid', label: 'Fluido', desc: 'Arte digital creativo', icon: Paintbrush },
  { value: 'zen', label: 'Zen', desc: 'Minimalista y limpio', icon: Palette },
  { value: 'flexible', label: 'Flexible', desc: 'Versatil para todo', icon: Sparkles },
];

const RESOLUCIONES = [
  { value: '1k', label: '1K', desc: 'Rapido' },
  { value: '2k', label: '2K', desc: 'Recomendado' },
  { value: '4k', label: '4K', desc: 'Alta calidad' },
];

const SUGERENCIAS = [
  'Banner para evento universitario con colores azul y blanco, estilo profesional',
  'Poster para semana cultural, diseno moderno y colorido',
  'Imagen para redes sociales sobre inscripciones abiertas',
  'Fondo para presentacion de ingenieria con tecnologia',
  'Flyer para evento deportivo universitario, dinamico y juvenil',
  'Diseno para certificado con bordes dorados y elegante',
];

export default function GeneradorIA() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('square_1_1');
  const [modelo, setModelo] = useState('realism');
  const [resolucion, setResolucion] = useState('2k');
  const [generando, setGenerando] = useState(false);
  const [imagenes, setImagenes] = useState([]);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const generarImagen = async () => {
    if (!prompt.trim() || prompt.trim().length < 5) {
      setError('Describe la imagen que quieres (minimo 5 caracteres)');
      return;
    }

    setGenerando(true);
    setError('');
    setImagenes([]);
    setImagenSeleccionada(null);
    setStatus('Enviando solicitud a la IA...');

    try {
      const res = await api.post('/freepik/generate', {
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        model: modelo,
        resolution: resolucion,
      });

      const data = res.data || res;

      if (data?.data?.task_id) {
        setStatus('Generando imagen...');
        iniciarPolling(data.data.task_id);
      } else if (data?.data?.generated && data.data.generated.length > 0) {
        setImagenes(data.data.generated);
        setStatus('');
        setGenerando(false);
      } else if (data?.task_id) {
        setStatus('Generando imagen...');
        iniciarPolling(data.task_id);
      } else if (data?.generated && data.generated.length > 0) {
        setImagenes(data.generated);
        setStatus('');
        setGenerando(false);
      } else {
        setError('No se recibio respuesta de la IA');
        setGenerando(false);
      }
    } catch (err) {
      setError(err.data?.error || err.message || 'Error al conectar con Freepik');
      setGenerando(false);
    }
  };

  const iniciarPolling = (id) => {
    let intentos = 0;
    const maxIntentos = 60;

    pollRef.current = setInterval(async () => {
      intentos++;
      if (intentos > maxIntentos) {
        clearInterval(pollRef.current);
        setError('La generacion tardo demasiado. Intenta de nuevo.');
        setGenerando(false);
        return;
      }

      try {
        const res = await api.get(`/freepik/status/${id}`);
        const data = res.data || res;
        const taskData = data?.data || data;

        if (taskData?.status === 'COMPLETED') {
          clearInterval(pollRef.current);
          const imgs = taskData?.generated || [];
          if (imgs.length > 0) {
            setImagenes(imgs);
          } else {
            setError('La IA no devolvio imagenes. Intenta de nuevo.');
          }
          setStatus('');
          setGenerando(false);
        } else if (taskData?.status === 'FAILED') {
          clearInterval(pollRef.current);
          setError('La IA no pudo generar la imagen. Intenta con otra descripcion.');
          setGenerando(false);
        } else {
          setStatus(`Generando imagen... (${intentos * 2}s)`);
        }
      } catch {
        // Seguir intentando
      }
    }, 2000);
  };

  const descargarImagen = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `comunidesk-ia-${Date.now()}.png`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-5 sm:p-6">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Creala tu mismo con IA</h2>
            <p className="text-purple-200 text-sm mt-0.5">Describe lo que necesitas y la inteligencia artificial lo creara al instante</p>
          </div>
        </div>
      </div>

      {/* Prompt */}
      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Describe la imagen que quieres
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ejemplo: Un banner profesional para evento de tecnologia en universidad, con colores azul y blanco, estilo moderno y limpio..."
            className="input-field min-h-[100px] resize-y"
          />
          <p className="text-xs text-gray-400 mt-1.5">Tip: Mientras mas detalles des, mejor sera el resultado (colores, estilo, texto, elementos)</p>
        </div>

        {/* Sugerencias */}
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Sugerencias rapidas:</p>
          <div className="flex flex-wrap gap-2">
            {SUGERENCIAS.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPrompt(s)}
                className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-colors truncate max-w-[250px]"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Configuracion */}
      <div className="card space-y-5">
        {/* Modelo */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2.5">Estilo de imagen</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MODELOS.map(m => {
              const MIcon = m.icon;
              const activo = modelo === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setModelo(m.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    activo
                      ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <MIcon className={`w-5 h-5 ${activo ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <div className="text-center">
                    <p className={`text-xs font-medium ${activo ? 'text-indigo-900' : 'text-gray-700'}`}>{m.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{m.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Formato */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2.5">Formato</label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ASPECT_RATIOS.map(ar => {
              const ARIcon = ar.icon;
              const activo = aspectRatio === ar.value;
              return (
                <button
                  key={ar.value}
                  type="button"
                  onClick={() => setAspectRatio(ar.value)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all ${
                    activo
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <ARIcon className={`w-4 h-4 ${activo ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <p className={`text-[10px] font-medium ${activo ? 'text-indigo-700' : 'text-gray-500'}`}>{ar.label}</p>
                  <p className="text-[9px] text-gray-400">{ar.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resolucion */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2.5">Resolucion</label>
          <div className="flex gap-2">
            {RESOLUCIONES.map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setResolucion(r.value)}
                className={`flex-1 py-2 px-3 rounded-xl border-2 text-center transition-all ${
                  resolucion === r.value
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <p className="text-sm font-medium">{r.label}</p>
                <p className="text-[10px] text-gray-400">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Boton generar */}
        <button
          onClick={generarImagen}
          disabled={generando || !prompt.trim()}
          className="w-full sm:w-auto btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 flex items-center justify-center gap-2 py-3 px-8 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generando ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {status || 'Generando...'}
            </>
          ) : (
            <>
              <Wand2 className="w-5 h-5" />
              Generar imagen con IA
            </>
          )}
        </button>
      </div>

      {/* Cargando */}
      {generando && imagenes.length === 0 && (
        <div className="card text-center py-12">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-indigo-500 animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-semibold text-gray-900">La IA esta creando tu imagen</p>
          <p className="text-sm text-gray-500 mt-1">{status || 'Esto puede tomar unos segundos...'}</p>
          <div className="w-48 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse" style={{ width: '70%' }} />
          </div>
        </div>
      )}

      {/* Resultado */}
      {imagenes.length > 0 && (
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Imagen generada</h3>
            </div>
            <button
              onClick={() => { setImagenes([]); setError(''); }}
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Generar otra
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {imagenes.map((img, i) => (
              <div key={i} className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                <img
                  src={img}
                  alt={`Imagen generada ${i + 1}`}
                  className="w-full h-auto cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => setImagenSeleccionada(img)}
                />
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => descargarImagen(img)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-gray-800 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 text-center">
            ¿No te convencio? Ajusta la descripcion y genera de nuevo. Tambien puedes solicitar la pieza al equipo de comunicaciones.
          </p>
        </div>
      )}

      {/* Modal imagen ampliada */}
      {imagenSeleccionada && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setImagenSeleccionada(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setImagenSeleccionada(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={imagenSeleccionada}
              alt="Imagen ampliada"
              className="w-full h-auto max-h-[85vh] object-contain rounded-xl"
            />
            <div className="flex justify-center mt-3">
              <button
                onClick={() => descargarImagen(imagenSeleccionada)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-800 rounded-xl font-medium hover:bg-gray-100 transition-colors"
              >
                <Download className="w-4 h-4" />
                Descargar imagen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
