-- CreateTable
CREATE TABLE "DeviceSeries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceSeries_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "DeviceModel" ADD COLUMN "seriesId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSeries_slug_key" ON "DeviceSeries"("slug");

-- CreateIndex
CREATE INDEX "DeviceSeries_familyId_idx" ON "DeviceSeries"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceSeries_familyId_name_key" ON "DeviceSeries"("familyId", "name");

-- CreateIndex
CREATE INDEX "DeviceModel_seriesId_idx" ON "DeviceModel"("seriesId");

-- AddForeignKey
ALTER TABLE "DeviceSeries" ADD CONSTRAINT "DeviceSeries_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "DeviceFamily"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeviceModel" ADD CONSTRAINT "DeviceModel_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "DeviceSeries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
