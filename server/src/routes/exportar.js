import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * Helper: Generate CSV with BOM for Excel compatibility
 */
function generateCSV(data, columns) {
  const header = columns.map((c) => c.label).join(',');
  const rows = data.map((d) =>
    columns
      .map((c) => {
        const val = c.getValue(d);
        return `"${String(val || '').replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return '\uFEFF' + [header, ...rows].join('\n');
}

/**
 * GET /api/exportar/solicitudes
 * Protected: ADMIN
 * Export all solicitudes as CSV
 */
router.get(
  '/solicitudes',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR'),
  async (req, res, next) => {
    try {
      const solicitudes = await prisma.solicitud.findMany({
        include: {
          solicitante: true,
          asignadoA: true,
          tipo: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const columns = [
        {
          label: 'Ticket',
          getValue: (s) => s.id,
        },
        {
          label: 'Tipo',
          getValue: (s) => s.tipo.nombre,
        },
        {
          label: 'Título',
          getValue: (s) => s.titulo,
        },
        {
          label: 'Descripción',
          getValue: (s) => s.descripcion,
        },
        {
          label: 'Solicitante',
          getValue: (s) => s.solicitante.nombre,
        },
        {
          label: 'Cargo',
          getValue: (s) => s.solicitante.cargo,
        },
        {
          label: 'Estado',
          getValue: (s) => {
            const estadoMap = {
              PENDIENTE: 'Pendiente',
              EN_PROCESO: 'En Proceso',
              COMPLETADA: 'Completada',
              RECHAZADA: 'Rechazada',
            };
            return estadoMap[s.estado] || s.estado;
          },
        },
        {
          label: 'Prioridad',
          getValue: (s) => {
            const prioridadMap = {
              ALTA: 'Alta',
              MEDIA: 'Media',
              BAJA: 'Baja',
            };
            return prioridadMap[s.prioridad] || s.prioridad;
          },
        },
        {
          label: 'Asignado a',
          getValue: (s) => s.asignadoA?.nombre || '',
        },
        {
          label: 'Fecha de creación',
          getValue: (s) => new Date(s.createdAt).toLocaleDateString('es-ES'),
        },
      ];

      const csv = generateCSV(solicitudes, columns);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="solicitudes_comunidesk.csv"'
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/exportar/radio
 * Protected: ADMIN
 * Export all reservas as CSV
 */
router.get(
  '/radio',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR'),
  async (req, res, next) => {
    try {
      const reservas = await prisma.reservaRadio.findMany({
        include: {
          solicitante: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const columns = [
        {
          label: 'Programa',
          getValue: (r) => r.formulario?.programa || '',
        },
        {
          label: 'Día',
          getValue: (r) => r.dia,
        },
        {
          label: 'Hora',
          getValue: (r) => r.hora,
        },
        {
          label: 'Semana',
          getValue: (r) => r.semana,
        },
        {
          label: 'Solicitante',
          getValue: (r) => r.solicitante.nombre,
        },
        {
          label: 'Estado',
          getValue: (r) => {
            const estadoMap = {
              PENDIENTE: 'Pendiente',
              APROBADA: 'Aprobada',
              RECHAZADA: 'Rechazada',
            };
            return estadoMap[r.estado] || r.estado;
          },
        },
        {
          label: 'Tema',
          getValue: (r) => r.formulario?.tema || '',
        },
        {
          label: 'Conductor',
          getValue: (r) => r.formulario?.conductor || '',
        },
      ];

      const csv = generateCSV(reservas, columns);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="reservas_radio_comunidesk.csv"'
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/exportar/urgentes
 * Protected: ADMIN
 * Export all urgentes as CSV
 */
router.get(
  '/urgentes',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR'),
  async (req, res, next) => {
    try {
      const urgentes = await prisma.urgente.findMany({
        include: {
          solicitante: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const columns = [
        {
          label: 'Título',
          getValue: (u) => u.titulo,
        },
        {
          label: 'Descripción',
          getValue: (u) => u.descripcion,
        },
        {
          label: 'Solicitante',
          getValue: (u) => u.solicitante.nombre,
        },
        {
          label: 'Cargo',
          getValue: (u) => u.solicitante.cargo,
        },
        {
          label: 'Estado',
          getValue: (u) => {
            const estadoMap = {
              PENDIENTE: 'Pendiente',
              EN_PROCESO: 'En Proceso',
              RESUELTO: 'Resuelto',
            };
            return estadoMap[u.estado] || u.estado;
          },
        },
        {
          label: 'Fecha',
          getValue: (u) => new Date(u.createdAt).toLocaleDateString('es-ES'),
        },
      ];

      const csv = generateCSV(urgentes, columns);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="urgentes_comunidesk.csv"'
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
