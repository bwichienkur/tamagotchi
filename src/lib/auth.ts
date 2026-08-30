import "@/lib/bootstrap-env";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAuthSecret } from "@/lib/auth-secret";
import { authConfig } from "@/lib/auth.config";
import { DEMO_EMAIL, ensureDemoUser } from "@/lib/demo-user";

function authSecret() {
  return getAuthSecret();
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        if (!authSecret()) {
          console.error("Sign-in blocked: AUTH_SECRET is not configured");
          return null;
        }

        try {
          const email = String(credentials.email).trim().toLowerCase();
          const password = String(credentials.password);

          let user = await prisma.user.findUnique({ where: { email } });

          if (!user && email === DEMO_EMAIL) {
            user = await ensureDemoUser();
          }

          if (!user?.passwordHash) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth authorize error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          token.role = dbUser?.role ?? "user";
        } catch (error) {
          console.error("Auth jwt callback error:", error);
          token.role = "user";
        }
        return token;
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true },
          });
          if (!dbUser) {
            delete token.id;
            delete token.role;
            return token;
          }
          token.role = dbUser.role;
        } catch (error) {
          console.error("Auth jwt refresh error:", error);
        }
      }

      return token;
    },
  },
});
