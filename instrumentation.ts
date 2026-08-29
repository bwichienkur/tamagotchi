export async function register() {
  const { bootstrapAuthEnv } = await import("@/lib/bootstrap-env");
  bootstrapAuthEnv();
}
