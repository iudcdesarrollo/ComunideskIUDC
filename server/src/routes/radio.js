import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import validate from '../middleware/validate.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { crearNotificacion } from '../helpers/notificaciones.js';

const router = Router();
const prisma = new PrismaClient();

// ─── Zod Schemas ───────────────────────────────────────

const reservaSchema = z.object({
  dia: z.string().min(1, 'Día requerido'),
  hora: z.string().min(1, 'Hora requerida'),
  semana: z.string().min(1, 'Semana requerida'),
  formulario: z.object({
    nombre_programa: z.string().min(1, 'Nombre del programa requerido'),
  }).passthrough(),
});

// ─── Static Config ─────────────────────────────────────

const FRANJAS = [
  '11:30 a.m.', '12:00 p.m.', '12:30 p.m.',
  '2:30 p.m.', '3:00 p.m.', '3:30 p.m.',
  '4:00 p.m.', '4:30 p.m.', '5:00 p.m.', '5:40 p.m.',
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// ─── GET /api/radio/config ─────────────────────────────
// Public — returns static radio schedule config

router.get('/config', (req, res) => {
  res.json({ franjas: FRANJAS, dias: DIAS });
});

// ─── GET /api/radio/programas-fijos ────────────────────
// Public — returns all fixed programs

router.get('/programas-fijos', async (req, res, next) => {
  try {
    const programas = await prisma.programaFijo.findMany();
    res.json(programas);
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/radio/reservas/pendientes ────────────────
// Protected (ADMIN, EQUIPO) — returns pending reservations
// IMPORTANT: This route MUST be before /reservas/:id to avoid route conflict

router.get(
  '/reservas/pendientes',
  authenticateToken,
  authorizeRoles('ADMIN', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const pendientes = await prisma.reservaRadio.findMany({
        where: { estado: 'PENDIENTE' },
        include: {
          solicitante: { select: { id: true, nombre: true } },
        },
        orderBy: [{ semana: 'asc' }, { dia: 'asc' }, { hora: 'asc' }],
      });
      res.json(pendientes);
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/radio/reservas ───────────────────────────
// Protected — returns reservations for a given week

router.get('/reservas', authenticateToken, async (req, res, next) => {
  try {
    const { semana } = req.query;

    if (!semana) {
      return res.status(400).json({ error: 'Parámetro semana requerido' });
    }

    const reservas = await prisma.reservaRadio.findMany({
      where: { semana },
      include: {
        solicitante: { select: { id: true, nombre: true } },
      },
      orderBy: [{ dia: 'asc' }, { hora: 'asc' }],
    });

    res.json(reservas);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/radio/reservas ──────────────────────────
// Protected — create a new reservation

router.post(
  '/reservas',
  authenticateToken,
  validate(reservaSchema),
  async (req, res, next) => {
    try {
      const { dia, hora, semana, formulario } = req.body;

      // Check if slot is a programa fijo
      const programaFijo = await prisma.programaFijo.findFirst({
        where: { dia, hora },
      });

      if (programaFijo) {
        return res.status(409).json({ error: 'Este espacio es un programa fijo' });
      }

      // Check for double-booking (exclude RECHAZADA — rejected slots are bookable)
      const existing = await prisma.reservaRadio.findFirst({
        where: {
          dia,
          hora,
          semana,
          estado: { not: 'RECHAZADA' },
        },
      });

      if (existing) {
        return res.status(409).json({ error: 'Este espacio ya está reservado' });
      }

      // Create reservation
      const reserva = await prisma.reservaRadio.create({
        data: {
          dia,
          hora,
          semana,
          estado: 'PENDIENTE',
          solicitanteId: req.user.id,
          formulario,
        },
        include: {
          solicitante: { select: { id: true, nombre: true } },
        },
      });

      res.status(201).json(reserva);
    } catch (error) {
      next(error);
    }
  }
);

// ─── PATCH /api/radio/reservas/:id/aprobar ─────────────
// Protected (ADMIN, EQUIPO) — approve a reservation

router.patch(
  '/reservas/:id/aprobar',
  authenticateToken,
  authorizeRoles('ADMIN', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);

      const reserva = await prisma.reservaRadio.update({
        where: { id },
        data: { estado: 'APROBADA' },
        include: {
          solicitante: { select: { id: true, nombre: true } },
        },
      });

      await crearNotificacion({
        userId: reserva.solicitanteId,
        tipo: 'radio_aprobada',
        titulo: 'Reserva aprobada',
        mensaje: `Tu reserva de radio para ${reserva.dia} a las ${reserva.hora} fue aprobada`,
        referenceId: String(reserva.id),
      });

      res.json(reserva);
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }
      next(error);
    }
  }
);

// ─── DELETE /api/radio/reservas/:id ────────────────────
// Protected (ADMIN, EQUIPO) — reject/delete a reservation

router.delete(
  '/reservas/:id',
  authenticateToken,
  authorizeRoles('ADMIN', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);

      const reserva = await prisma.reservaRadio.findUnique({ where: { id } });
      if (reserva) {
        await crearNotificacion({
          userId: reserva.solicitanteId,
          tipo: 'radio_rechazada',
          titulo: 'Reserva rechazada',
          mensaje: `Tu reserva de radio para ${reserva.dia} a las ${reserva.hora} fue rechazada`,
          referenceId: String(reserva.id),
        });
      }

      await prisma.reservaRadio.delete({ where: { id } });

      res.status(204).end();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }
      next(error);
    }
  }
);

export default router;
