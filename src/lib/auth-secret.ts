/** Shared secret resolution for NextAuth and middleware. */
export function getAuthSecret(): string | undefined {
  return process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
}
