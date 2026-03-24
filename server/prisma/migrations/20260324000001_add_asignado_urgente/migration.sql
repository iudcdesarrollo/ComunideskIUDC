-- CreateTable
CREATE TABLE "_UrgenteAsignado" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_UrgenteAsignado_A_fkey" FOREIGN KEY ("A") REFERENCES "Urgente"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_UrgenteAsignado_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_UrgenteAsignado_AB_unique" ON "_UrgenteAsignado"("A", "B");

-- CreateIndex
CREATE INDEX "_UrgenteAsignado_B_index" ON "_UrgenteAsignado"("B");
