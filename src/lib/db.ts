/**
 * Database URL from environment.
 * Vercel: tamagotchi_DATABASE_URL
 * Local/fallback: DATABASE_URL
 */
export function getDatabaseUrl(): string | undefined {
  return process.env.tamagotchi_DATABASE_URL ?? process.env.DATABASE_URL;
}
