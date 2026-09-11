"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Heart } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ShellWishlistButton } from "@/components/shells/shell-wishlist-button";
import { Button } from "@/components/ui/button";
import { RemoteImage } from "@/components/ui/remote-image";
import { cn } from "@/lib/utils";

interface WishlistShellItem {
  id: string;
  shellId: string;
  notes?: string | null;
  shell: {
    id: string;
    name: string;
    slug: string;
    primaryImage?: string | null;
    region?: string | null;
    year?: number | null;
    deviceModel: {
      name: string;
      slug: string;
    };
  };
}

interface WishlistPageClientProps {
  initialItems: WishlistShellItem[];
}

async function persistWishlistOrder(orderedIds: string[]) {
  const res = await fetch("/api/wishlist/reorder", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ orderedIds }),
  });

  if (!res.ok) {
    throw new Error("Could not save ranking");
  }
}

function SortableWishlistRow({
  item,
  rank,
  total,
  onRemove,
  onMove,
}: {
  item: WishlistShellItem;
  rank: number;
  total: number;
  onRemove: (shellId: string) => void;
  onMove: (direction: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "cute-card flex items-stretch gap-2 overflow-hidden sm:gap-3",
        isDragging && "z-10 opacity-90 shadow-lg"
      )}
    >
      <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-0.5 border-r border-stone-100 bg-stone-50/80 py-2 sm:w-12">
        <span className="text-[10px] font-bold uppercase tracking-wide text-stone-400 sm:text-xs">
          #{rank}
        </span>
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={rank === 1}
          className="rounded p-0.5 text-stone-400 hover:bg-white hover:text-stone-700 disabled:opacity-30"
          aria-label="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={rank === total}
          className="rounded p-0.5 text-stone-400 hover:bg-white hover:text-stone-700 disabled:opacity-30"
          aria-label="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        className="flex shrink-0 cursor-grab touch-none items-center px-1 text-stone-400 hover:text-stone-600"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <Link
        href={`/devices/${item.shell.deviceModel.slug}/shells/${item.shell.slug}`}
        className="relative my-2 h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-tama-cyan/10 to-tama-pink/10 sm:h-20 sm:w-20"
      >
        <RemoteImage
          src={item.shell.primaryImage ?? "/placeholder-device.svg"}
          alt={item.shell.name}
          fill
          className="object-cover"
          sizes="80px"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col justify-center py-2 pr-2">
        <Link
          href={`/devices/${item.shell.deviceModel.slug}/shells/${item.shell.slug}`}
          className="line-clamp-2 font-display text-sm font-bold leading-tight text-stone-900 hover:text-tama-cyan"
        >
          {item.shell.name}
        </Link>
        <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{item.shell.deviceModel.name}</p>
        {(item.shell.region || item.shell.year) && (
          <p className="mt-0.5 text-[11px] text-stone-400">
            {[item.shell.region, item.shell.year].filter(Boolean).join(" · ")}
          </p>
        )}
        {item.notes && (
          <p className="mt-1 line-clamp-2 text-[11px] text-stone-400">{item.notes}</p>
        )}
      </div>

      <div className="flex shrink-0 items-start p-2">
        <ShellWishlistButton
          shellId={item.shellId}
          initialWishlisted
          variant="inline"
          onToggle={(wishlisted) => {
            if (!wishlisted) onRemove(item.shellId);
          }}
        />
      </div>
    </div>
  );
}

export function WishlistPageClient({ initialItems }: WishlistPageClientProps) {
  const [items, setItems] = useState(initialItems);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const applyOrder = async (nextItems: WishlistShellItem[]) => {
    const previous = items;
    setItems(nextItems);
    setSaving(true);

    try {
      await persistWishlistOrder(nextItems.map((entry) => entry.id));
    } catch {
      setItems(previous);
      toast.error("Could not save ranking");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (shellId: string) => {
    setItems((prev) => prev.filter((item) => item.shellId !== shellId));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    void applyOrder(arrayMove(items, oldIndex, newIndex));
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    void applyOrder(arrayMove(items, index, newIndex));
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader
        title="My Wishlist"
        subtitle={
          items.length === 0
            ? "Save shells you want from the device library"
            : `${items.length} shell${items.length === 1 ? "" : "s"} saved${saving ? " · saving…" : ""}`
        }
        actions={
          <Link href="/devices">
            <Button variant="outline" className="rounded-full">
              Browse Device Library
            </Button>
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="cute-card rounded-2xl border-2 border-dashed border-tama-pink/30 bg-tama-pink/5 py-16 text-center">
          <Heart className="mx-auto h-10 w-10 text-tama-pink/40" />
          <p className="mt-3 font-display font-bold text-stone-700">No wishlist items yet</p>
          <p className="mt-1 text-sm text-stone-500">
            Open a device in the library and tap the heart on any shell to save it here.
          </p>
          <Link href="/devices" className="mt-4 inline-block">
            <Button>Browse devices</Button>
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-500">
            Drag shells or use the arrows to rank them. <span className="font-medium text-stone-700">#1</span> is
            your most-wanted shell.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <SortableWishlistRow
                    key={item.id}
                    item={item}
                    rank={index + 1}
                    total={items.length}
                    onRemove={removeItem}
                    onMove={(direction) => moveItem(index, direction)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}
    </div>
  );
}
