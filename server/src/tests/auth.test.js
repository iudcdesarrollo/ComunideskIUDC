import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../index.js';

let server;
let baseUrl;
let adminToken;
let adminCookie;

beforeAll(async () => {
  // Start server on random port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 500));

  // Login as admin to get token for other tests
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@iudc.edu.co',
      password: 'admin123',
    }),
  });
  const loginData = await loginRes.json();
  adminToken = loginData.accessToken;
  adminCookie = loginRes.headers.getSetCookie();
});

afterAll(() => {
  server?.close();
});

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with 201 status', async () => {
      // Wait a bit to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: `newuser${Date.now()}@iudc.edu.co`,
          nombre: 'New User',
          cargo: 'Docente',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBeDefined();
      expect(data.user.nombre).toBe('New User');
      expect(data.accessToken).toBeDefined();
      expect(data.user.password).toBeUndefined();
    });

    it('should return 409 for duplicate email', async () => {
      const email = `duplicate${Date.now()}@iudc.edu.co`;

      // First registration
      await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nombre: 'User One',
          cargo: 'Docente',
          password: 'password123',
        }),
      });

      // Second registration with same email
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          nombre: 'User Two',
          cargo: 'Docente',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@iudc.edu.co',
          password: 'admin123',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@iudc.edu.co');
      expect(data.accessToken).toBeDefined();
      expect(data.user.password).toBeUndefined();
    });

    it('should return 401 for wrong password', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@iudc.edu.co',
          password: 'wrongpassword',
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('should return 401 for nonexistent user', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@iudc.edu.co',
          password: 'password123',
        }),
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user info with valid token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@iudc.edu.co');
      expect(data.user.password).toBeUndefined();
    });

    it('should return 401 without token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid.token.here',
        },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh cookie', async () => {
      // First login to get refresh token
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@iudc.edu.co',
          password: 'admin123',
        }),
      });

      const cookies = loginRes.headers.getSetCookie();
      const cookieHeader = cookies.join('; ');

      // Now refresh
      const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
        },
      });

      expect(refreshRes.status).toBe(200);
      const data = await refreshRes.json();
      expect(data.accessToken).toBeDefined();
    });

    it('should return 401 without refresh token', async () => {
      const res = await fetch(`${baseUrl}/api/auth/refresh`, {
        method: 'POST',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login
      const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@iudc.edu.co',
          password: 'admin123',
        }),
      });

      const cookies = loginRes.headers.getSetCookie();
      const cookieHeader = cookies.join('; ');

      // Then logout
      const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Cookie': cookieHeader,
        },
      });

      expect(logoutRes.status).toBe(200);
      const data = await logoutRes.json();
      expect(data.message).toBeDefined();
    });
  });
});
