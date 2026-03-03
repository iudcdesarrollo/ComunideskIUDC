import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// All notification routes require authentication
router.use(authenticateToken);

// ─── GET /api/notificaciones ─────────────────────────────
// Get current user's notifications (newest first, limit 50)

router.get('/', async (req, res, next) => {
  try {
    const notificaciones = await prisma.notificacion.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json({ data: notificaciones });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/notificaciones/no-leidas/count ─────────────
// IMPORTANT: Must be BEFORE /:id routes to avoid route conflict

router.get('/no-leidas/count', async (req, res, next) => {
  try {
    const count = await prisma.notificacion.count({
      where: { userId: req.user.id, leida: false },
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/notificaciones/:id/leer ──────────────────
// Mark one notification as read (verify ownership)

router.patch('/:id/leer', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
    });

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    if (notificacion.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    const updated = await prisma.notificacion.update({
      where: { id },
      data: { leida: true },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/notificaciones/leer-todas ────────────────
// Mark ALL of current user's notifications as read

router.patch('/leer-todas', async (req, res, next) => {
  try {
    await prisma.notificacion.updateMany({
      where: { userId: req.user.id, leida: false },
      data: { leida: true },
    });
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    next(error);
  }
});

// ─── DELETE /api/notificaciones/:id ──────────────────────
// Delete a single notification (verify ownership)

router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);

    const notificacion = await prisma.notificacion.findUnique({
      where: { id },
    });

    if (!notificacion) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    if (notificacion.userId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos' });
    }

    await prisma.notificacion.delete({ where: { id } });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
