/**
 * Neon/Vercel integration prefixes all storage env vars with the project name.
 * e.g. tamagotchi_POSTGRES_PRISMA_URL, tamagotchi_DATABASE_URL, etc.
 */
const STORAGE_PREFIX = "tamagotchi_";

function env(name: string): string | undefined {
  return process.env[`${STORAGE_PREFIX}${name}`] ?? process.env[name];
}

/** Pooled URL for Prisma Client at runtime (serverless-friendly). */
export function getDatabaseUrl(): string | undefined {
  return (
    env("POSTGRES_PRISMA_URL") ??
    env("DATABASE_URL") ??
    env("POSTGRES_URL")
  );
}

/** Direct/unpooled URL for migrations and seeds. */
export function getMigrationDatabaseUrl(): string | undefined {
  return (
    env("DATABASE_URL_UNPOOLED") ??
    env("POSTGRES_URL_NON_POOLING") ??
    env("POSTGRES_URL_NO_SSL") ??
    getDatabaseUrl()
  );
}

export function hasDatabaseConfig(): boolean {
  return Boolean(getDatabaseUrl());
}
