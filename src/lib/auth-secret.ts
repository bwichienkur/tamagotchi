import "@/lib/bootstrap-env";

/**
 * Vercel/Neon integration prefixes env vars with the project name.
 * e.g. tamagotchi_AUTH_SECRET, tamagotchi_POSTGRES_PRISMA_URL
 */
const STORAGE_PREFIX = "tamagotchi_";

function env(name: string): string | undefined {
  return process.env[`${STORAGE_PREFIX}${name}`] ?? process.env[name];
}

/** Shared secret resolution for NextAuth and middleware. */
export function getAuthSecret(): string | undefined {
  return env("AUTH_SECRET") ?? env("NEXTAUTH_SECRET");
}

export function getAuthUrl(): string | undefined {
  return env("AUTH_URL") ?? env("NEXTAUTH_URL");
}

export function isAuthConfigured(): boolean {
  return Boolean(getAuthSecret());
}
