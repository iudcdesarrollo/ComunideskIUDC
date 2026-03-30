import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import validate from '../middleware/validate.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { crearNotificacion } from '../helpers/notificaciones.js';

const router = Router();
const prisma = new PrismaClient();

const includeRelations = {
  solicitante: { select: { id: true, nombre: true, cargo: true } },
  agente: { select: { id: true, nombre: true, cargo: true } },
};

// ── Schemas Zod ──────────────────────────────────────────
const createSchema = z.object({
  descripcion: z.string().min(1, 'Descripción requerida'),
  sede: z.string().min(1, 'Sede requerida'),
  categoria: z.enum(['HARDWARE', 'SOFTWARE', 'RED_INTERNET', 'ACCESOS', 'OTROS']),
});

const clasificarSchema = z.object({
  prioridad: z.enum(['BAJA', 'MEDIA', 'ALTA']),
});

// All routes require authentication
router.use(authenticateToken);

// ── Helper: buscar técnico disponible al azar ────────────
async function buscarTecnicoDisponible(excluirUserId) {
  const ocupados = await prisma.ticketTI.findMany({
    where: { estado: { in: ['ASIGNADO', 'EN_PROCESO'] } },
    select: { agenteId: true },
  });
  const idsOcupados = new Set(ocupados.map(t => t.agenteId).filter(Boolean));

  const disponibles = await prisma.user.findMany({
    where: {
      rol: 'EQUIPO',
      id: { notIn: [...idsOcupados] },
      ...(excluirUserId ? { id: { notIn: [...idsOcupados, excluirUserId] } } : {}),
    },
  });

  if (disponibles.length === 0) return null;
  return disponibles[Math.floor(Math.random() * disponibles.length)];
}

// ── GET / — Listar tickets ───────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const where = req.user.rol === 'SOLICITANTE'
      ? { solicitanteId: req.user.id }
      : {};

    const tickets = await prisma.ticketTI.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: includeRelations,
    });
    res.json({ data: tickets });
  } catch (error) {
    next(error);
  }
});

// ── POST / — Crear ticket + asignación automática ────────
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { descripcion, sede, categoria } = req.body;

    // Buscar técnico disponible al azar
    const tecnico = await buscarTecnicoDisponible(req.user.id);

    const ticket = await prisma.ticketTI.create({
      data: {
        descripcion,
        sede,
        categoria,
        prioridad: null,
        estado: tecnico ? 'ASIGNADO' : 'PENDIENTE',
        solicitanteId: req.user.id,
        agenteId: tecnico?.id || null,
        asignadoAt: tecnico ? new Date() : null,
      },
      include: includeRelations,
    });

    // Notificar al técnico asignado
    if (tecnico) {
      await crearNotificacion({
        userId: tecnico.id,
        tipo: 'helpme_asignado',
        titulo: 'Help-Me TI',
        mensaje: `Se te asignó una solicitud: "${descripcion.substring(0, 50)}${descripcion.length > 50 ? '...' : ''}" en ${sede}`,
        referenceId: String(ticket.id),
      });
    }

    // Notificar a coordinadores (ADMIN, DIRECTOR)
    const coordinadores = await prisma.user.findMany({
      where: { rol: { in: ['ADMIN', 'DIRECTOR'] }, id: { not: req.user.id } },
    });
    for (const coord of coordinadores) {
      await crearNotificacion({
        userId: coord.id,
        tipo: 'helpme_nuevo',
        titulo: 'Help-Me TI',
        mensaje: `Nueva solicitud: "${descripcion.substring(0, 50)}${descripcion.length > 50 ? '...' : ''}"${tecnico ? ` → asignada a ${tecnico.nombre}` : ' → sin técnico disponible'}`,
        referenceId: String(ticket.id),
      });
    }

    res.status(201).json(ticket);
  } catch (error) {
    next(error);
  }
});

