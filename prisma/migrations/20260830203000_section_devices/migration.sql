-- Drop series support; each TamaShell section is now its own device.
ALTER TABLE "DeviceModel" DROP CONSTRAINT IF EXISTS "DeviceModel_seriesId_fkey";
DROP INDEX IF EXISTS "DeviceModel_seriesId_idx";
ALTER TABLE "DeviceModel" DROP COLUMN IF EXISTS "seriesId";
ALTER TABLE "DeviceModel" DROP COLUMN IF EXISTS "generation";
DROP TABLE IF EXISTS "DeviceSeries";
