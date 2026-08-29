/**
 * Vercel Blob storage env.
 *
 * Unlike Neon/Postgres vars (tamagotchi_POSTGRES_PRISMA_URL), Vercel injects
 * BLOB_READ_WRITE_TOKEN without the project prefix when a Blob store is linked.
 */
export function getBlobReadWriteToken(): string | undefined {
  const token =
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
    process.env.tamagotchi_BLOB_READ_WRITE_TOKEN?.trim() ||
    undefined;

  // @vercel/blob reads BLOB_READ_WRITE_TOKEN by default when token is omitted.
  if (token && !process.env.BLOB_READ_WRITE_TOKEN) {
    process.env.BLOB_READ_WRITE_TOKEN = token;
  }

  return token;
}

export function hasBlobStorage(): boolean {
  return Boolean(getBlobReadWriteToken());
}
