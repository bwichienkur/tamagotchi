import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { hasDatabaseConfig } from "@/lib/db";
import { prisma } from "@/lib/prisma";

const SETUP_ERROR_CODES = new Set([
  "P1000",
  "P1001",
  "P1003",
  "P1017",
  "P2021",
  "P2022",
]);

export function isDatabaseSetupError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return SETUP_ERROR_CODES.has(error.code);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("database url is not set") ||
      message.includes("database is not configured") ||
      message.includes("can't reach database") ||
      message.includes("connection")
    );
  }

  return false;
}

let databaseReady: boolean | null = null;
let databaseReadyAt = 0;
const DATABASE_CHECK_MS = 60_000;

export async function ensureDatabase(): Promise<void> {
  if (!hasDatabaseConfig()) {
    redirect("/setup");
  }

  const now = Date.now();
  if (databaseReady && now - databaseReadyAt < DATABASE_CHECK_MS) {
    return;
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.deviceFamily.findFirst({ select: { id: true } });
    databaseReady = true;
    databaseReadyAt = now;
  } catch (error) {
    databaseReady = false;
    if (isDatabaseSetupError(error)) {
      redirect("/setup");
    }
    throw error;
  }
}

export async function withDatabase<T>(fn: () => Promise<T>): Promise<T> {
  await ensureDatabase();

  try {
    return await fn();
  } catch (error) {
    if (isDatabaseSetupError(error)) {
      redirect("/setup");
    }
    throw error;
  }
}

export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error("Database query failed:", error);
    return fallback;
  }
}
