-- CreateEnum
CREATE TYPE "TipoPQRS" AS ENUM ('PETICION', 'QUEJA', 'RECLAMO', 'SUGERENCIA', 'FELICITACION');

-- CreateEnum
CREATE TYPE "EstadoPQRS" AS ENUM ('PENDIENTE', 'EN_REVISION', 'RESUELTA', 'CERRADA');

-- CreateTable
CREATE TABLE "AsistenciaValle" (
    "id" SERIAL NOT NULL,
    "reservaId" INTEGER NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "programa" TEXT NOT NULL,
    "semestre" TEXT NOT NULL,
    "nombreProfesor" TEXT NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "calificacionClase" INTEGER,
    "calificacionHerramientas" INTEGER,
    "queMejorar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AsistenciaValle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PQRS" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoPQRS" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" "EstadoPQRS" NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "solicitanteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PQRS_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AsistenciaValle" ADD CONSTRAINT "AsistenciaValle_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "ReservaValleIA"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PQRS" ADD CONSTRAINT "PQRS_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
