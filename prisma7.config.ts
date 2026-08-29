import "dotenv/config";
import { defineConfig } from "prisma/config";

const STORAGE_PREFIX = "tamagotchi_";

function env(name: string): string | undefined {
  return process.env[`${STORAGE_PREFIX}${name}`] ?? process.env[name];
}

const databaseUrl =
  env("DATABASE_URL_UNPOOLED") ??
  env("POSTGRES_URL_NON_POOLING") ??
  env("POSTGRES_PRISMA_URL") ??
  env("DATABASE_URL") ??
  env("POSTGRES_URL");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
