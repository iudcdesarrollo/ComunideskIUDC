import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ─── Static field definitions per tipo ─────────────────────

const CAMPOS_SOLICITUD = {
  registro_control: [
    { name: 'titulo', label: '¿Qué necesita?', type: 'text', required: true },
    { name: 'programa_academico', label: 'Programa académico', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción detallada', type: 'textarea', required: true },
    { name: 'fecha_requerida', label: 'Fecha en la que lo necesita', type: 'date', required: true },
  ],
  cubrimiento_eventos: [
    { name: 'titulo', label: 'Nombre del evento', type: 'text', required: true },
    { name: 'fecha_evento', label: 'Fecha del evento', type: 'date', required: true },
    { name: 'hora_inicio', label: 'Hora de inicio', type: 'time', required: true },
    { name: 'hora_fin', label: 'Hora de finalización', type: 'time', required: true },
    { name: 'lugar', label: 'Lugar del evento', type: 'text', required: true },
    { name: 'tipo_cubrimiento', label: 'Tipo de cubrimiento', type: 'select', required: true, opciones: ['Fotográfico', 'Audiovisual', 'Fotográfico y audiovisual', 'Transmisión en vivo'] },
    { name: 'descripcion', label: 'Descripción del evento', type: 'textarea', required: true },
  ],
  piezas_graficas: [
    { name: 'titulo', label: 'Nombre de la pieza', type: 'text', required: true },
    { name: 'tipo_pieza', label: 'Tipo de pieza', type: 'select', required: true, opciones: ['Afiche', 'Banner digital', 'Publicación redes sociales', 'Volante', 'Presentación', 'Otro'] },
    { name: 'descripcion', label: '¿Qué debe incluir la pieza?', type: 'textarea', required: true },
    { name: 'texto_contenido', label: 'Texto que debe llevar', type: 'textarea', required: true },
    { name: 'fecha_requerida', label: 'Fecha en la que lo necesita', type: 'date', required: true },
  ],
  certificados: [
    { name: 'titulo', label: 'Nombre del certificado', type: 'text', required: true },
    { name: 'evento_actividad', label: 'Evento o actividad', type: 'text', required: true },
    { name: 'cantidad', label: 'Cantidad de certificados', type: 'number', required: true },
    { name: 'archivo_datos', label: 'Archivo con los datos de las personas (Excel, CSV o PDF)', type: 'file', required: true, ayuda: 'Sube un archivo con los nombres completos y datos de las personas que recibirán el certificado.' },
    { name: 'descripcion', label: 'Información adicional', type: 'textarea', required: false },
    { name: 'fecha_requerida', label: 'Fecha en la que lo necesita', type: 'date', required: true },
  ],
  proyectos: [
    { name: 'titulo', label: 'Nombre del proyecto', type: 'text', required: true },
    { name: 'objetivo', label: 'Objetivo del proyecto', type: 'textarea', required: true },
    { name: 'descripcion', label: 'Descripción detallada', type: 'textarea', required: true },
    { name: 'fecha_inicio', label: 'Fecha de inicio estimada', type: 'date', required: true },
    { name: 'fecha_fin', label: 'Fecha de entrega estimada', type: 'date', required: true },
  ],
  radio: [],
};

// ─── GET /api/tipos ───────────────────────────────────────

router.get('/', async (req, res, next) => {
  try {
    const tipos = await prisma.tipoSolicitud.findMany();
    res.json(tipos);
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/tipos/:id/campos ────────────────────────────

router.get('/:id/campos', (req, res) => {
  const campos = CAMPOS_SOLICITUD[req.params.id];
  if (!campos) {
    return res.status(404).json({ error: 'Tipo de solicitud no encontrado' });
  }
  res.json(campos);
});

export default router;
