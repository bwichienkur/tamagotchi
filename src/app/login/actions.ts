"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { bootstrapAuthEnv } from "@/lib/bootstrap-env";
import { getAuthSecret } from "@/lib/auth-secret";

export type LoginState = { error?: string } | null;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  bootstrapAuthEnv();

  if (!getAuthSecret()) {
    return {
      error: "Sign-in is not configured. Set tamagotchi_AUTH_SECRET in Vercel.",
    };
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("callbackUrl") ?? "/collection");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { error: "Invalid email or password." };
      }
      return { error: "Sign-in failed. Check server configuration." };
    }
    throw error;
  }

  return { error: "Sign-in failed. Please try again." };
}
