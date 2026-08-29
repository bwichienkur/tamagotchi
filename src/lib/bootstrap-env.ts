/**
 * Map Vercel/Neon prefixed env vars to the standard names Auth.js expects.
 * Import this module before NextAuth or middleware run.
 */
const STORAGE_PREFIX = "tamagotchi_";

const AUTH_ENV_KEYS = [
  "AUTH_SECRET",
  "NEXTAUTH_SECRET",
  "AUTH_URL",
  "NEXTAUTH_URL",
] as const;

const STORAGE_ENV_KEYS = ["BLOB_READ_WRITE_TOKEN"] as const;

export function bootstrapAuthEnv(): void {
  for (const key of AUTH_ENV_KEYS) {
    const prefixed = process.env[`${STORAGE_PREFIX}${key}`];
    if (prefixed && !process.env[key]) {
      process.env[key] = prefixed;
    }
  }

  for (const key of STORAGE_ENV_KEYS) {
    const prefixed = process.env[`${STORAGE_PREFIX}${key}`];
    if (prefixed && !process.env[key]) {
      process.env[key] = prefixed;
    }
  }

  if (!process.env.AUTH_URL && !process.env.NEXTAUTH_URL && process.env.VERCEL_URL) {
    process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
  }
}

bootstrapAuthEnv();
