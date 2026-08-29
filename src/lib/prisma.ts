import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getDatabaseUrl, hasDatabaseConfig } from "@/lib/db";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    throw new Error(
      "Database URL is not set. Add Neon storage variables (e.g. tamagotchi_POSTGRES_PRISMA_URL or tamagotchi_DATABASE_URL) to your environment."
    );
  }

  const pool = new pg.Pool({
    connectionString,
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ssl:
      connectionString.includes("sslmode=require") ||
      connectionString.includes("neon.tech")
        ? { rejectUnauthorized: false }
        : undefined,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/** Lazy proxy — does not connect until first query (safe for Vercel build). */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!hasDatabaseConfig()) {
      throw new Error(
        "Database is not configured. Set tamagotchi_POSTGRES_PRISMA_URL or tamagotchi_DATABASE_URL."
      );
    }
    const client = getPrisma();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
