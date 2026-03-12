import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import validate from '../middleware/validate.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// ─── Zod Schemas ───────────────────────────────────────────

const createSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  cargo: z.string().min(2, 'Cargo debe tener al menos 2 caracteres'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  rol: z.enum(['ADMIN', 'DIRECTOR', 'EQUIPO', 'SOLICITANTE']).optional().default('SOLICITANTE'),
});

const rolSchema = z.object({
  rol: z.enum(['ADMIN', 'DIRECTOR', 'EQUIPO', 'SOLICITANTE']),
});

const updateSchema = z.object({
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').optional(),
  cargo: z.string().min(2, 'Cargo debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

// ─── GET /api/users/equipo — For assignment dropdown (any authenticated user) ───

router.get('/equipo', authenticateToken, async (req, res, next) => {
  try {
    const equipo = await prisma.user.findMany({
      where: { rol: 'EQUIPO' },
      select: { id: true, nombre: true, cargo: true },
    });
    res.json(equipo);
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/users — List all users (ADMIN only) ───────────────────────────

router.get('/', authenticateToken, authorizeRoles('ADMIN', 'DIRECTOR'), async (req, res, next) => {
  try {
    const { search, rol, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where = {};
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (rol) {
      where.rol = rol;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get paginated users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        cargo: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
    });

    res.json({ data: users, total, page: pageNum, limit: limitNum });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/users — Create user (ADMIN only) ────────────────────────────

router.post('/', authenticateToken, authorizeRoles('ADMIN', 'DIRECTOR'), validate(createSchema), async (req, res, next) => {
  try {
    const { email, nombre, cargo, password, rol } = req.body;

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        nombre,
        cargo,
        password: hashedPassword,
        rol,
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        cargo: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// ─── PATCH /api/users/:id/rol — Change user role (ADMIN only) ────────────────

router.patch('/:id/rol', authenticateToken, authorizeRoles('ADMIN', 'DIRECTOR'), validate(rolSchema), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { rol } = req.body;

    // Cannot change own role
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: { rol },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        cargo: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    next(error);
  }
});

// ─── PATCH /api/users/:id — Update user info (ADMIN only) ────────────────────

router.patch('/:id', authenticateToken, authorizeRoles('ADMIN', 'DIRECTOR'), validate(updateSchema), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);
    const { nombre, cargo, email } = req.body;

    // If email is being changed, check uniqueness
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ error: 'El email ya está registrado' });
      }
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(nombre && { nombre }),
        ...(cargo && { cargo }),
        ...(email && { email }),
      },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        cargo: true,
        createdAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    next(error);
  }
});

// ─── DELETE /api/users/:id — Delete user (ADMIN only) ──────────────────────

router.delete('/:id', authenticateToken, authorizeRoles('ADMIN', 'DIRECTOR'), async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id);

    // Cannot delete self
    if (req.user.id === userId) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // Delete in transaction: first refresh tokens, then user
    try {
      await prisma.$transaction([
        prisma.refreshToken.deleteMany({ where: { userId } }),
        prisma.user.delete({ where: { id: userId } }),
      ]);
    } catch (error) {
      if (error.code === 'P2014' || error.code === 'P2003') {
        // Foreign key constraint violation
        return res.status(409).json({ error: 'El usuario tiene solicitudes o reservas asociadas. Desasócielas primero.' });
      }
      throw error;
    }

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    next(error);
  }
});

export default router;
