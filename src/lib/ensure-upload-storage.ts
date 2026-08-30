import { prisma } from "@/lib/prisma";

let userUploadTableReady: boolean | null = null;

export function isMissingTableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return (
    message.includes("userupload") ||
    message.includes('relation "userupload" does not exist') ||
    message.includes("does not exist")
  );
}

/** Self-heal when a deploy skipped the UserUpload migration (common on first upload after deploy). */
export async function ensureUserUploadTable(): Promise<void> {
  if (userUploadTableReady) return;

  try {
    await prisma.$queryRaw`SELECT 1 FROM "UserUpload" LIMIT 1`;
    userUploadTableReady = true;
    return;
  } catch (error) {
    if (!isMissingTableError(error)) throw error;
  }

  await prisma.$executeRawUnsafe(`
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

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "UserUpload_userId_idx" ON "UserUpload"("userId");
  `);

  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "UserUpload"
      ADD CONSTRAINT "UserUpload_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
  } catch {
    // Constraint already exists.
  }

  userUploadTableReady = true;
}
