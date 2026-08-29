import { TamaShellImportClient } from "@/components/admin/tamashell-import";
import { requireAdmin } from "@/lib/session";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TamaShellImportPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">← Admin</Button>
        </Link>
      </div>
      <TamaShellImportClient />
    </div>
  );
}
