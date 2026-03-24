-- AlterTable
ALTER TABLE "Urgente" ADD COLUMN "asignadoId" INTEGER;

-- AddForeignKey
ALTER TABLE "Urgente" ADD CONSTRAINT "Urgente_asignadoId_fkey" FOREIGN KEY ("asignadoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
