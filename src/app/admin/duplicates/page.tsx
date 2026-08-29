import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { MergeDevicesClient } from "@/components/admin/merge-devices-client";

export default async function AdminDuplicatesPage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <Link href="/admin">
          <Button variant="ghost" size="sm">← Admin</Button>
        </Link>
      </div>
      <h1 className="mb-8 text-2xl font-bold">Duplicate Review & Merge</h1>
      <MergeDevicesClient />
    </div>
  );
}
