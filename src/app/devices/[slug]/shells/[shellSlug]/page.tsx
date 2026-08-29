import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WikiInfobox } from "@/components/wiki/wiki-infobox";
import { Button } from "@/components/ui/button";

export default async function ShellDetailPage({
  params,
}: {
  params: Promise<{ slug: string; shellSlug: string }>;
}) {
  const { slug, shellSlug } = await params;
  const session = await auth();

  const shell = await prisma.shell.findFirst({
    where: {
      slug: shellSlug,
      deviceModel: { slug },
    },
    include: {
      deviceModel: { include: { family: true } },
      ownedDevices: session?.user?.id
        ? { where: { userId: session.user.id } }
        : false,
    },
  });

  if (!shell) notFound();

  const owned = Array.isArray(shell.ownedDevices) && shell.ownedDevices.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-stone-500">
        <Link href="/shells" className="hover:text-tama-cyan">Shell Catalog</Link>
        <span className="mx-2">/</span>
        <Link href={`/devices/${shell.deviceModel.slug}`} className="hover:text-tama-cyan">
          {shell.deviceModel.name}
        </Link>
        <span className="mx-2">/</span>
        <span>{shell.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-3xl font-bold">{shell.name}</h1>
          <p className="mt-1 text-stone-500">{shell.deviceModel.name}</p>
          {shell.colorDescription && (
            <p className="mt-4 text-stone-600">{shell.colorDescription}</p>
          )}
          {shell.notes && <p className="mt-2 text-stone-500">{shell.notes}</p>}
        </div>
        <WikiInfobox
          title="Shell Details"
          image={shell.primaryImage ?? "/placeholder-device.svg"}
          fields={[
            { label: "Device", value: shell.deviceModel.name, href: `/devices/${shell.deviceModel.slug}` },
            { label: "Region", value: shell.region ?? "—" },
            { label: "Year", value: shell.year?.toString() ?? "—" },
            { label: "Wave", value: shell.wave ?? "—" },
            { label: "Rarity", value: shell.rarity ?? "—" },
          ]}
        />
      </div>

      {owned ? (
        <div className="mt-6 text-tama-cyan">✓ Owned</div>
      ) : session?.user ? (
        <Link href={`/collection/add`} className="mt-6 inline-block">
          <Button>Add to Collection</Button>
        </Link>
      ) : null}

      {shell.sourceName && (
        <p className="mt-8 text-xs text-stone-400">
          Source:{" "}
          {shell.sourceUrl ? (
            <a href={shell.sourceUrl} className="text-tama-cyan hover:underline">
              {shell.sourceName}
            </a>
          ) : (
            shell.sourceName
          )}
        </p>
      )}
    </div>
  );
}
