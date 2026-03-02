import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import app from '../index.js';

let server;
let baseUrl;
let adminToken;
let solicitanteToken;
let createdSolicitudId;

beforeAll(async () => {
  // Start server on random port
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  // Wait for server to be ready - increased wait time
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Login as admin with retry logic
  let adminRes;
  let retries = 10;
  while (retries > 0) {
    try {
      adminRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@iudc.edu.co',
          password: 'admin123',
        }),
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        adminToken = adminData.accessToken;
        break;
      }
      retries--;
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      retries--;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Register and login as solicitante (test user)
  const registerRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: 'Test Solicitante',
      email: `test.solicitante.${Date.now()}@iudc.edu.co`,
      password: 'test123456',
      cargo: 'Docente Test',
    }),
  });
  if (registerRes.ok) {
    const solicitanteData = await registerRes.json();
    solicitanteToken = solicitanteData.accessToken;
  }
});

afterAll(() => {
  server?.close();
});

describe('Solicitudes Endpoints', () => {
  describe('GET /api/solicitudes', () => {
    it('should return solicitudes list with 200 status', async () => {
      const res = await fetch(`${baseUrl}/api/solicitudes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.total).toBeDefined();
      expect(data.page).toBeDefined();
      expect(data.limit).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await fetch(`${baseUrl}/api/solicitudes`, {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/solicitudes', () => {
    it('should create a new solicitud with 201 status', async () => {
      const res = await fetch(`${baseUrl}/api/solicitudes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${solicitanteToken}`,
        },
        body: JSON.stringify({
          tipoId: 'registro_control',
          titulo: 'Test Solicitud',
          descripcion: 'This is a test solicitud',
          datos: { programa_academico: 'Ingeniería' },
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.id).toMatch(/^SOL-\d+$/);
      expect(data.titulo).toBe('Test Solicitud');
      expect(data.estado).toBe('PENDIENTE');
      expect(data.prioridad).toBe('MEDIA');
      createdSolicitudId = data.id;
    });

    it('should require authentication', async () => {
      const res = await fetch(`${baseUrl}/api/solicitudes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipoId: 'registro_control',
          titulo: 'Test',
          descripcion: 'Test',
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/solicitudes/:id/estado', () => {
    it('should change solicitud estado with 200 status', async () => {
      const res = await fetch(`${baseUrl}/api/solicitudes/${createdSolicitudId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          estado: 'EN_PROCESO',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.estado).toBe('EN_PROCESO');
    });

    it('should require ADMIN or EQUIPO role', async () => {
      const res = await fetch(`${baseUrl}/api/solicitudes/${createdSolicitudId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${solicitanteToken}`,
        },
        body: JSON.stringify({
          estado: 'COMPLETADA',
        }),
      });

      expect(res.status).toBe(403);
    });

    it('should return 404 for nonexistent solicitud', async () => {
      const res = await fetch(`${baseUrl}/api/solicitudes/SOL-99999/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          estado: 'COMPLETADA',
        }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/tipos', () => {
    it('should return tipos list with 200 status', async () => {
      const res = await fetch(`${baseUrl}/api/tipos`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should return at least 5 tipos', async () => {
      const res = await fetch(`${baseUrl}/api/tipos`, {
        method: 'GET',
      });

      const data = await res.json();
      expect(data.length).toBeGreaterThanOrEqual(5);
    });
  });
});

describe('Urgentes Endpoints', () => {
  let createdUrgenteId;

  describe('GET /api/urgentes', () => {
    it('should return urgentes list with 200 status', async () => {
      const res = await fetch(`${baseUrl}/api/urgentes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await fetch(`${baseUrl}/api/urgentes`, {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });

    it('should require ADMIN or DIRECTOR role', async () => {
      const res = await fetch(`${baseUrl}/api/urgentes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${solicitanteToken}`,
        },
      });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/urgentes', () => {
    it('should create a new urgente with 201 status', async () => {
      const res = await fetch(`${baseUrl}/api/urgentes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          titulo: 'Test Urgente',
          descripcion: 'This is a test urgente request',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.titulo).toBe('Test Urgente');
      expect(data.estado).toBe('PENDIENTE');
      createdUrgenteId = data.id;
    });

    it('should require ADMIN or DIRECTOR role', async () => {
      const res = await fetch(`${baseUrl}/api/urgentes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${solicitanteToken}`,
        },
        body: JSON.stringify({
          titulo: 'Test',
          descripcion: 'Test',
        }),
      });

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/urgentes/:id/estado', () => {
    it('should update urgente estado with 200 status', async () => {
      const res = await fetch(`${baseUrl}/api/urgentes/${createdUrgenteId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          estado: 'EN_PROCESO',
        }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.estado).toBe('EN_PROCESO');
    });
  });
});

describe('Radio Endpoints', () => {
  describe('GET /api/radio/config', () => {
    it('should return radio config with 200 status', async () => {
      const res = await fetch(`${baseUrl}/api/radio/config`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.franjas).toBeDefined();
      expect(Array.isArray(data.franjas)).toBe(true);
      expect(data.dias).toBeDefined();
      expect(Array.isArray(data.dias)).toBe(true);
      expect(data.franjas.length).toBeGreaterThan(0);
      expect(data.dias.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/radio/reservas', () => {
    it('should create a radio reservation with 201 status', async () => {
      const uniqueWeek = `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`;
      const res = await fetch(`${baseUrl}/api/radio/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${solicitanteToken}`,
        },
        body: JSON.stringify({
          dia: 'Lunes',
          hora: '11:30 a.m.',
          semana: uniqueWeek,
          formulario: {
            nombre_programa: 'Test Program',
          },
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.id).toBeDefined();
      expect(data.dia).toBe('Lunes');
      expect(data.hora).toBe('11:30 a.m.');
      expect(data.estado).toBe('PENDIENTE');
    });

    it('should require authentication', async () => {
      const res = await fetch(`${baseUrl}/api/radio/reservas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dia: 'Lunes',
          hora: '11:30 a.m.',
          semana: '2024-03-04',
          formulario: { nombre_programa: 'Test' },
        }),
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/radio/reservas', () => {
    it('should return reservas for a given week', async () => {
      const res = await fetch(`${baseUrl}/api/radio/reservas?semana=2024-03-04`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should require semana parameter', async () => {
      const res = await fetch(`${baseUrl}/api/radio/reservas`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(400);
    });
  });
});

describe('Stats Endpoints', () => {
  describe('GET /api/stats/dashboard', () => {
    it('should return dashboard stats with 200 status', async () => {
      const res = await fetch(`${baseUrl}/api/stats/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.total).toBeDefined();
      expect(typeof data.total).toBe('number');
      expect(data.pendientes).toBeDefined();
      expect(data.enProceso).toBeDefined();
      expect(data.completadas).toBeDefined();
      expect(data.rechazadas).toBeDefined();
      expect(data.porTipo).toBeDefined();
      expect(data.porPrioridad).toBeDefined();
      expect(data.asignaciones).toBeDefined();
      expect(data.tasaCompletado).toBeDefined();
    });

    it('should require ADMIN or EQUIPO role', async () => {
      const res = await fetch(`${baseUrl}/api/stats/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${solicitanteToken}`,
        },
      });

      expect(res.status).toBe(403);
    });

    it('should require authentication', async () => {
      const res = await fetch(`${baseUrl}/api/stats/dashboard`, {
        method: 'GET',
      });

      expect(res.status).toBe(401);
    });
  });
});

describe('Health Check', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });
  });
});
