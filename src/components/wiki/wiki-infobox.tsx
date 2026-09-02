import Link from "next/link";
import { cn } from "@/lib/utils";
import { FramedImage } from "@/components/ui/framed-image";
import { RemoteImage } from "@/components/ui/remote-image";
import type { PhotoFrame } from "@/lib/photo-frame";

export interface InfoboxField {
  group?: string;
  label: string;
  value: string | React.ReactNode;
  href?: string;
}

interface WikiInfoboxProps {
  title?: string;
  image?: string | null;
  imageAlt?: string;
  imageFrame?: PhotoFrame | null;
  fields: InfoboxField[];
  emptyMessage?: string;
  className?: string;
}

export function WikiInfobox({
  title,
  image,
  imageAlt,
  imageFrame,
  fields,
  emptyMessage,
  className,
}: WikiInfoboxProps) {
  const groups = fields.reduce<Record<string, InfoboxField[]>>((acc, field) => {
    const group = field.group ?? "Details";
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        "overflow-hidden rounded-[1.35rem] border-2 border-white/80 bg-gradient-to-b from-white via-[#fffcfa] to-tama-cyan/5 shadow-md shadow-tama-cyan/10",
        className
      )}
    >
      {image && (
        <div className="relative aspect-square bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10 p-3">
          <div className="relative h-full w-full overflow-hidden rounded-2xl">
            {imageFrame ? (
              <FramedImage
                src={image}
                alt={imageAlt ?? title ?? "Device image"}
                frame={imageFrame}
                sizes="320px"
              />
            ) : (
              <RemoteImage
                src={image}
                alt={imageAlt ?? title ?? "Device image"}
                fill
                sizes="320px"
              />
            )}
          </div>
        </div>
      )}
      <div className="p-5">
        {title && (
          <h3 className="mb-4 text-center text-sm font-bold uppercase tracking-wider text-stone-500">
            {title}
          </h3>
        )}
        {fields.length === 0 && emptyMessage ? (
          <p className="text-center text-sm text-stone-500">{emptyMessage}</p>
        ) : (
          Object.entries(groups).map(([groupName, groupFields]) => (
            <div key={groupName} className="mb-4 last:mb-0">
              <h4 className="mb-2 border-b border-stone-200 pb-1 text-xs font-bold uppercase tracking-wider text-stone-400">
                {groupName}
              </h4>
              <dl className="space-y-2">
                {groupFields.map((field) => (
                  <div key={field.label} className="grid grid-cols-[1fr_1.2fr] gap-2 text-sm">
                    <dt className="text-stone-500">{field.label}</dt>
                    <dd className="font-medium text-stone-800">
                      {field.href ? (
                        <Link href={field.href} className="text-tama-cyan hover:underline">
                          {field.value}
                        </Link>
                      ) : (
                        field.value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
