import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let app;
let server;
let baseUrl;
let adminToken;
let solicitanteToken;
let testSolicitanteEmail;
const testSolicitantePassword = 'docente123';

let createdSolicitudId;
let createdUrgenteId;

const runStamp = Date.now();
const solicitudTitle = `Test Solicitud ${runStamp}`;
const urgenteTitle = `Test Urgente ${runStamp}`;
const reservaPrograma = `Test Program ${runStamp}`;
const reservaSemana = '2099-12-07';

async function loginAndGetToken(email, password) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  expect(response.status).toBe(200);
  const data = await response.json();
  expect(data.accessToken).toBeTruthy();
  return data.accessToken;
}

async function ensureSolicitanteToken() {
  const knownEmail = 'maria.lopez@iudc.edu.co';
  const knownPassword = 'docente123';

  const knownLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: knownEmail, password: knownPassword }),
  });

  if (knownLoginResponse.status === 200) {
    const knownLoginData = await knownLoginResponse.json();
    testSolicitanteEmail = knownEmail;
    return knownLoginData.accessToken;
  }

  testSolicitanteEmail = `test.solicitante.${runStamp}@iudc.edu.co`;
  const registerResponse = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: `Test Solicitante ${runStamp}`,
      email: testSolicitanteEmail,
      password: testSolicitantePassword,
      cargo: 'Docente',
    }),
  });

  expect([201, 409]).toContain(registerResponse.status);
  return loginAndGetToken(testSolicitanteEmail, testSolicitantePassword);
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  ({ default: app } = await import('../index.js'));

  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  adminToken = await loginAndGetToken('admin@iudc.edu.co', 'admin123');
  solicitanteToken = await ensureSolicitanteToken();
});

afterAll(async () => {
  await prisma.solicitud.deleteMany({
    where: { titulo: { contains: 'Test Solicitud' } },
  });

  await prisma.urgente.deleteMany({
    where: { titulo: { contains: 'Test Urgente' } },
  });

  await prisma.reservaRadio.deleteMany({
    where: {
      semana: reservaSemana,
      formulario: {
        path: ['nombre_programa'],
        string_contains: 'Test Program',
      },
    },
  });

  await prisma.refreshToken.deleteMany({
    where: {
      user: {
        email: {
          in: ['admin@iudc.edu.co', testSolicitanteEmail].filter(Boolean),
        },
      },
    },
  });

  if (testSolicitanteEmail && testSolicitanteEmail !== 'maria.lopez@iudc.edu.co') {
    await prisma.user.deleteMany({ where: { email: testSolicitanteEmail } });
  }

  await prisma.$disconnect();
  await new Promise((resolve) => server.close(resolve));
});

describe('Main CRUD endpoints', () => {
  it('GET /api/solicitudes as admin returns 200 and list payload', async () => {
    const response = await fetch(`${baseUrl}/api/solicitudes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    const body = await response.json();

    if (Array.isArray(body)) {
      expect(Array.isArray(body)).toBe(true);
    } else {
      expect(Array.isArray(body.data)).toBe(true);
    }
  });

  it('POST /api/solicitudes as admin creates solicitud with SOL-XXX id', async () => {
    const response = await fetch(`${baseUrl}/api/solicitudes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        tipoId: 'registro_control',
        titulo: solicitudTitle,
        descripcion: 'Test',
        datos: {},
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toMatch(/^SOL-\d+$/);
    createdSolicitudId = body.id;
  });

  it('PATCH /api/solicitudes/:id/estado as admin updates estado', async () => {
    const response = await fetch(`${baseUrl}/api/solicitudes/${createdSolicitudId}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ estado: 'EN_PROCESO' }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.estado).toBe('EN_PROCESO');
  });

  it('GET /api/tipos returns 200 with 6 tipos', async () => {
    const response = await fetch(`${baseUrl}/api/tipos`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(6);
  });

  it('GET /api/radio/config returns public config arrays', async () => {
    const response = await fetch(`${baseUrl}/api/radio/config`);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.franjas)).toBe(true);
    expect(Array.isArray(body.dias)).toBe(true);
  });

  it('POST /api/radio/reservas as solicitante creates reservation', async () => {
    const response = await fetch(`${baseUrl}/api/radio/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${solicitanteToken}`,
      },
      body: JSON.stringify({
        dia: 'Lunes',
        hora: '11:30 a.m.',
        semana: reservaSemana,
        formulario: { nombre_programa: reservaPrograma },
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.dia).toBe('Lunes');
    expect(body.hora).toBe('11:30 a.m.');
  });

  it('POST /api/radio/reservas rejects double booking with 409', async () => {
    const response = await fetch(`${baseUrl}/api/radio/reservas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${solicitanteToken}`,
      },
      body: JSON.stringify({
        dia: 'Lunes',
        hora: '11:30 a.m.',
        semana: reservaSemana,
        formulario: { nombre_programa: `${reservaPrograma} Duplicate` },
      }),
    });

    expect(response.status).toBe(409);
  });

  it('POST /api/urgentes as admin creates urgente', async () => {
    const response = await fetch(`${baseUrl}/api/urgentes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        titulo: urgenteTitle,
        descripcion: 'Test urgente desc',
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.id).toBeTypeOf('number');
    createdUrgenteId = body.id;
  });

  it('GET /api/urgentes as admin returns data array', async () => {
    const response = await fetch(`${baseUrl}/api/urgentes`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.some((item) => item.id === createdUrgenteId)).toBe(true);
  });

  it('GET /api/urgentes as solicitante returns 403', async () => {
    const response = await fetch(`${baseUrl}/api/urgentes`, {
      headers: { Authorization: `Bearer ${solicitanteToken}` },
    });

    expect(response.status).toBe(403);
  });
});
