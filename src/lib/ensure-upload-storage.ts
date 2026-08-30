import pg from "pg";
import { getMigrationDatabaseUrl } from "@/lib/db";
import { prisma } from "@/lib/prisma";

let userUploadTableReady: boolean | null = null;

export function isMissingUserUploadTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("userupload") &&
    (message.includes("does not exist") || message.includes("not exist"))
  );
}

async function createUserUploadTableWithDirectConnection(): Promise<void> {
  const connectionString = getMigrationDatabaseUrl();
  if (!connectionString) {
    throw new Error("Database is not configured for upload storage.");
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
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "UserUpload" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "filename" TEXT NOT NULL,
        "mimeType" TEXT NOT NULL,
        "data" BYTEA NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "UserUpload_pkey" PRIMARY KEY ("id")
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS "UserUpload_userId_idx" ON "UserUpload"("userId");
    `);

    try {
      await pool.query(`
        ALTER TABLE "UserUpload"
        ADD CONSTRAINT "UserUpload_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch {
      // Constraint already exists.
    }
  } finally {
    await pool.end();
  }
}

/** Self-heal when a deploy skipped the UserUpload migration. */
export async function ensureUserUploadTable(): Promise<void> {
  if (userUploadTableReady) return;

  try {
    await prisma.$queryRaw`SELECT 1 FROM "UserUpload" LIMIT 1`;
    userUploadTableReady = true;
    return;
  } catch (error) {
    if (!isMissingUserUploadTableError(error)) throw error;
  }

  await createUserUploadTableWithDirectConnection();
  userUploadTableReady = true;
}
