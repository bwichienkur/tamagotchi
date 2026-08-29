import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to your environment variables before starting the app."
    );
  }

  const pool = new pg.Pool({
    connectionString,
    max: process.env.VERCEL ? 1 : 10,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 10_000,
    ssl: connectionString.includes("sslmode=require")
      ? { rejectUnauthorized: false }
      : undefined,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
