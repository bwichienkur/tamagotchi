"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="pt-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl">
            !
          </div>
          <h1 className="text-xl font-bold text-stone-900">Something went wrong</h1>
          <p className="mt-3 text-sm text-stone-600">
            This page could not be loaded. If you just deployed, the database may need
            migrations — run{" "}
            <code className="rounded bg-stone-100 px-1">npx prisma migrate deploy</code>{" "}
            and{" "}
            <code className="rounded bg-stone-100 px-1">npm run db:seed</code>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link href="/setup">
              <Button variant="outline">Setup guide</Button>
            </Link>
            <Link href="/">
              <Button variant="ghost">Home</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
