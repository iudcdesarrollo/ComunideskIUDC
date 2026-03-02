import { Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import config from '../config/index.js';
import validate from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ─── Zod Schemas ───────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
  cargo: z.string().min(2, 'Cargo debe tener al menos 2 caracteres'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña requerida'),
});

// ─── Helper Functions ──────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    config.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken(userId, tokenId) {
  return jwt.sign(
    { id: userId, tokenId },
    config.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: REFRESH_COOKIE_MAX_AGE,
  });
}

function formatUserResponse(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol.toLowerCase(),
    cargo: user.cargo,
  };
}

// ─── POST /api/auth/register ───────────────────────────

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, nombre, cargo, password } = req.body;

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with default role SOLICITANTE
    const user = await prisma.user.create({
      data: {
        email,
        nombre,
        cargo,
        password: hashedPassword,
        rol: 'SOLICITANTE',
      },
    });

    // Generate access token
    const accessToken = generateAccessToken(user);

    // Create refresh token in DB
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: '', // placeholder, will update
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE),
      },
    });

    // Generate refresh token with DB record ID
    const refreshToken = generateRefreshToken(user.id, refreshTokenRecord.id);

    // Update the record with actual token
    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    // Set cookie
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: formatUserResponse(user),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/login ──────────────────────────────

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generate access token
    const accessToken = generateAccessToken(user);

    // Create refresh token in DB
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: '',
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE),
      },
    });

    const refreshToken = generateRefreshToken(user.id, refreshTokenRecord.id);

    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      user: formatUserResponse(user),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/refresh ────────────────────────────

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    // Verify JWT
    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    // Find token in DB
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token revocado' });
    }

    // Delete old token (rotation)
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Get user
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Generate new tokens
    const accessToken = generateAccessToken(user);

    const newRefreshTokenRecord = await prisma.refreshToken.create({
      data: {
        token: '',
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE),
      },
    });

    const newRefreshToken = generateRefreshToken(user.id, newRefreshTokenRecord.id);

    await prisma.refreshToken.update({
      where: { id: newRefreshTokenRecord.id },
      data: { token: newRefreshToken },
    });

    setRefreshCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

// ─── POST /api/auth/logout ─────────────────────────────

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      // Delete from DB if exists
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    res.json({ message: 'Sesión cerrada' });
  } catch (error) {
    next(error);
  }
});

// ─── GET /api/auth/me ──────────────────────────────────

router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        cargo: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      user: {
        ...user,
        rol: user.rol.toLowerCase(),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
