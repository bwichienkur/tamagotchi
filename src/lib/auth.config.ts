import type { NextAuthConfig } from "next-auth";
import { getAuthSecret } from "@/lib/auth-secret";

export const authConfig = {
  trustHost: true,
  secret: getAuthSecret(),
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
