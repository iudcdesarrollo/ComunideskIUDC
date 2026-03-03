import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function crearNotificacion({ userId, tipo, titulo, mensaje, referenceId = null }) {
  try {
    await prisma.notificacion.create({
      data: { userId, tipo, titulo, mensaje, referenceId }
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw — notifications should never break the main flow
  }
}
