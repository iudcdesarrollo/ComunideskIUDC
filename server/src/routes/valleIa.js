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

export default router;
