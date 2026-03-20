-- CreateTable
CREATE TABLE "InteresadoNocturna" (
    "id" SERIAL NOT NULL,
    "nombreCompleto" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "programa" TEXT,
    "semestre" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InteresadoNocturna_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InteresadoNocturna_cedula_key" ON "InteresadoNocturna"("cedula");
