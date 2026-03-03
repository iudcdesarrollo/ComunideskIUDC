import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import app from '../index.js';

const prisma = new PrismaClient();

let server;
let baseUrl;
let registerEmail;

beforeAll(async () => {
  registerEmail = `test_auth_${Date.now()}@test.com`;
  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://localhost:${port}`;
});

afterAll(async () => {
  await prisma.refreshToken.deleteMany({
    where: { user: { email: { contains: 'test_auth_' } } },
  });

  await prisma.user.deleteMany({
    where: { email: { contains: 'test_auth_' } },
  });

  await prisma.$disconnect();

  if (server) {
    await new Promise((resolve) => {
      server.close(resolve);
    });
  }
});

describe('Auth endpoints', () => {
  it('registers a new user', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerEmail,
        nombre: 'Test User',
        cargo: 'Tester',
        password: 'test123456',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('accessToken');
    expect(data.user.rol).toBe('solicitante');
  });

  it('rejects duplicate email registration', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerEmail,
        nombre: 'Test User',
        cargo: 'Tester',
        password: 'test123456',
      }),
    });

    expect(response.status).toBe(409);
  });

  it('logs in with correct admin credentials', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@iudc.edu.co',
        password: 'admin123',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('accessToken');
    expect(data.user.rol).toBe('admin');
  });

  it('rejects login with wrong password', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@iudc.edu.co',
        password: 'wrongpassword',
      }),
    });

    expect(response.status).toBe(401);
  });

  it('rejects login with nonexistent email', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@test.com',
        password: 'whatever',
      }),
    });

    expect(response.status).toBe(401);
  });

  it('refreshes access token with refresh cookie', async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@iudc.edu.co',
        password: 'admin123',
      }),
    });

    const setCookie = loginResponse.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();

    const refreshResponse = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        Cookie: setCookie,
      },
    });

    const data = await refreshResponse.json();

    expect(refreshResponse.status).toBe(200);
    expect(data).toHaveProperty('accessToken');
  });

  it('returns current user with valid token', async () => {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@iudc.edu.co',
        password: 'admin123',
      }),
    });

    const loginData = await loginResponse.json();

    const meResponse = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginData.accessToken}`,
      },
    });

    const meData = await meResponse.json();

    expect(meResponse.status).toBe(200);
    expect(meData).toHaveProperty('user');
    expect(meData.user).not.toHaveProperty('password');
  });

  it('rejects protected route without token', async () => {
    const response = await fetch(`${baseUrl}/api/auth/me`);

    expect(response.status).toBe(401);
  });

  it('rejects solicitante access to admin urgentes route', async () => {
    const solicitanteEmail = `test_auth_${Date.now()}_sol@test.com`;
    const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: solicitanteEmail,
        nombre: 'Solicitante Test',
        cargo: 'Tester',
        password: 'test123456',
      }),
    });

    const registerData = await registerResponse.json();

    const urgentesResponse = await fetch(`${baseUrl}/api/urgentes`, {
      headers: {
        Authorization: `Bearer ${registerData.accessToken}`,
      },
    });

    expect(registerResponse.status).toBe(201);
    expect(urgentesResponse.status).toBe(403);
  });
});
