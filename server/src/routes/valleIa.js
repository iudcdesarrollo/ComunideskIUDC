import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import validate from '../middleware/validate.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { crearNotificacion } from '../helpers/notificaciones.js';

const router = Router();
const prisma = new PrismaClient();

// Horario disponible: 9:30 a.m. — 1:00 p.m., Lunes a Jueves
const FRANJAS = [
  { hora: '9:30 a.m.' },
  { hora: '10:00 a.m.' },
  { hora: '10:30 a.m.' },
  { hora: '11:00 a.m.' },
  { hora: '11:30 a.m.' },
  { hora: '12:00 p.m.' },
  { hora: '12:30 p.m.' },
  { hora: '1:00 p.m.' },
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves'];

const asistenciaSchema = z.object({
  reservaId: z.number().int(),
  nombreCompleto: z.string().min(1, 'Nombre completo requerido'),
  cedula: z.string().min(1, 'Cédula requerida'),
  telefono: z.string().min(1, 'Teléfono requerido'),
  programa: z.string().min(1, 'Programa requerido'),
  semestre: z.string().min(1, 'Semestre requerido'),
  nombreProfesor: z.string().min(1, 'Nombre del profesor requerido'),
});

const encuestaSchema = z.object({
  calificacionClase: z.number().int().min(1).max(5),
  calificacionHerramientas: z.number().int().min(1).max(5),
  queMejorar: z.string().max(500).optional(),
});

const reservaSchema = z.object({
  dia:    z.string().min(1),
  hora:   z.string().min(1),
  semana: z.string().min(1),
  formulario: z.object({
    nombre_docente: z.string().min(1, 'Nombre del docente requerido'),
    nombre_proyecto: z.string().min(1, 'Nombre del proyecto requerido'),
  }).passthrough(),
});

// ─── GET /api/valle-ia/config ──────────────────────────
router.get('/config', (req, res) => {
  res.json({ franjas: FRANJAS, dias: DIAS });
});

// ─── GET /api/valle-ia/reservas/pendientes ─────────────
router.get(
  '/reservas/pendientes',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const pendientes = await prisma.reservaValleIA.findMany({
        where: { estado: 'PENDIENTE' },
        include: { solicitante: { select: { id: true, nombre: true } } },
        orderBy: [{ semana: 'asc' }, { dia: 'asc' }, { hora: 'asc' }],
      });
      res.json(pendientes);
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/valle-ia/reservas ────────────────────────
router.get('/reservas', authenticateToken, async (req, res, next) => {
  try {
    const { semana } = req.query;
    const where = semana ? { semana } : {};
    const reservas = await prisma.reservaValleIA.findMany({
      where,
      include: { solicitante: { select: { id: true, nombre: true, cargo: true } } },
      orderBy: [{ semana: 'asc' }, { dia: 'asc' }, { hora: 'asc' }],
    });
    res.json(reservas);
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/valle-ia/reservas/:id ───────────────────
router.get('/reservas/:id', authenticateToken, async (req, res, next) => {
  try {
    const reserva = await prisma.reservaValleIA.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { solicitante: { select: { id: true, nombre: true, cargo: true } } },
    });
    if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json(reserva);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/valle-ia/reservas ──────────────────────
router.post('/reservas', authenticateToken, validate(reservaSchema), async (req, res, next) => {
  try {
    const { dia, hora, semana, formulario } = req.body;

    // Reject reservations for past days
    const hoy = new Date().toISOString().split('T')[0];
    if (dia < hoy) {
      return res.status(400).json({ error: 'No se pueden crear reservas en días pasados' });
    }

    // Check if slot is already taken
    const existente = await prisma.reservaValleIA.findFirst({
      where: { dia, hora, semana, estado: { not: 'RECHAZADA' } },
    });
    if (existente) {
      return res.status(409).json({ error: 'Este horario ya está reservado' });
    }

    const reserva = await prisma.reservaValleIA.create({
      data: {
        dia,
        hora,
        semana,
        estado: 'PENDIENTE',
        solicitanteId: req.user.id,
        formulario,
      },
      include: { solicitante: { select: { id: true, nombre: true } } },
    });

    res.status(201).json(reserva);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/valle-ia/reservas/:id/estado ──────────
router.patch(
  '/reservas/:id/estado',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const { estado } = req.body;
      if (!['APROBADA', 'RECHAZADA', 'PENDIENTE'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      const reserva = await prisma.reservaValleIA.update({
        where: { id: parseInt(req.params.id) },
        data: { estado },
        include: { solicitante: { select: { id: true, nombre: true } } },
      });

      // Notificar al solicitante cuando se aprueba o rechaza
      if (estado === 'APROBADA' || estado === 'RECHAZADA') {
        const docente = reserva.formulario?.nombre_docente || reserva.solicitante.nombre;
        await crearNotificacion({
          userId: reserva.solicitanteId,
          tipo: estado === 'APROBADA' ? 'valle_ia_aprobada' : 'valle_ia_rechazada',
          titulo: estado === 'APROBADA'
            ? '✅ Espacio confirmado · Valle del Software IA'
            : '❌ Espacio no disponible · Valle del Software IA',
          mensaje: estado === 'APROBADA'
            ? `${docente}, tu espacio del ${reserva.dia} a las ${reserva.hora} ha sido confirmado. ¡Nos vemos!`
            : `${docente}, el espacio del ${reserva.dia} a las ${reserva.hora} no pudo confirmarse. Por favor agenda otro horario.`,
          referenceId: String(reserva.id),
        });
      }

      res.json(reserva);
    } catch (error) {
      next(error);
    }
  }
);

// ════════════════════════════════════════════════════════
//  ASISTENCIA
// ════════════════════════════════════════════════════════

// ─── POST /api/valle-ia/asistencia ─────────────────────
// Registrar estudiante en la lista de asistencia de una reserva
// Admin/Director/Equipo o el solicitante dueño de la reserva
router.post(
  '/asistencia',
  authenticateToken,
  validate(asistenciaSchema),
  async (req, res, next) => {
    try {
      const { reservaId, nombreCompleto, cedula, telefono, programa, semestre, nombreProfesor } = req.body;

      const reserva = await prisma.reservaValleIA.findUnique({ where: { id: reservaId } });
      if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });
      if (reserva.estado !== 'APROBADA') return res.status(400).json({ error: 'La reserva debe estar aprobada' });

      // Verificar permisos: admin/director/equipo o dueño de la reserva
      const esGestor = ['ADMIN', 'DIRECTOR', 'EQUIPO'].includes(req.user.rol.toUpperCase());
      if (!esGestor && reserva.solicitanteId !== req.user.id) {
        return res.status(403).json({ error: 'No tienes permisos para agregar estudiantes a esta reserva' });
      }

      // Verificar que no esté duplicada la cédula en esa reserva
      const existe = await prisma.asistenciaValle.findFirst({
        where: { reservaId, cedula },
      });
      if (existe) return res.status(409).json({ error: 'Este estudiante ya está registrado en esta reserva' });

      const asistencia = await prisma.asistenciaValle.create({
        data: { reservaId, nombreCompleto, cedula, telefono, programa, semestre, nombreProfesor },
      });
      res.status(201).json(asistencia);
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/valle-ia/asistencia/:reservaId ───────────
// Obtener lista de asistencia de una reserva
router.get('/asistencia/:reservaId', authenticateToken, async (req, res, next) => {
  try {
    const reservaId = parseInt(req.params.reservaId);
    const asistencias = await prisma.asistenciaValle.findMany({
      where: { reservaId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(asistencias);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/valle-ia/asistencia/:id/confirmar ──────
// El estudiante confirma su asistencia
router.patch('/asistencia/:id/confirmar', authenticateToken, async (req, res, next) => {
  try {
    const asistencia = await prisma.asistenciaValle.update({
      where: { id: parseInt(req.params.id) },
      data: { confirmado: true },
    });
    res.json(asistencia);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/valle-ia/asistencia/:id/encuesta ───────
// El estudiante llena la encuesta de calificación
router.patch(
  '/asistencia/:id/encuesta',
  authenticateToken,
  validate(encuestaSchema),
  async (req, res, next) => {
    try {
      const { calificacionClase, calificacionHerramientas, queMejorar } = req.body;
      const asistencia = await prisma.asistenciaValle.update({
        where: { id: parseInt(req.params.id) },
        data: { calificacionClase, calificacionHerramientas, queMejorar },
      });
      res.json(asistencia);
    } catch (error) {
      next(error);
    }
  }
);

// ─── DELETE /api/valle-ia/asistencia/:id ───────────────
router.delete(
  '/asistencia/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      await prisma.asistenciaValle.delete({ where: { id: parseInt(req.params.id) } });
      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/valle-ia/asistencia-csv/:reservaId ───────
// Exportar CSV de asistencia de una reserva
router.get(
  '/asistencia-csv/:reservaId',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const reservaId = parseInt(req.params.reservaId);
      const reserva = await prisma.reservaValleIA.findUnique({
        where: { id: reservaId },
        include: { solicitante: { select: { nombre: true } } },
      });
      if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada' });

      const asistencias = await prisma.asistenciaValle.findMany({
        where: { reservaId },
        orderBy: { createdAt: 'asc' },
      });

      const BOM = '\uFEFF';
      const headers = [
        'Nombre Completo',
        'Numero de Cedula',
        'Numero de Telefono',
        'Programa',
        'Semestre',
        'Nombre del Profesor/Decano',
        'Asistencia Confirmada',
        'Calificacion de la Clase (1-5)',
        'Calificacion de las Herramientas (1-5)',
        'Que Podria Mejorar',
      ];

      const escapeCsv = (val) => {
        if (val == null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = asistencias.map((a) => [
        a.nombreCompleto,
        a.cedula,
        a.telefono,
        a.programa,
        a.semestre,
        a.nombreProfesor,
        a.confirmado ? 'Si' : 'No',
        a.calificacionClase ?? '',
        a.calificacionHerramientas ?? '',
        a.queMejorar ?? '',
      ].map(escapeCsv).join(','));

      const csv = BOM + [headers.join(','), ...rows].join('\n');
      const filename = `asistencia_valle_${reserva.dia}_${reserva.hora.replace(/[^a-zA-Z0-9]/g, '')}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/valle-ia/asistencia-csv-all ──────────────
// Exportar CSV de TODAS las asistencias
router.get(
  '/asistencia-csv-all',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const { semana } = req.query;
      const where = semana ? { reserva: { semana } } : {};

      const asistencias = await prisma.asistenciaValle.findMany({
        where,
        include: { reserva: { select: { dia: true, hora: true, semana: true } } },
        orderBy: { createdAt: 'asc' },
      });

      const BOM = '\uFEFF';
      const headers = [
        'Fecha',
        'Hora',
        'Semana',
        'Nombre Completo',
        'Numero de Cedula',
        'Numero de Telefono',
        'Programa',
        'Semestre',
        'Nombre del Profesor/Decano',
        'Asistencia Confirmada',
        'Calificacion de la Clase (1-5)',
        'Calificacion de las Herramientas (1-5)',
        'Que Podria Mejorar',
      ];

      const escapeCsv = (val) => {
        if (val == null) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = asistencias.map((a) => [
        a.reserva.dia,
        a.reserva.hora,
        a.reserva.semana,
        a.nombreCompleto,
        a.cedula,
        a.telefono,
        a.programa,
        a.semestre,
        a.nombreProfesor,
        a.confirmado ? 'Si' : 'No',
        a.calificacionClase ?? '',
        a.calificacionHerramientas ?? '',
        a.queMejorar ?? '',
      ].map(escapeCsv).join(','));

      const csv = BOM + [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="asistencias_valle.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
