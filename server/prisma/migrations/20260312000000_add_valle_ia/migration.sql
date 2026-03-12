-- CreateTable
CREATE TABLE "ReservaValleIA" (
    "id" SERIAL NOT NULL,
    "dia" TEXT NOT NULL,
    "hora" TEXT NOT NULL,
    "semana" TEXT NOT NULL,
    "estado" "EstadoReserva" NOT NULL,
    "solicitanteId" INTEGER NOT NULL,
    "formulario" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservaValleIA_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReservaValleIA" ADD CONSTRAINT "ReservaValleIA_solicitanteId_fkey" FOREIGN KEY ("solicitanteId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
