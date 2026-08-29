import Link from "next/link";
import { Package, Library, BookOpen, Plus, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { APP_NAME } from "@/lib/app-name";
import { CollectionCard } from "@/components/collection/collection-card";
import { SectionHeading } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ensureDatabase, withDatabase, safeQuery } from "@/lib/db-query";
import { cn } from "@/lib/utils";

const STAT_COLORS = [
  "from-tama-cyan/20 to-tama-mint/10 text-tama-cyan",
  "from-tama-pink/20 to-tama-lavender/10 text-tama-pink",
  "from-tama-yellow/30 to-tama-yellow/10 text-amber-700",
  "from-tama-mint/25 to-tama-cyan/10 text-emerald-600",
];

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
    { label: "Devices", value: deviceCount, emoji: "🥚" },
    { label: "Models", value: modelCount, emoji: "📚" },
    { label: "Shells", value: shellCount, emoji: "🎨" },
    { label: "NIB", value: nibCount, emoji: "✨" },
  ];

  const tiles = [
    {
      href: "/collection",
      icon: Package,
      title: "My Collection",
      desc: "Your precious devices",
      className: "tile-pink",
      iconClass: "text-tama-pink bg-tama-pink/20",
    },
    {
      href: "/devices",
      icon: Library,
      title: "Device Library",
      desc: "Browse all models",
      className: "tile-cyan",
      iconClass: "text-tama-cyan bg-tama-cyan/20",
    },
    {
      href: "/wiki",
      icon: BookOpen,
      title: "Wiki",
      desc: "Learn & explore",
      className: "tile-yellow",
      iconClass: "text-amber-700 bg-tama-yellow/40",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <section className="cute-card lcd-texture relative mb-10 overflow-hidden px-6 py-10 text-center sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-tama-pink/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-tama-cyan/20 blur-2xl" />
        <div className="relative">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-tama-pink shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Welcome to {APP_NAME}
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-stone-900 sm:text-5xl">
            My Tamagotchi Collection
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-stone-600 sm:text-lg">
            Your cozy little corner for shells, devices, and wiki adventures ✿
          </p>
          {userId && (
            <Link href="/collection/add" className="mt-6 inline-block">
              <Button size="lg" className="rounded-full px-8 shadow-md shadow-tama-cyan/25">
                <Plus className="h-5 w-5" />
                Add a Tamagotchi
              </Button>
            </Link>
          )}
        </div>
      </section>

      {userId && (
        <div className="mb-10 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                "stat-bubble px-4 py-5 text-center",
                `bg-gradient-to-br ${STAT_COLORS[i]}`
              )}
            >
              <p className="text-2xl" aria-hidden>
                {stat.emoji}
              </p>
              <p className="font-display text-3xl font-extrabold">{stat.value}</p>
              <p className="text-sm font-medium opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {!userId && (
        <Card className="cute-card mb-10 border-tama-cyan/25 bg-gradient-to-r from-tama-cyan/10 via-white to-tama-pink/10">
          <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <h2 className="font-display text-xl font-bold text-stone-900">Ready to collect?</h2>
              <p className="text-sm text-stone-600">
                Sign in to manage your collection and edit the wiki.
              </p>
            </div>
            <Link href="/login">
              <Button className="rounded-full px-6">Sign in</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} className="group">
            <Card className={cn("cute-card h-full border-2", tile.className)}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={cn("rounded-2xl p-3.5 transition-transform group-hover:scale-110", tile.iconClass)}>
                  <tile.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-display font-bold group-hover:text-tama-cyan">{tile.title}</h3>
                  <p className="text-sm text-stone-500">{tile.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {recentDevices.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <SectionHeading>Recently Added</SectionHeading>
            <Link href="/collection/add">
              <Button size="sm" variant="outline" className="rounded-full">
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
          <SectionHeading className="mb-4">Currently Running</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {runningDevices.map((device) => (
              <CollectionCard key={device.id} device={device} />
            ))}
          </div>
        </section>
      )}

      {favorites.length > 0 && (
        <section className="mb-10">
          <SectionHeading className="mb-4">Favorites</SectionHeading>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {favorites.map((device) => (
              <CollectionCard key={device.id} device={device} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionHeading className="mb-4">Recently Updated Wiki</SectionHeading>
        <div className="space-y-2">
          {recentWiki.length === 0 ? (
            <p className="rounded-2xl border-2 border-dashed border-tama-cyan/30 bg-white/60 px-4 py-8 text-center text-stone-500">
              No wiki pages yet — start one from the Wiki tab!
            </p>
          ) : (
            recentWiki.map((page) => (
              <Link
                key={page.id}
                href={`/wiki/${page.slug}`}
                className="cute-card block px-4 py-3.5 hover:border-tama-cyan/30"
              >
                <p className="font-display font-bold text-stone-900">{page.title}</p>
                {page.summary && (
                  <p className="text-sm text-stone-500 line-clamp-1">{page.summary}</p>
                )}
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
