import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import validate from '../middleware/validate.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { crearNotificacion } from '../helpers/notificaciones.js';

const router = Router();
const prisma = new PrismaClient();

const TIPOS_VALIDOS = ['PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'FELICITACION'];

const crearPqrsSchema = z.object({
  tipo: z.enum(TIPOS_VALIDOS),
  titulo: z.string().min(1, 'Título requerido').max(200),
  mensaje: z.string().min(1, 'Mensaje requerido').max(2000),
});

const responderPqrsSchema = z.object({
  respuesta: z.string().min(1, 'Respuesta requerida').max(2000),
  estado: z.enum(['EN_REVISION', 'RESUELTA', 'CERRADA']).optional(),
});

// ─── GET /api/pqrs ─────────────────────────────────────
// Solicitante: solo ve las suyas | Director: ve todas
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { rol, id: userId } = req.user;
    const esDirector = ['ADMIN', 'DIRECTOR'].includes(rol.toUpperCase());

    const where = esDirector ? {} : { solicitanteId: userId };

    const pqrs = await prisma.pQRS.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
      },
    });
    res.json(pqrs);
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/pqrs/pendientes ──────────────────────────
// Solo director: cuenta de PQRS pendientes
router.get(
  '/pendientes',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR'),
  async (req, res, next) => {
    try {
      const count = await prisma.pQRS.count({
        where: { estado: 'PENDIENTE' },
      });
      res.json({ count });
    } catch (error) {
      next(error);
    }
  }
);

// ─── GET /api/pqrs/:id ────────────────────────────────
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const pqrs = await prisma.pQRS.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
      },
    });
    if (!pqrs) return res.status(404).json({ error: 'PQRS no encontrada' });

    const { rol, id: userId } = req.user;
    const esDirector = ['ADMIN', 'DIRECTOR'].includes(rol.toUpperCase());
    if (!esDirector && pqrs.solicitanteId !== userId) {
      return res.status(403).json({ error: 'Sin permisos' });
    }

    res.json(pqrs);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/pqrs ───────────────────────────────────
router.post('/', authenticateToken, validate(crearPqrsSchema), async (req, res, next) => {
  try {
    const { tipo, titulo, mensaje } = req.body;

    const pqrs = await prisma.pQRS.create({
      data: {
        tipo,
        titulo,
        mensaje,
        estado: 'PENDIENTE',
        solicitanteId: req.user.id,
      },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
      },
    });

    // Notificar a los directores
    const directores = await prisma.user.findMany({
      where: { rol: { in: ['DIRECTOR', 'ADMIN'] } },
    });

    const tipoLabel = {
      PETICION: 'Petición',
      QUEJA: 'Queja',
      RECLAMO: 'Reclamo',
      SUGERENCIA: 'Sugerencia',
      FELICITACION: 'Felicitación',
    };

    for (const director of directores) {
      await crearNotificacion({
        userId: director.id,
        tipo: 'pqrs_nueva',
        titulo: `Nueva ${tipoLabel[tipo]} recibida`,
        mensaje: `${pqrs.solicitante.nombre} envió una ${tipoLabel[tipo].toLowerCase()}: "${titulo}"`,
        referenceId: String(pqrs.id),
      });
    }

    res.status(201).json(pqrs);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/pqrs/:id/responder ────────────────────
// Solo director puede responder
router.patch(
  '/:id/responder',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR'),
  validate(responderPqrsSchema),
  async (req, res, next) => {
    try {
      const { respuesta, estado } = req.body;

      const pqrs = await prisma.pQRS.update({
        where: { id: parseInt(req.params.id) },
        data: {
          respuesta,
          estado: estado || 'RESUELTA',
        },
        include: {
          solicitante: { select: { id: true, nombre: true, cargo: true } },
        },
      });

      // Notificar al solicitante
      await crearNotificacion({
        userId: pqrs.solicitanteId,
        tipo: 'pqrs_respondida',
        titulo: 'Tu PQRS ha sido respondida',
        mensaje: `Tu solicitud "${pqrs.titulo}" ha recibido una respuesta del director.`,
        referenceId: String(pqrs.id),
      });

      res.json(pqrs);
    } catch (error) {
      next(error);
    }
  }
);

// ─── PATCH /api/pqrs/:id/estado ───────────────────────
router.patch(
  '/:id/estado',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR'),
  async (req, res, next) => {
    try {
      const { estado } = req.body;
      if (!['PENDIENTE', 'EN_REVISION', 'RESUELTA', 'CERRADA'].includes(estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      const pqrs = await prisma.pQRS.update({
        where: { id: parseInt(req.params.id) },
        data: { estado },
        include: {
          solicitante: { select: { id: true, nombre: true, cargo: true } },
        },
      });
      res.json(pqrs);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