// ── PATCH /:id/iniciar — Técnico llega y empieza ────────
router.patch('/:id/iniciar', authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticketTI.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticket.estado !== 'ASIGNADO') {
      return res.status(400).json({ error: 'Solo se puede iniciar un ticket asignado' });
    }
    if (ticket.agenteId !== req.user.id) {
      return res.status(403).json({ error: 'Solo el técnico asignado puede iniciar' });
    }

    const updated = await prisma.ticketTI.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'EN_PROCESO',
        iniciadoAt: new Date(),
      },
      include: includeRelations,
    });

    await crearNotificacion({
      userId: updated.solicitanteId,
      tipo: 'helpme_iniciado',
      titulo: 'Help-Me TI',
      mensaje: `${req.user.nombre} llegó y está atendiendo tu solicitud`,
      referenceId: String(updated.id),
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ── PATCH /:id/finalizar — Técnico termina ──────────────
router.patch('/:id/finalizar', authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nota } = req.body;
    const ticket = await prisma.ticketTI.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticket.estado !== 'EN_PROCESO') {
      return res.status(400).json({ error: 'Solo se puede finalizar un ticket en proceso' });
    }
    if (ticket.agenteId !== req.user.id) {
      return res.status(403).json({ error: 'Solo el técnico asignado puede finalizar' });
    }

    const updated = await prisma.ticketTI.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'CUMPLIDO',
        cumplidoAt: new Date(),
        nota: nota || null,
      },
      include: includeRelations,
    });

    await crearNotificacion({
      userId: updated.solicitanteId,
      tipo: 'helpme_cumplido',
      titulo: 'Help-Me TI',
      mensaje: `Tu solicitud fue resuelta por ${req.user.nombre}`,
      referenceId: String(updated.id),
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ── PATCH /:id/escalar — Técnico escala al coordinador ──
router.patch('/:id/escalar', authorizeRoles('EQUIPO'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    const ticket = await prisma.ticketTI.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!['ASIGNADO', 'EN_PROCESO'].includes(ticket.estado)) {
      return res.status(400).json({ error: 'Solo se puede escalar un ticket asignado o en proceso' });
    }
    if (ticket.agenteId !== req.user.id) {
      return res.status(403).json({ error: 'Solo el técnico asignado puede escalar' });
    }

    const updated = await prisma.ticketTI.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'ESCALADO',
        agenteId: null,
        nota: motivo ? `Escalado por ${req.user.nombre}: ${motivo}` : `Escalado por ${req.user.nombre}`,
      },
      include: includeRelations,
    });

    // Notificar a coordinadores
    const coordinadores = await prisma.user.findMany({
      where: { rol: { in: ['ADMIN', 'DIRECTOR'] } },
    });
    for (const coord of coordinadores) {
      await crearNotificacion({
        userId: coord.id,
        tipo: 'helpme_escalado',
        titulo: 'Help-Me TI — Escalado',
        mensaje: `${req.user.nombre} escaló la solicitud #${ticket.id}: "${ticket.descripcion.substring(0, 40)}..."`,
        referenceId: String(ticket.id),
      });
    }

    await crearNotificacion({
      userId: updated.solicitanteId,
      tipo: 'helpme_escalado',
      titulo: 'Help-Me TI',
      mensaje: `Tu solicitud fue escalada al coordinador para una mejor atención`,
      referenceId: String(updated.id),
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ── PATCH /:id/clasificar — Coordinador clasifica prioridad ─
router.patch('/:id/clasificar', authorizeRoles('ADMIN', 'DIRECTOR'), validate(clasificarSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { prioridad } = req.body;
    const ticket = await prisma.ticketTI.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });

    const updated = await prisma.ticketTI.update({
      where: { id: parseInt(id) },
      data: { prioridad },
      include: includeRelations,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ── PATCH /:id/asignar — Coordinador asigna manualmente ──
router.patch('/:id/asignar', authorizeRoles('ADMIN', 'DIRECTOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { agenteId } = req.body;
    if (!agenteId) return res.status(400).json({ error: 'Debe seleccionar un técnico' });

    const ticket = await prisma.ticketTI.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticket.estado === 'CUMPLIDO') {
      return res.status(400).json({ error: 'Este ticket ya fue resuelto' });
    }

    const updated = await prisma.ticketTI.update({
      where: { id: parseInt(id) },
      data: {
        estado: 'ASIGNADO',
        agenteId: parseInt(agenteId),
        asignadoAt: new Date(),
        iniciadoAt: null,
        nota: ticket.nota && ticket.estado === 'ESCALADO'
          ? ticket.nota
          : null,
      },
      include: includeRelations,
    });

    await crearNotificacion({
      userId: parseInt(agenteId),
      tipo: 'helpme_asignado',
      titulo: 'Help-Me TI',
      mensaje: `El coordinador te asignó una solicitud: "${updated.descripcion.substring(0, 50)}${updated.descripcion.length > 50 ? '...' : ''}"`,
      referenceId: String(updated.id),
    });

    await crearNotificacion({
      userId: updated.solicitanteId,
      tipo: 'helpme_asignado',
      titulo: 'Help-Me TI',
      mensaje: `Tu solicitud fue asignada a ${updated.agente.nombre}`,
      referenceId: String(updated.id),
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// ── GET /equipo — Listar colaboradores del equipo TI ─────
router.get('/equipo', authorizeRoles('ADMIN', 'DIRECTOR'), async (req, res, next) => {
  try {
    const equipo = await prisma.user.findMany({
      where: { rol: 'EQUIPO' },
      select: { id: true, nombre: true, email: true, cargo: true, createdAt: true },
      orderBy: { nombre: 'asc' },
    });
    res.json(equipo);
  } catch (error) {
    next(error);
  }
});

// ── POST /equipo — Coordinador crea un colaborador TI ────
const crearColaboradorSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  cargo: z.string().min(2, 'Cargo requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

router.post('/equipo', authorizeRoles('ADMIN', 'DIRECTOR'), validate(crearColaboradorSchema), async (req, res, next) => {
  try {
    const { nombre, email, cargo, password } = req.body;
    const existe = await prisma.user.findUnique({ where: { email } });
    if (existe) return res.status(400).json({ error: 'Ya existe un usuario con ese correo' });

    const bcrypt = await import('bcryptjs');
    const hash = await bcrypt.default.hash(password, 10);

    const nuevo = await prisma.user.create({
      data: { nombre, email, password: hash, cargo, rol: 'EQUIPO' },
      select: { id: true, nombre: true, email: true, cargo: true, createdAt: true },
    });

    res.status(201).json(nuevo);
  } catch (error) {
    next(error);
  }
});

// ── DELETE /equipo/:id — Coordinador elimina colaborador ──
router.delete('/equipo/:id', authorizeRoles('ADMIN', 'DIRECTOR'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (user.rol !== 'EQUIPO') return res.status(400).json({ error: 'Solo se puede eliminar colaboradores con rol EQUIPO' });

    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

// ── GET /agentes — Semáforo de agentes ───────────────────
router.get('/agentes', authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'), async (req, res, next) => {
  try {
    const agentes = await prisma.user.findMany({
      where: { rol: { in: ['EQUIPO', 'ADMIN', 'DIRECTOR'] } },
      select: { id: true, nombre: true, cargo: true, rol: true },
      orderBy: { nombre: 'asc' },
    });

    const ticketsActivos = await prisma.ticketTI.findMany({
      where: { estado: { in: ['ASIGNADO', 'EN_PROCESO'] } },
      select: { agenteId: true },
    });

    const agentesOcupados = new Set(ticketsActivos.map(t => t.agenteId));

    const resultado = agentes.map(a => ({
      ...a,
      ocupado: agentesOcupados.has(a.id),
    }));

    res.json(resultado);
  } catch (error) {
    next(error);
  }
});

// ── GET /metricas — Dashboard de métricas ────────────────
router.get('/metricas', authorizeRoles('ADMIN', 'DIRECTOR'), async (req, res, next) => {
  try {
    const todos = await prisma.ticketTI.findMany({
      include: { agente: { select: { id: true, nombre: true } } },
    });

    const total = todos.length;
    const pendientes = todos.filter(t => t.estado === 'PENDIENTE').length;
    const asignados = todos.filter(t => t.estado === 'ASIGNADO').length;
    const enProceso = todos.filter(t => t.estado === 'EN_PROCESO').length;
    const cumplidos = todos.filter(t => t.estado === 'CUMPLIDO').length;
    const escalados = todos.filter(t => t.estado === 'ESCALADO').length;

    // Tiempo promedio de respuesta (creación → asignación)
    const conAsignado = todos.filter(t => t.asignadoAt);
    const tiempoRespuestaPromedio = conAsignado.length > 0
      ? conAsignado.reduce((acc, t) => acc + (new Date(t.asignadoAt) - new Date(t.createdAt)) / 60000, 0) / conAsignado.length
      : 0;

    // Tiempo promedio de atención (iniciar → finalizar)
    const conCumplido = todos.filter(t => t.cumplidoAt && t.iniciadoAt);
    const tiempoAtencionPromedio = conCumplido.length > 0
      ? conCumplido.reduce((acc, t) => acc + (new Date(t.cumplidoAt) - new Date(t.iniciadoAt)) / 60000, 0) / conCumplido.length
      : 0;

    // Tiempo total promedio (creación → finalización)
    const conResuelto = todos.filter(t => t.cumplidoAt);
    const tiempoTotalPromedio = conResuelto.length > 0
      ? conResuelto.reduce((acc, t) => acc + (new Date(t.cumplidoAt) - new Date(t.createdAt)) / 60000, 0) / conResuelto.length
      : 0;

    // Por agente
    const agentesMap = {};
    todos.filter(t => t.agente).forEach(t => {
      if (!agentesMap[t.agente.id]) {
        agentesMap[t.agente.id] = { nombre: t.agente.nombre, total: 0, tiempoTotal: 0, cumplidos: 0, escalados: 0 };
      }
      agentesMap[t.agente.id].total++;
      if (t.cumplidoAt && t.iniciadoAt) {
        agentesMap[t.agente.id].tiempoTotal += (new Date(t.cumplidoAt) - new Date(t.iniciadoAt)) / 60000;
        agentesMap[t.agente.id].cumplidos++;
      }
    });
    todos.filter(t => t.estado === 'ESCALADO' && t.nota).forEach(t => {
      const match = t.nota.match(/Escalado por (.+?):/);
      if (match) {
        const entry = Object.values(agentesMap).find(a => a.nombre === match[1]);
        if (entry) entry.escalados++;
      }
    });
    const porAgente = Object.entries(agentesMap).map(([id, data]) => ({
      agenteId: parseInt(id),
      nombre: data.nombre,
      totalAtendidos: data.total,
      cumplidos: data.cumplidos,
      escalados: data.escalados,
      tiempoPromedioAtencion: data.cumplidos > 0 ? Math.round(data.tiempoTotal / data.cumplidos) : 0,
    }));

    // Por sede
    const sedesMap = {};
    todos.forEach(t => {
      if (!sedesMap[t.sede]) sedesMap[t.sede] = { total: 0, tiempoTotal: 0, cumplidos: 0 };
      sedesMap[t.sede].total++;
      if (t.cumplidoAt && t.iniciadoAt) {
        sedesMap[t.sede].tiempoTotal += (new Date(t.cumplidoAt) - new Date(t.iniciadoAt)) / 60000;
        sedesMap[t.sede].cumplidos++;
      }
    });
    const porSede = Object.entries(sedesMap).map(([sede, data]) => ({
      sede,
      total: data.total,
      tiempoPromedioAtencion: data.cumplidos > 0 ? Math.round(data.tiempoTotal / data.cumplidos) : 0,
    }));

    // Por prioridad
    const prioridadMap = { ALTA: { total: 0, cumplidos: 0 }, MEDIA: { total: 0, cumplidos: 0 }, BAJA: { total: 0, cumplidos: 0 }, SIN_CLASIFICAR: { total: 0, cumplidos: 0 } };
    todos.forEach(t => {
      const key = t.prioridad || 'SIN_CLASIFICAR';
      if (!prioridadMap[key]) return;
      prioridadMap[key].total++;
      if (t.estado === 'CUMPLIDO') prioridadMap[key].cumplidos++;
    });
    const porPrioridad = Object.entries(prioridadMap).map(([prioridad, data]) => ({ prioridad, ...data }));

    // Por categoría
    const categoriaMap = {};
    todos.forEach(t => {
      categoriaMap[t.categoria] = (categoriaMap[t.categoria] || 0) + 1;
    });
    const porCategoria = Object.entries(categoriaMap).map(([categoria, total]) => ({ categoria, total }));

    res.json({
      total,
      pendientes,
      asignados,
      enProceso,
      cumplidos,
      escalados,
      tiempoRespuestaPromedio: Math.round(tiempoRespuestaPromedio),
      tiempoAtencionPromedio: Math.round(tiempoAtencionPromedio),
      tiempoTotalPromedio: Math.round(tiempoTotalPromedio),
      porAgente,
      porSede,
      porPrioridad,
      porCategoria,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
