import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function getSession() {
  return auth();
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "admin") {
    redirect("/");
  }
  return session;
}

/** For API route handlers — returns null instead of redirecting. */
export async function getApiSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session;
}
