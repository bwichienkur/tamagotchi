import Link from "next/link";
import { Package, Library, BookOpen, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { CollectionCard } from "@/components/collection/collection-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ensureDatabase, withDatabase, safeQuery } from "@/lib/db-query";

export default async function HomePage() {
  await ensureDatabase();

  const session = await auth();
  const userId = session?.user?.id;

  const [deviceCount, modelCount, shellCount, nibCount, recentDevices, runningDevices, favorites, recentWiki] =
    await Promise.all([
      userId ? safeQuery(() => prisma.ownedDevice.count({ where: { userId } }), 0) : 0,
      userId
        ? safeQuery(
            () =>
              prisma.ownedDevice
                .groupBy({ by: ["deviceModelId"], where: { userId } })
                .then((g) => g.length),
            0
          )
        : 0,
      userId
        ? safeQuery(
            () =>
              prisma.ownedDevice
                .groupBy({ by: ["shellId"], where: { userId, shellId: { not: null } } })
                .then((g) => g.length),
            0
          )
        : 0,
      userId
        ? safeQuery(
            () => prisma.ownedDevice.count({ where: { userId, conditionBadge: "NIB" } }),
            0
          )
        : 0,
      userId
        ? safeQuery(
            () =>
              prisma.ownedDevice.findMany({
                where: { userId },
                include: { deviceModel: true, shell: true },
                orderBy: { createdAt: "desc" },
                take: 4,
              }),
            []
          )
        : [],
      userId
        ? safeQuery(
            () =>
              prisma.ownedDevice.findMany({
                where: { userId, currentlyRunning: true },
                include: { deviceModel: true, shell: true },
                take: 4,
              }),
            []
          )
        : [],
      userId
        ? safeQuery(
            () =>
              prisma.ownedDevice.findMany({
                where: { userId, favorite: true },
                include: { deviceModel: true, shell: true },
                take: 4,
              }),
            []
          )
        : [],
      safeQuery(
        () => prisma.wikiPage.findMany({ orderBy: { updatedAt: "desc" }, take: 5 }),
        []
      ),
    ]);

  const stats = [
    { label: "Devices", value: deviceCount },
    { label: "Models", value: modelCount },
    { label: "Shells", value: shellCount },
    { label: "NIB", value: nibCount },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="lcd-texture mb-2 text-3xl font-bold text-stone-900 sm:text-4xl">
          My Tamagotchi Collection
        </h1>
        <p className="text-stone-500">
          Your personal collector database & wiki
        </p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-tama-cyan">{stat.value}</p>
              <p className="text-sm text-stone-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!userId && (
        <Card className="mb-10 border-tama-cyan/30 bg-tama-cyan/5">
          <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
            <div>
              <h2 className="font-semibold text-stone-900">Get started</h2>
              <p className="text-sm text-stone-600">
                Sign in to manage your collection and edit the wiki.
              </p>
            </div>
            <Link href="/login">
              <Button>Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Link href="/collection" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-xl bg-tama-pink/15 p-3">
                <Package className="h-6 w-6 text-tama-pink" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-tama-cyan">My Collection</h3>
                <p className="text-sm text-stone-500">View your devices</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/devices" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-xl bg-tama-cyan/15 p-3">
                <Library className="h-6 w-6 text-tama-cyan" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-tama-cyan">Device Library</h3>
                <p className="text-sm text-stone-500">Browse all models</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/wiki/tamagotchi-connection-v1" className="group">
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 pt-6">
              <div className="rounded-xl bg-tama-yellow/30 p-3">
                <BookOpen className="h-6 w-6 text-stone-700" />
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-tama-cyan">Wiki</h3>
                <p className="text-sm text-stone-500">Explore articles</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {recentDevices.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recently Added</h2>
            <Link href="/collection/add">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
                Add Device
              </Button>
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recentDevices.map((device) => (
              <CollectionCard key={device.id} device={device} />
            ))}
          </div>
        </section>
      )}

      {runningDevices.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Currently Running</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {runningDevices.map((device) => (
              <CollectionCard key={device.id} device={device} />
            ))}
          </div>
        </section>
      )}

      {favorites.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Favorites</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((device) => (
              <CollectionCard key={device.id} device={device} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-xl font-semibold">Recently Updated Wiki Pages</h2>
        <div className="space-y-2">
          {recentWiki.map((page) => (
            <Link
              key={page.id}
              href={`/wiki/${page.slug}`}
              className="block rounded-xl border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-tama-cyan/30 hover:bg-tama-cyan/5"
            >
              <p className="font-medium text-stone-900">{page.title}</p>
              {page.summary && (
                <p className="text-sm text-stone-500 line-clamp-1">{page.summary}</p>
              )}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
