import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/stats/dashboard
 * Protected: ADMIN, EQUIPO
 * Returns aggregated metrics for dashboard
 */
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles('ADMIN', 'DIRECTOR', 'EQUIPO'),
  async (req, res, next) => {
    try {
      // Total solicitudes
      const total = await prisma.solicitud.count();

      // Count by estado
      const porEstado = await prisma.solicitud.groupBy({
        by: ['estado'],
        _count: true,
      });

      const estadoMap = {
        PENDIENTE: 0,
        EN_PROCESO: 0,
        COMPLETADA: 0,
        RECHAZADA: 0,
      };

      porEstado.forEach((item) => {
        estadoMap[item.estado] = item._count;
      });

      // Count by tipo (exclude 'radio')
      const porTipoRaw = await prisma.solicitud.groupBy({
        by: ['tipoId'],
        _count: true,
      });

      const porTipo = [];
      for (const item of porTipoRaw) {
        const tipo = await prisma.tipoSolicitud.findUnique({
          where: { id: item.tipoId },
        });
        if (tipo && item.tipoId !== 'radio') {
          porTipo.push({
            id: tipo.id,
            nombre: tipo.nombre,
            cantidad: item._count,
          });
        }
      }

      // Count by prioridad
      const porPrioridadRaw = await prisma.solicitud.groupBy({
        by: ['prioridad'],
        _count: true,
      });

      const porPrioridad = {
        alta: 0,
        media: 0,
        baja: 0,
      };

      porPrioridadRaw.forEach((item) => {
        const key = item.prioridad.toLowerCase();
        porPrioridad[key] = item._count;
      });

      // Asignaciones per team member
      const solicitudesConAsignacion = await prisma.solicitud.findMany({
        where: { asignadoAId: { not: null } },
        include: {
          asignadoA: true,
        },
      });

      const asignaciones = {};
      solicitudesConAsignacion.forEach((sol) => {
        const nombre = sol.asignadoA.nombre;
        if (!asignaciones[nombre]) {
          asignaciones[nombre] = {
            total: 0,
            completadas: 0,
            enProceso: 0,
          };
        }
        asignaciones[nombre].total += 1;
        if (sol.estado === 'COMPLETADA') {
          asignaciones[nombre].completadas += 1;
        } else if (sol.estado === 'EN_PROCESO') {
          asignaciones[nombre].enProceso += 1;
        }
      });

      // Tasa de completado
      const tasaCompletado =
        total > 0 ? Math.round((estadoMap.COMPLETADA / total) * 100) : 0;

      res.json({
        total,
        pendientes: estadoMap.PENDIENTE,
        enProceso: estadoMap.EN_PROCESO,
        completadas: estadoMap.COMPLETADA,
        rechazadas: estadoMap.RECHAZADA,
        porTipo,
        porPrioridad,
        asignaciones,
        tasaCompletado,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
