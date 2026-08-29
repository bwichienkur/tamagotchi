import { redirect } from "next/navigation";
import { hasDatabaseConfig } from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function ensureDatabase(): Promise<void> {
  if (!hasDatabaseConfig()) {
    redirect("/setup");
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    redirect("/setup");
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
