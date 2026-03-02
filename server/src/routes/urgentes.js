import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import validate from '../middleware/validate.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// All urgentes routes require ADMIN or DIRECTOR
router.use(authenticateToken, authorizeRoles('ADMIN', 'DIRECTOR'));

const createSchema = z.object({
  titulo: z.string().min(1, 'Título requerido'),
  descripcion: z.string().min(1, 'Descripción requerida'),
});

const estadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'RESUELTO']),
});

// GET /api/urgentes — List all urgentes
router.get('/', async (req, res, next) => {
  try {
    const urgentes = await prisma.urgente.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
      },
    });
    res.json({ data: urgentes });
  } catch (error) {
    next(error);
  }
});

// POST /api/urgentes — Create urgent request
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { titulo, descripcion } = req.body;
    const urgente = await prisma.urgente.create({
      data: {
        titulo,
        descripcion,
        solicitanteId: req.user.id,
        estado: 'PENDIENTE',
      },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
      },
    });
    res.status(201).json(urgente);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/urgentes/:id/estado — Update status (ADMIN only for this)
router.patch('/:id/estado', validate(estadoSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    const urgente = await prisma.urgente.update({
      where: { id: parseInt(id) },
      data: { estado },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
      },
    });
    res.json(urgente);
  } catch (error) {
    next(error);
  }
});

export default router;
