import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/session";
import { formatDate, formatCurrency } from "@/lib/utils";
import { getConditionLabel } from "@/lib/condition-labels";
import { WikiInfobox } from "@/components/wiki/wiki-infobox";
import { WikiTableOfContents } from "@/components/wiki/wiki-toc";
import { extractTocFromSections } from "@/lib/wiki-toc";
import { WikiSectionsContent, WikiSection } from "@/components/wiki/wiki-content";
import { ConditionBadge } from "@/components/collection/condition-badge";
import { DeviceActionsMenu } from "@/components/collection/device-actions-menu";
import { Button } from "@/components/ui/button";
import { FramedImage } from "@/components/ui/framed-image";
import { RemoteImage } from "@/components/ui/remote-image";
import { getAdditionalPhotoFrame, getPrimaryPhotoFrame, parsePhotoFrames } from "@/lib/photo-frame";

export default async function OwnedDevicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await requireAuth();
  const { slug } = await params;

  const device = await prisma.ownedDevice.findFirst({
    where: { slug, userId: session.user.id },
    include: {
      deviceModel: { include: { family: true, properties: true } },
      shell: true,
      galleryImages: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!device) notFound();

  const photoFrames = parsePhotoFrames(device.photoFrames);
  const primaryFrame = getPrimaryPhotoFrame(photoFrames);
  const shellName = device.shell?.name ?? device.customShellName ?? "Unknown shell";
  const ownedCount = await prisma.ownedDevice.count({
    where: { userId: session.user.id, deviceModelId: device.deviceModelId },
  });

  const sections: WikiSection[] = [
    {
      id: "my-device",
      title: "My Device",
      content: device.showMoreInfo
        ? `<p>${device.showMoreInfo}</p>`
        : `<p>This is my personal ${device.deviceModel.name} in the ${shellName} shell.</p>`,
    },
    {
      id: "device-information",
      title: "Device Information",
      content: `<p>Model: <a href="/devices/${device.deviceModel.slug}">${device.deviceModel.name}</a></p>
        <p>Shell: ${shellName}</p>
        ${device.nickname ? `<p>Nickname: ${device.nickname}</p>` : ""}`,
    },
    {
      id: "condition",
      title: "Condition",
      content:
        device.conditionBadge === "NONE"
          ? `<p>Working status: ${device.workingStatus.replace("_", " ")}</p>`
          : `<p>Condition: ${getConditionLabel(device.conditionBadge)}</p>
        ${device.conditionNotes ? `<p>${device.conditionNotes}</p>` : ""}
        <p>Working status: ${device.workingStatus.replace("_", " ")}</p>`,
    },
    {
      id: "purchase-information",
      title: "Purchase Information",
      content: `<p>Purchased: ${formatDate(device.purchaseDate)}</p>
        <p>Price: ${formatCurrency(device.purchasePrice, device.purchaseCurrency ?? "USD")}</p>
        ${device.purchasedFrom ? `<p>From: ${device.purchasedFrom}</p>` : ""}`,
    },
    {
      id: "notes",
      title: "Notes",
      content: device.notes ? `<p>${device.notes}</p>` : `<p>No additional notes.</p>`,
    },
    {
      id: "gallery",
      title: "Gallery",
      content:
        device.galleryImages.length > 0 || device.additionalPhotos.length > 0
          ? `<p>Personal photos of this device.</p>`
          : `<p>No additional photos yet.</p>`,
    },
  ];

  const tocItems = extractTocFromSections(sections);

  const infoboxFields = [
    { label: "Device", value: device.deviceModel.name, href: `/devices/${device.deviceModel.slug}` },
    { label: "Shell", value: shellName },
    ...(device.conditionBadge !== "NONE"
      ? [{ label: "Condition", value: getConditionLabel(device.conditionBadge) }]
      : []),
    { label: "Purchased", value: formatDate(device.purchaseDate) },
    { label: "Working", value: device.workingStatus.replace("_", " ") },
    { label: "Currently Running", value: device.currentlyRunning ? "Yes" : "No" },
  ];

  const breadcrumbs = [
    { label: "Collection", href: "/collection" },
    { label: device.deviceModel.family?.name ?? "Devices", href: `/devices?family=${device.deviceModel.family?.slug}` },
    { label: device.deviceModel.name, href: `/devices/${device.deviceModel.slug}` },
    { label: shellName },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-stone-500">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span>/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="hover:text-tama-cyan">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-stone-800">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-tama-cyan/20 bg-tama-cyan/5 px-4 py-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-tama-cyan">My Device</p>
          <p className="font-semibold text-stone-900">
            {device.nickname ?? `${shellName} ${device.deviceModel.name}`}
          </p>
          <Link href={`/devices/${device.deviceModel.slug}`}>
            <Button variant="link" className="h-auto p-0 text-sm">
              View {device.deviceModel.name} Wiki →
            </Button>
          </Link>
        </div>
        <DeviceActionsMenu slug={device.slug} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-stone-900 sm:text-4xl">
              {device.deviceModel.name}
            </h1>
            <p className="mt-1 text-xl text-stone-500">{shellName}</p>
            <div className="mt-3 flex items-center gap-2">
              <ConditionBadge condition={device.conditionBadge} />
              {device.favorite && (
                <span className="text-sm text-tama-pink">★ Favorite</span>
              )}
            </div>
          </header>

          <WikiTableOfContents items={tocItems} mobile />

          <div className="mt-6 lg:hidden">
            <WikiInfobox
              title="Details"
              image={device.primaryPhoto ?? device.shell?.primaryImage}
              imageAlt={device.deviceModel.name}
              imageFrame={device.primaryPhoto ? primaryFrame : undefined}
              fields={infoboxFields}
            />
          </div>

          <div className="mt-8 hidden lg:block">
            <WikiTableOfContents items={tocItems} />
          </div>

          <WikiSectionsContent sections={sections} className="mt-8 lg:mt-0" />

          {(device.additionalPhotos.length > 0 || device.galleryImages.length > 0) && (
            <div id="gallery" className="mt-10">
              <h2 className="mb-4 text-2xl font-semibold">My Photos</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {device.primaryPhoto && (
                  <div className="relative aspect-square overflow-hidden rounded-xl">
                    <FramedImage
                      src={device.primaryPhoto}
                      alt="Primary"
                      frame={primaryFrame}
                    />
                  </div>
                )}
                {device.additionalPhotos.map((url, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl">
                    <FramedImage
                      src={url}
                      alt={`Photo ${i + 1}`}
                      frame={getAdditionalPhotoFrame(photoFrames, i)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {device.shell?.primaryImage && (
            <div className="mt-10">
              <h3 className="mb-3 text-lg font-semibold text-stone-700">Reference Shell</h3>
              <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-xl border border-stone-200">
                <RemoteImage
                  src={device.shell.primaryImage}
                  alt={`Reference: ${shellName}`}
                  fill
                />
              </div>
              {device.shell.sourceName && (
                <p className="mt-2 text-xs text-stone-400">
                  Source:{" "}
                  {device.shell.sourceUrl ? (
                    <a href={device.shell.sourceUrl} className="text-tama-cyan hover:underline">
                      {device.shell.sourceName}
                    </a>
                  ) : (
                    device.shell.sourceName
                  )}
                </p>
              )}
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <WikiInfobox
            title="Details"
            image={device.primaryPhoto ?? device.shell?.primaryImage ?? "/placeholder-device.svg"}
            imageAlt={device.deviceModel.name}
            imageFrame={device.primaryPhoto ? primaryFrame : undefined}
            fields={infoboxFields}
          />
          {ownedCount > 1 && (
            <div className="mt-4 rounded-xl border border-stone-200 bg-white p-4 text-sm">
              <p className="font-medium">You own {ownedCount} of this model</p>
              <Link href={`/devices/${device.deviceModel.slug}`} className="text-tama-cyan hover:underline">
                View all copies →
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
