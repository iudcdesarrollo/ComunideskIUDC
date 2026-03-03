import { Router } from 'express';
import { randomUUID } from 'node:crypto';
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
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

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

async function createRefreshToken(userId) {
  const record = await prisma.refreshToken.create({
    data: {
      token: `pending-${randomUUID()}`,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_COOKIE_MAX_AGE),
    },
  });

  const token = generateRefreshToken(userId, record.id);

  await prisma.refreshToken.update({
    where: { id: record.id },
    data: { token },
  });

  return token;
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

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, nombre, cargo, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        nombre,
        cargo,
        password: hashedPassword,
        rol: 'SOLICITANTE',
      },
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: formatUserResponse(user),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    res.json({
      user: formatUserResponse(user),
      accessToken,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: { id: decoded.tokenId, token, userId: decoded.id },
    });

    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token revocado' });
    }

    await prisma.refreshToken.delete({ where: { id: decoded.tokenId } });

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const accessToken = generateAccessToken(user);
    const newRefreshToken = await createRefreshToken(user.id);

    setRefreshCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

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
