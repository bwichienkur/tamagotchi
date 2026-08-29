import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DatabaseSetupPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg items-center px-4 py-16">
      <Card className="w-full">
        <CardContent className="pt-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl">
            !
          </div>
          <h1 className="text-xl font-bold text-stone-900">Database not configured</h1>
          <p className="mt-3 text-sm text-stone-600">
            TamaDex could not connect to PostgreSQL. Set{" "}
            <code className="rounded bg-stone-100 px-1">tamagotchi_DATABASE_URL</code> in your
            environment variables, then run migrations:
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-stone-900 p-4 text-left text-xs text-stone-100">
            {`npx prisma migrate deploy\nnpm run db:seed`}
          </pre>
          <Link href="/login" className="mt-6 inline-block">
            <Button variant="outline">Try again</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
