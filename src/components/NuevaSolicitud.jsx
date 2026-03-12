import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, apiUpload } from '../services/api';
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  ClipboardList,
  Camera,
  Palette,
  Award,
  FolderOpen,
  Radio,
  Clock,
  Info,
  Upload,
  File,
  X,
} from 'lucide-react';

const iconosTipo = { ClipboardList, Camera, Palette, Award, FolderOpen, Radio };

const coloresTarjeta = {
  blue: 'hover:border-blue-400 hover:bg-blue-50',
  purple: 'hover:border-purple-400 hover:bg-purple-50',
  pink: 'hover:border-pink-400 hover:bg-pink-50',
  amber: 'hover:border-amber-400 hover:bg-amber-50',
  emerald: 'hover:border-emerald-400 hover:bg-emerald-50',
  red: 'hover:border-red-400 hover:bg-red-50',
};

const coloresActivo = {
  blue: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
  purple: 'border-purple-500 bg-purple-50 ring-2 ring-purple-200',
  pink: 'border-pink-500 bg-pink-50 ring-2 ring-pink-200',
  amber: 'border-amber-500 bg-amber-50 ring-2 ring-amber-200',
  emerald: 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200',
  red: 'border-red-500 bg-red-50 ring-2 ring-red-200',
};

const coloresIcono = {
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  pink: 'text-pink-600',
  amber: 'text-amber-600',
  emerald: 'text-emerald-600',
  red: 'text-red-600',
};

const coloresTiempo = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  pink: 'bg-pink-50 border-pink-200 text-pink-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  red: 'bg-red-50 border-red-200 text-red-700',
};

