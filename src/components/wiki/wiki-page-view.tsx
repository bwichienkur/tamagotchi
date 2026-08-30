import Link from "next/link";
import { WikiInfobox, InfoboxField } from "@/components/wiki/wiki-infobox";
import { WikiTableOfContents } from "@/components/wiki/wiki-toc";
import { extractTocFromSections } from "@/lib/wiki-toc";
import { WikiSectionsContent, WikiSection } from "@/components/wiki/wiki-content";
import { DeleteWikiButton } from "@/components/wiki/delete-wiki-button";
import { EditDeviceButton } from "@/components/collection/edit-device-button";
import { DeviceShellGrid, DeviceShellItem } from "@/components/devices/device-shell-grid";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface WikiPageData {
  id: string;
  title: string;
  slug: string;
  summary?: string | null;
  sections?: unknown;
  deviceModel?: {
    name: string;
    slug: string;
    heroImage?: string | null;
    releaseYear?: number | null;
    manufacturer?: string | null;
    regions?: string[];
    family?: { name: string } | null;
    properties?: Array<{ group: string; label: string; value: string; sortOrder: number }>;
    shells?: Array<{ id: string; name: string; slug: string }>;
  } | null;
  parent?: { title: string; slug: string } | null;
  children?: Array<{ title: string; slug: string }>;
  citations?: Array<{ id: string; title: string; url?: string | null; website?: string | null }>;
  updatedAt: Date;
}

interface OwnedDeviceSummary {
  slug: string;
  label: string;
}

interface WikiPageViewProps {
  page: WikiPageData;
  ownedCount?: number;
  ownedDevices?: OwnedDeviceSummary[];
  isAuthenticated?: boolean;
  shells?: DeviceShellItem[];
}

export function WikiPageView({
  page,
  ownedCount = 0,
  ownedDevices = [],
  isAuthenticated,
  shells = [],
}: WikiPageViewProps) {
  const sections = (page.sections as WikiSection[]) ?? [];
  const tocItems = extractTocFromSections(sections);

  const infoboxFields: InfoboxField[] = [];

  if (page.deviceModel) {
    const dm = page.deviceModel;
    const propGroups = dm.properties?.reduce<Record<string, InfoboxField[]>>((acc, p) => {
      if (!acc[p.group]) acc[p.group] = [];
      acc[p.group].push({ group: p.group, label: p.label, value: p.value });
      return acc;
    }, {}) ?? {};

    if (!dm.properties?.length) {
      infoboxFields.push(
        { group: "Details", label: "Series", value: dm.family?.name ?? "—" },
        { group: "Details", label: "Manufacturer", value: dm.manufacturer ?? "Bandai" },
        { group: "Details", label: "Release", value: dm.releaseYear?.toString() ?? "—" },
        { group: "Details", label: "Region", value: dm.regions?.join(", ") || "—" },
      );
    } else {
      for (const [group, fields] of Object.entries(propGroups)) {
        infoboxFields.push(...fields);
      }
    }
  }

  const breadcrumbs = [
    { label: "Wiki", href: "/wiki" },
    ...(page.parent
      ? [{ label: page.parent.title, href: `/wiki/${page.parent.slug}` }]
      : []),
    { label: page.title },
  ];

  const alternateNames =
    page.deviceModel && "alternateNames" in page.deviceModel
      ? (page.deviceModel as { alternateNames?: string[] }).alternateNames
      : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-stone-500">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span>›</span>}
            {"href" in crumb && crumb.href ? (
              <Link href={crumb.href} className="hover:text-tama-cyan">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-stone-800">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 rounded-full bg-white/60 p-1 shadow-sm">
          {isAuthenticated && (
            <>
              <Link href={`/wiki/${page.slug}/edit`}>
                <Button variant="outline" size="sm" className="rounded-full">Edit Page</Button>
              </Link>
              <Link href={`/wiki/${page.slug}/history`}>
                <Button variant="ghost" size="sm" className="rounded-full">View History</Button>
              </Link>
              <DeleteWikiButton slug={page.slug} title={page.title} />
            </>
          )}
        </div>
        <p className="text-xs text-stone-400">
          Last updated {formatDate(page.updatedAt)}
        </p>
      </div>

      {ownedCount > 0 && (
        <div className="mb-6 cute-card border-tama-pink/25 bg-gradient-to-r from-tama-pink/10 to-tama-cyan/10 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-tama-pink">In My Collection</p>
          <p className="font-medium">
            You own {ownedCount} {page.deviceModel?.name ?? "device"}
            {ownedCount > 1 ? "s" : ""}.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {ownedDevices.map((device) => (
              <EditDeviceButton
                key={device.slug}
                slug={device.slug}
                label={`Edit ${device.label}`}
              />
            ))}
            <Link href="/collection" className="text-sm text-tama-cyan hover:underline">
              View all in collection →
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <header className="mb-8">
            <h1 className="font-display text-3xl font-extrabold text-stone-900 sm:text-4xl">
              {page.title}
            </h1>
            {alternateNames && alternateNames.length > 0 && (
              <p className="mt-2 text-sm text-stone-500">
                Also known as: {alternateNames.join(", ")}
              </p>
            )}
            {page.summary && (
              <p className="mt-4 text-lg leading-relaxed text-stone-600">
                {page.summary}
              </p>
            )}
          </header>

          <WikiTableOfContents items={tocItems} mobile />

          <div className="mt-6 lg:hidden">
            <WikiInfobox
              title="Details"
              image={page.deviceModel?.heroImage ?? "/placeholder-device.svg"}
              fields={infoboxFields}
            />
          </div>

          <div className="mt-8 hidden lg:block">
            <WikiTableOfContents items={tocItems} />
          </div>

          <WikiSectionsContent sections={sections} className="mt-8 lg:mt-0" />

          {page.deviceModel && shells.length > 0 && (
            <DeviceShellGrid deviceSlug={page.deviceModel.slug} shells={shells} />
          )}

          {page.children && page.children.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">Subpages</h2>
              <ul className="space-y-2">
                {page.children.map((child) => (
                  <li key={child.slug}>
                    <Link
                      href={`/wiki/${child.slug}`}
                      className="text-tama-cyan hover:underline"
                    >
                      {child.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {page.citations && page.citations.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-4 text-xl font-semibold">References</h2>
              <ol className="list-decimal space-y-2 pl-5 text-sm text-stone-600">
                {page.citations.map((c, i) => (
                  <li key={c.id}>
                    {c.url ? (
                      <a href={c.url} className="text-tama-cyan hover:underline">
                        {c.title}
                      </a>
                    ) : (
                      c.title
                    )}
                    {c.website && <span className="text-stone-400"> — {c.website}</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <WikiInfobox
            title="Details"
            image={page.deviceModel?.heroImage ?? "/placeholder-device.svg"}
            imageAlt={page.title}
            fields={infoboxFields}
          />
          {page.deviceModel && (
            <Link href={`/devices/${page.deviceModel.slug}`} className="mt-4 block">
              <Button variant="outline" className="w-full" size="sm">
                View in Device Library
              </Button>
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
