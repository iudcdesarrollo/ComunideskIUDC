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

const rechazarSchema = z.object({
  comentario: z.string().min(5, 'El comentario debe tener al menos 5 caracteres'),
});

// ─── Static Config ─────────────────────────────────────

const FRANJAS = [
  '11:30 a.m.', '12:00 p.m.', '12:30 p.m.',
  '2:30 p.m.', '3:00 p.m.', '3:30 p.m.',
  '4:00 p.m.', '4:30 p.m.', '5:00 p.m.', '5:40 p.m.',
];

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// ─── GET /api/radio/config ─────────────────────────────

router.get('/config', (req, res) => {
  res.json({ franjas: FRANJAS, dias: DIAS });
});

// ─── GET /api/radio/programas-fijos ────────────────────

router.get('/programas-fijos', async (req, res, next) => {
  try {
    const programas = await prisma.programaFijo.findMany();
    res.json(programas);
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/radio/reservas/pendientes ────────────────
// MUST be before /reservas/:id

router.get(
  '/reservas/pendientes',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const pendientes = await prisma.reservaRadio.findMany({
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

// ─── GET /api/radio/reservas/novedades ─────────────────
// Returns all rejected reservations (with comments) for the novedad log

router.get(
  '/reservas/novedades',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const { semana } = req.query;
      const where = { estado: 'RECHAZADA', comentario: { not: null } };
      if (semana) where.semana = semana;

      const novedades = await prisma.reservaRadio.findMany({
        where,
        include: { solicitante: { select: { id: true, nombre: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json(novedades);
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/radio/reservas/novedades/csv ─────────────
// Export novedades as CSV

router.get(
  '/reservas/novedades/csv',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const { semana } = req.query;
      const where = { estado: 'RECHAZADA', comentario: { not: null } };
      if (semana) where.semana = semana;

      const novedades = await prisma.reservaRadio.findMany({
        where,
        include: { solicitante: { select: { id: true, nombre: true } } },
        orderBy: { createdAt: 'desc' },
      });

      const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      const headers = ['ID', 'Semana', 'Día', 'Hora', 'Programa', 'Solicitante', 'Gestionado por', 'Comentario / Motivo', 'Fecha'];
      const rows = novedades.map((n) => [
        n.id,
        n.semana,
        n.dia,
        n.hora,
        n.formulario?.nombre_programa ?? '',
        n.solicitante?.nombre ?? '',
        n.gestionadoPor ?? '',
        n.comentario ?? '',
        new Date(n.createdAt).toLocaleDateString('es-CO'),
      ].map(escape).join(','));

      const csv = [headers.join(','), ...rows].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="novedades-radio-${semana || 'todas'}.csv"`);
      res.send('\uFEFF' + csv); // BOM for Excel compatibility
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/radio/reservas ───────────────────────────

router.get('/reservas', authenticateToken, async (req, res, next) => {
  try {
    const { semana } = req.query;

    if (!semana) {
      return res.status(400).json({ error: 'Parámetro semana requerido' });
    }

    const reservas = await prisma.reservaRadio.findMany({
      where: { semana },
      include: { solicitante: { select: { id: true, nombre: true } } },
      orderBy: [{ dia: 'asc' }, { hora: 'asc' }],
    });

    res.json(reservas);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/radio/reservas ──────────────────────────

router.post(
  '/reservas',
  authenticateToken,
  validate(reservaSchema),
  async (req, res, next) => {
    try {
      const { dia, hora, semana, formulario } = req.body;

      const programaFijo = await prisma.programaFijo.findFirst({ where: { dia, hora } });
      if (programaFijo) {
        return res.status(409).json({ error: 'Este espacio es un programa fijo' });
      }

      const existing = await prisma.reservaRadio.findFirst({
        where: { dia, hora, semana, estado: { not: 'RECHAZADA' } },
      });
      if (existing) {
        return res.status(409).json({ error: 'Este espacio ya está reservado' });
      }

      const reserva = await prisma.reservaRadio.create({
        data: { dia, hora, semana, estado: 'PENDIENTE', solicitanteId: req.user.id, formulario },
        include: { solicitante: { select: { id: true, nombre: true } } },
      });

      res.status(201).json(reserva);
    } catch (error) {
      next(error);
    }
  }
);

// ─── PATCH /api/radio/reservas/:id/aprobar ─────────────

router.patch(
  '/reservas/:id/aprobar',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);

      const reserva = await prisma.reservaRadio.update({
        where: { id },
        data: { estado: 'APROBADA', gestionadoPor: req.user.email },
        include: { solicitante: { select: { id: true, nombre: true } } },
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
      if (error.code === 'P2025') return res.status(404).json({ error: 'Reserva no encontrada' });
      next(error);
    }
  }
);

// ─── PATCH /api/radio/reservas/:id/rechazar ────────────
// Requires a comentario — sets estado RECHAZADA (kept in DB for audit/novedades)

router.patch(
  '/reservas/:id/rechazar',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  validate(rechazarSchema),
  async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { comentario } = req.body;

      const reserva = await prisma.reservaRadio.update({
        where: { id },
        data: {
          estado: 'RECHAZADA',
          comentario,
          gestionadoPor: req.user.email,
        },
        include: { solicitante: { select: { id: true, nombre: true } } },
      });

      await crearNotificacion({
        userId: reserva.solicitanteId,
        tipo: 'radio_rechazada',
        titulo: 'Reserva rechazada',
        mensaje: `Tu reserva de radio para ${reserva.dia} a las ${reserva.hora} fue rechazada. Motivo: ${comentario}`,
        referenceId: String(reserva.id),
      });

      res.json(reserva);
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Reserva no encontrada' });
      next(error);
    }
  }
);

export default router;
