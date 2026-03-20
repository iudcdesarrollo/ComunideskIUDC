-- AlterTable
ALTER TABLE "ReservaValleIA" ADD COLUMN "qrToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ReservaValleIA_qrToken_key" ON "ReservaValleIA"("qrToken");
