import pg from "pg";
import { getMigrationDatabaseUrl } from "@/lib/db";
import { prisma } from "@/lib/prisma";

let photoFramesColumnReady: boolean | null = null;

export function isMissingPhotoFramesColumnError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("photoframes") && message.includes("does not exist");
}

async function addPhotoFramesColumnWithDirectConnection(): Promise<void> {
  const connectionString = getMigrationDatabaseUrl();
  if (!connectionString) {
    throw new Error("Database is not configured for photo frame storage.");
  }

  const pool = new pg.Pool({
    connectionString,
    max: 1,
    ssl:
      connectionString.includes("sslmode=require") ||
      connectionString.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  try {
    await pool.query(`ALTER TABLE "OwnedDevice" ADD COLUMN IF NOT EXISTS "photoFrames" JSONB;`);
  } finally {
    await pool.end();
  }
}

/** Self-heal when a deploy skipped the photoFrames migration. */
export async function ensurePhotoFramesColumn(): Promise<void> {
  if (photoFramesColumnReady) return;

  try {
    await prisma.$queryRaw`SELECT "photoFrames" FROM "OwnedDevice" LIMIT 1`;
    photoFramesColumnReady = true;
    return;
  } catch (error) {
    if (!isMissingPhotoFramesColumnError(error)) throw error;
  }

  await addPhotoFramesColumnWithDirectConnection();
  photoFramesColumnReady = true;
}
