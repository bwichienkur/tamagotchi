import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { WikiPageView } from "@/components/wiki/wiki-page-view";

export default async function DeviceModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const device = await prisma.deviceModel.findUnique({
    where: { slug },
    include: {
      family: true,
      properties: { orderBy: { sortOrder: "asc" } },
      shells: { orderBy: { name: "asc" } },
      predecessor: true,
      successors: true,
      wikiPages: { where: { pageType: "DEVICE" }, take: 1 },
    },
  });

  if (!device) notFound();

  const wikiPage =
    device.wikiPages[0] ??
    (await prisma.wikiPage.findFirst({
      where: { deviceModelId: device.id },
    }));

  const ownedCount = session?.user?.id
    ? await prisma.ownedDevice.count({
        where: { userId: session.user.id, deviceModelId: device.id },
      })
    : 0;

  if (wikiPage) {
    const fullPage = await prisma.wikiPage.findUnique({
      where: { id: wikiPage.id },
      include: {
        deviceModel: { include: { family: true, properties: true, shells: true } },
        citations: true,
        children: true,
        parent: true,
      },
    });

    if (fullPage) {
      return (
        <WikiPageView
          page={fullPage}
          ownedCount={ownedCount}
          isAuthenticated={!!session?.user}
        />
      );
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 text-sm text-stone-500">
        <Link href="/devices" className="hover:text-tama-cyan">Device Library</Link>
        <span className="mx-2">/</span>
        <span>{device.name}</span>
      </nav>
      <h1 className="text-3xl font-bold">{device.name}</h1>
      <p className="mt-4 text-stone-600">{device.description}</p>
      {ownedCount > 0 && (
        <div className="mt-6 rounded-xl border border-tama-pink/20 bg-tama-pink/5 p-4">
          <p className="font-medium">In My Collection</p>
          <p>You own {ownedCount} {device.name} device{ownedCount > 1 ? "s" : ""}.</p>
          <Link href="/collection" className="text-tama-cyan hover:underline">
            View My Devices →
          </Link>
        </div>
      )}
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Shells</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {device.shells.map((shell) => (
            <Link
              key={shell.id}
              href={`/devices/${device.slug}/shells/${shell.slug}`}
              className="rounded-xl border border-stone-200 p-4 hover:border-tama-cyan/30"
            >
              {shell.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
