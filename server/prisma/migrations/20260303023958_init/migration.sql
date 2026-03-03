-- AlterTable
ALTER TABLE "ReservaRadio" ALTER COLUMN "estado" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Solicitud" ALTER COLUMN "estado" DROP DEFAULT,
ALTER COLUMN "prioridad" DROP DEFAULT,
ALTER COLUMN "datos" DROP DEFAULT;

-- AlterTable
ALTER TABLE "TipoSolicitud" ALTER COLUMN "tiempoEntrega" DROP DEFAULT,
ALTER COLUMN "tiempoDetalle" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Urgente" ALTER COLUMN "estado" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "rol" DROP DEFAULT;
