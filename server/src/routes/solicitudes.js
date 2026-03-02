import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import validate from '../middleware/validate.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// ─── Zod Schemas ───────────────────────────────────────

const createSolicitudSchema = z.object({
  tipoId: z.string(),
  titulo: z.string(),
  descripcion: z.string().optional().default(''),
  datos: z.record(z.unknown()).optional().default({}),
  archivoUrl: z.string().optional(),
});

const updateEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'RECHAZADA']),
});

const updatePrioridadSchema = z.object({
  prioridad: z.enum(['ALTA', 'MEDIA', 'BAJA']),
});

const asignarSchema = z.object({
  asignadoAId: z.number().int(),
});

// ─── Helper: Generate SOL-XXX ID ─────────────────────────

async function generateSolicitudId() {
  const solicitudes = await prisma.solicitud.findMany({
    select: { id: true },
  });

  let maxNum = 0;
  for (const sol of solicitudes) {
    const match = sol.id.match(/^SOL-(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }

  return `SOL-${String(maxNum + 1).padStart(3, '0')}`;
}

// ─── GET /api/solicitudes ─────────────────────────────────

router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { estado, tipo, busqueda, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause: role-based + query filters combined with AND
    const conditions = [];

    // Role-based filtering
    if (req.user.rol === 'SOLICITANTE') {
      conditions.push({ solicitanteId: req.user.id });
    } else if (req.user.rol === 'EQUIPO') {
      conditions.push({
        OR: [
          { asignadoAId: req.user.id },
          { estado: 'PENDIENTE' },
        ],
      });
    }
    // ADMIN, DIRECTOR: no role-based restriction

    // Query filters
    if (estado) {
      conditions.push({ estado });
    }
    if (tipo) {
      conditions.push({ tipoId: tipo });
    }
    if (busqueda) {
      conditions.push({ titulo: { contains: busqueda, mode: 'insensitive' } });
    }

    const where = conditions.length > 0 ? { AND: conditions } : {};

    const [data, total] = await Promise.all([
      prisma.solicitud.findMany({
        where,
        include: {
          solicitante: { select: { id: true, nombre: true, cargo: true } },
          asignadoA: { select: { id: true, nombre: true } },
          tipo: { select: { id: true, nombre: true, color: true, icono: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.solicitud.count({ where }),
    ]);

    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/solicitudes/:id ─────────────────────────────

router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: req.params.id },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
        asignadoA: { select: { id: true, nombre: true } },
        tipo: { select: { id: true, nombre: true, color: true, icono: true } },
      },
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // SOLICITANTE can only see own
    if (req.user.rol === 'SOLICITANTE' && solicitud.solicitanteId !== req.user.id) {
      return res.status(403).json({ error: 'No tienes permisos para ver esta solicitud' });
    }

    res.json(solicitud);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/solicitudes ────────────────────────────────

router.post('/', authenticateToken, validate(createSolicitudSchema), async (req, res, next) => {
  try {
    const { tipoId, titulo, descripcion, datos, archivoUrl } = req.body;

    const id = await generateSolicitudId();

    const solicitud = await prisma.solicitud.create({
      data: {
        id,
        tipoId,
        titulo,
        descripcion: descripcion || '',
        datos: datos || {},
        archivoUrl: archivoUrl || null,
        estado: 'PENDIENTE',
        prioridad: 'MEDIA',
        solicitanteId: req.user.id,
      },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
        asignadoA: { select: { id: true, nombre: true } },
        tipo: { select: { id: true, nombre: true, color: true, icono: true } },
      },
    });

    res.status(201).json(solicitud);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/solicitudes/:id/estado ────────────────────

router.patch('/:id/estado', authenticateToken, authorizeRoles('ADMIN', 'EQUIPO'), validate(updateEstadoSchema), async (req, res, next) => {
  try {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: req.params.id },
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // EQUIPO can only change own assigned solicitudes
    if (req.user.rol === 'EQUIPO' && solicitud.asignadoAId !== req.user.id) {
      return res.status(403).json({ error: 'Solo puedes cambiar el estado de solicitudes asignadas a ti' });
    }

    const updated = await prisma.solicitud.update({
      where: { id: req.params.id },
      data: { estado: req.body.estado },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
        asignadoA: { select: { id: true, nombre: true } },
        tipo: { select: { id: true, nombre: true, color: true, icono: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/solicitudes/:id/prioridad ─────────────────

router.patch('/:id/prioridad', authenticateToken, authorizeRoles('ADMIN'), validate(updatePrioridadSchema), async (req, res, next) => {
  try {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: req.params.id },
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const updated = await prisma.solicitud.update({
      where: { id: req.params.id },
      data: { prioridad: req.body.prioridad },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
        asignadoA: { select: { id: true, nombre: true } },
        tipo: { select: { id: true, nombre: true, color: true, icono: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/solicitudes/:id/asignar ───────────────────

router.patch('/:id/asignar', authenticateToken, authorizeRoles('ADMIN'), validate(asignarSchema), async (req, res, next) => {
  try {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: req.params.id },
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const data = { asignadoAId: req.body.asignadoAId };

    // Auto-change to EN_PROCESO if currently PENDIENTE
    if (solicitud.estado === 'PENDIENTE') {
      data.estado = 'EN_PROCESO';
    }

    const updated = await prisma.solicitud.update({
      where: { id: req.params.id },
      data,
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
        asignadoA: { select: { id: true, nombre: true } },
        tipo: { select: { id: true, nombre: true, color: true, icono: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/solicitudes/:id/tomar ──────────────────────

router.post('/:id/tomar', authenticateToken, authorizeRoles('EQUIPO'), async (req, res, next) => {
  try {
    const solicitud = await prisma.solicitud.findUnique({
      where: { id: req.params.id },
    });

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    const updated = await prisma.solicitud.update({
      where: { id: req.params.id },
      data: {
        asignadoAId: req.user.id,
        estado: 'EN_PROCESO',
      },
      include: {
        solicitante: { select: { id: true, nombre: true, cargo: true } },
        asignadoA: { select: { id: true, nombre: true } },
        tipo: { select: { id: true, nombre: true, color: true, icono: true } },
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