export default function NuevaSolicitud() {
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [tipoSeleccionado, setTipoSeleccionado] = useState(location.state?.tipo || null);
  const [formData, setFormData] = useState({});
  const [enviado, setEnviado] = useState(false);
  const [idGenerado, setIdGenerado] = useState('');
  const [tipos, setTipos] = useState([]);
  const [camposSolicitud, setCamposSolicitud] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [archivoFile, setArchivoFile] = useState(null);

  useEffect(() => {
    setFormData({});
    setArchivoFile(null);
  }, [tipoSeleccionado]);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const tiposRes = await api.get('/tipos');
        const tiposData = Array.isArray(tiposRes) ? tiposRes : [];
        setTipos(tiposData);

        const camposMap = {};
        for (const tipo of tiposData) {
          try {
            const campos = await api.get(`/tipos/${tipo.id}/campos`);
            camposMap[tipo.id] = Array.isArray(campos) ? campos : [];
          } catch (e) {
            camposMap[tipo.id] = [];
          }
        }
        setCamposSolicitud(camposMap);
      } catch (error) {
        console.error('Error fetching tipos:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTipos();
  }, []);

  const handleChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (tipoSeleccionado === 'radio') {
      navigate('/radio');
      return;
    }

    setEnviando(true);
    try {
      let body;
      if (archivoFile) {
        body = new FormData();
        body.append('tipoId', tipoSeleccionado);
        body.append('titulo', formData.titulo || formData.evento_actividad || 'Sin título');
        body.append('descripcion', formData.descripcion || formData.objetivo || '');
        body.append('datos', JSON.stringify({ ...formData }));
        body.append('archivo', archivoFile);

        const result = await apiUpload('/solicitudes', body);
        setIdGenerado(result.id);
      } else {
        const result = await api.post('/solicitudes', {
          tipoId: tipoSeleccionado,
          titulo: formData.titulo || formData.evento_actividad || 'Sin título',
          descripcion: formData.descripcion || formData.objetivo || '',
          datos: { ...formData },
        });
        setIdGenerado(result.id);
      }

      setEnviado(true);
    } catch (error) {
      alert(error.data?.error || error.message || 'Error al enviar solicitud');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    const tipo = tipos.find((t) => t.id === tipoSeleccionado);
    return (
      <div className="max-w-lg mx-auto mt-8 sm:mt-12 text-center px-4 sm:px-0">
        <div className="card p-6 sm:p-10">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Solicitud enviada!</h2>
          <p className="text-gray-500 mb-2">
            Tu solicitud ha sido registrada exitosamente.
          </p>
          <p className="text-lg font-semibold text-blue-600 mb-4">
            Número de ticket: {idGenerado}
          </p>

          {/* Tiempo estimado de entrega */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm mb-6 ${coloresTiempo[tipo?.color] || 'bg-gray-50 border-gray-200 text-gray-700'}`}>
            <Clock className="w-4 h-4" />
            <span className="font-medium">Tiempo estimado: {tipo?.tiempoEntrega}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/mis-solicitudes')} className="btn-primary">
              Ver mis solicitudes
            </button>
            <button
              onClick={() => {
                setEnviado(false);
                setTipoSeleccionado(null);
                setFormData({});
                setArchivoFile(null);
              }}
              className="btn-secondary"
            >
              Crear otra
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {tipoSeleccionado && (
          <button
            onClick={() => setTipoSeleccionado(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva solicitud</h1>
          <p className="text-gray-500 mt-1">
            {tipoSeleccionado
              ? 'Completa los datos de tu solicitud'
              : '¿Qué tipo de solicitud necesitas?'}
          </p>
        </div>
      </div>

      {/* Paso 1: Seleccionar tipo */}
      {!tipoSeleccionado && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tipos.map((tipo) => {
            const Icon = iconosTipo[tipo.icono];
            return (
              <button
                key={tipo.id}
                onClick={() => setTipoSeleccionado(tipo.id)}
                className={`card text-left border-2 border-transparent transition-all duration-200 ${coloresTarjeta[tipo.color]}`}
              >
                <Icon className={`w-8 h-8 mb-3 ${coloresIcono[tipo.color]}`} />
                <h3 className="font-semibold text-gray-900 text-sm">{tipo.nombre}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-3">{tipo.descripcion}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{tipo.tiempoEntrega}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Paso 2: Formulario según tipo */}
      {tipoSeleccionado && tipoSeleccionado !== 'radio' && (
        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Tipo seleccionado */}
          {(() => {
            const tipo = tipos.find((t) => t.id === tipoSeleccionado);
            const Icon = iconosTipo[tipo.icono];
            return (
              <>
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${coloresActivo[tipo.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{tipo.nombre}</p>
                    <p className="text-xs text-gray-500">{tipo.descripcion}</p>
                  </div>
                </div>

                {/* Aviso de tiempo de entrega */}
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${coloresTiempo[tipo.color]}`}>
                  <Info className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Tiempo estimado de entrega: {tipo.tiempoEntrega}
                    </p>
                    <p className="text-xs mt-1 opacity-80">{tipo.tiempoDetalle}</p>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Campos dinámicos */}
          {camposSolicitud[tipoSeleccionado]?.map((campo) => (
            <div key={campo.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {campo.label}
                {campo.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {campo.type === 'textarea' ? (
                <textarea
                  value={formData[campo.name] || ''}
                  onChange={(e) => handleChange(campo.name, e.target.value)}
                  className="input-field min-h-[100px] resize-y"
                  required={campo.required}
                  placeholder="Escribe aquí..."
                />
              ) : campo.type === 'select' ? (
                <select
                  value={formData[campo.name] || ''}
                  onChange={(e) => handleChange(campo.name, e.target.value)}
                  className="input-field"
                  required={campo.required}
                >
                  <option value="">Seleccionar...</option>
                  {campo.opciones.map((op) => (
                    <option key={op} value={op}>{op}</option>
                  ))}
                </select>
              ) : campo.type === 'file' ? (
                <div>
                  {campo.ayuda && (
                    <p className="text-xs text-gray-400 mb-2">{campo.ayuda}</p>
                  )}
                  {formData[campo.name] ? (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <File className="w-5 h-5 text-blue-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 truncate">{formData[campo.name]}</p>
                        <p className="text-xs text-blue-500">Archivo seleccionado</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleChange(campo.name, '');
                          setArchivoFile(null);
                        }}
                        className="p-1 hover:bg-blue-100 rounded-lg text-blue-400 hover:text-blue-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all duration-200">
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500 font-medium">
                        Haz clic para seleccionar un archivo
                      </span>
                      <span className="text-xs text-gray-400">
                        Excel (.xlsx, .xls), CSV o PDF
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.csv,.pdf"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleChange(campo.name, file.name);
                            setArchivoFile(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              ) : (
                <input
                  type={campo.type}
                  value={formData[campo.name] || ''}
                  onChange={(e) => handleChange(campo.name, e.target.value)}
                  className="input-field"
                  required={campo.required}
                  placeholder={campo.type === 'text' ? 'Escribe aquí...' : ''}
                />
              )}
            </div>
          ))}

          {/* Botón enviar */}
          <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
            <button type="submit" disabled={enviando} className="btn-primary flex items-center gap-2 disabled:opacity-50">
              <Send className="w-4 h-4" />
              {enviando ? 'Enviando...' : 'Enviar solicitud'}
            </button>
            <button
              type="button"
              onClick={() => setTipoSeleccionado(null)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Redirigir a radio */}
      {tipoSeleccionado === 'radio' && (
        <div className="card text-center py-10">
          <Radio className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Reservar espacio en Radio IUDC
          </h3>
          <p className="text-gray-500 mb-6">
            Serás redirigido a la parrilla de programación para seleccionar un horario disponible.
          </p>
          <button onClick={() => navigate('/radio')} className="btn-primary">
            Ir a la parrilla de radio
          </button>
        </div>
      )}
    </div>
  );
}
