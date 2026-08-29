"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { loginAction } from "@/app/login/actions";
import { APP_NAME, DEMO_EMAIL } from "@/lib/app-name";
import { AppLogo } from "@/components/ui/app-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/collection";
  const [state, formAction, pending] = useActionState(loginAction, null);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Card className="cute-card w-full max-w-md border-tama-cyan/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 animate-float">
            <AppLogo size="md" />
          </div>
          <CardTitle className="font-display text-2xl">Welcome to {APP_NAME}</CardTitle>
          <CardDescription>
            Sign in to manage your Tamagotchi collection ✿
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={DEMO_EMAIL}
                autoComplete="email"
                required
                className="rounded-xl border-tama-cyan/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                defaultValue="demo1234"
                autoComplete="current-password"
                required
                className="rounded-xl border-tama-cyan/20"
              />
            </div>
            {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
            <Button type="submit" className="w-full rounded-full" disabled={pending}>
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-stone-400">
            Demo: {DEMO_EMAIL} / demo1234
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
