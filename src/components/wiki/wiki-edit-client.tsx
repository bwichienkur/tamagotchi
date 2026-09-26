"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Trash2, Copy, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WikiEditor } from "@/components/wiki/wiki-editor";
import { WikiChartEditor } from "@/components/wiki/wiki-chart-editor";
import type { WikiSection } from "@/components/wiki/wiki-content";
import {
  addChildSection,
  createChartSection,
  createContentSection,
  createDefaultWikiChart,
  createSubsection,
  deleteSectionById,
  duplicateSectionTree,
  updateSectionById,
} from "@/lib/wiki-sections";
import {
  WikiDeviceDetailsEditor,
  createDeviceDetailsInput,
  type WikiDeviceDetails,
  type WikiDeviceDetailsInput,
} from "@/components/wiki/wiki-device-details-editor";
import { WikiPagePhotoEditor } from "@/components/wiki/wiki-page-photo-editor";

interface WikiEditClientProps {
  slug: string;
  initialTitle: string;
  initialSummary: string;
  initialCoverImage?: string | null;
  initialSections: WikiSection[];
  deviceModel?: WikiDeviceDetails | null;
}

function OutlineSectionEditor({
  section,
  depth,
  onUpdate,
  onDelete,
  onAddChild,
}: {
  section: WikiSection;
  depth: number;
  onUpdate: (id: string, updates: Partial<WikiSection>) => void;
  onDelete: (id: string) => void;
  onAddChild: (parentId: string) => void;
}) {
  return (
    <div
      className={
        depth > 0
          ? "mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/80 pl-3"
          : ""
      }
      style={depth > 0 ? { marginLeft: Math.min(depth * 12, 48) } : undefined}
    >
      <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {depth === 0 ? "Subsection" : `Subsection L${depth + 1}`}
        </span>
        <Input
          value={section.title}
          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
          className="flex-1 border-0 bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0"
          placeholder="Subsection title"
        />
        <button
          type="button"
          onClick={() => onDelete(section.id)}
          className="rounded-md p-1 text-red-400 hover:bg-red-50"
          aria-label="Delete subsection"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <WikiEditor
          content={section.content}
          onChange={(html) => onUpdate(section.id, { content: html })}
          placeholder="Subsection content..."
          className="bg-white"
        />
        {(section.children ?? []).map((child) => (
          <OutlineSectionEditor
            key={child.id}
            section={child}
            depth={depth + 1}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-3 text-stone-600"
          onClick={() => onAddChild(section.id)}
        >
          <Plus className="h-4 w-4" />
          Add nested subsection
        </Button>
      </div>
    </div>
  );
}

function SortableSection({
  section,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleCollapse,
  onAddSubsection,
  onUpdateSection,
  onDeleteSection,
  collapsed,
}: {
  section: WikiSection;
  onUpdate: (id: string, updates: Partial<WikiSection>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddSubsection: (parentId: string) => void;
  onUpdateSection: (id: string, updates: Partial<WikiSection>) => void;
  onDeleteSection: (id: string) => void;
  collapsed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isChart = section.kind === "chart";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-stone-200 bg-white"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-stone-100 p-3">
        <button type="button" className="cursor-grab touch-none" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-stone-400" />
        </button>
        <Input
          value={section.title}
          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
          className="min-w-[140px] flex-1 border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
        />
        <select
          value={section.kind ?? "content"}
          onChange={(event) => {
            const kind = event.target.value as "content" | "chart";
            if (kind === "chart") {
              onUpdate(section.id, {
                kind,
                chart: section.chart ?? createDefaultWikiChart(),
                content: section.content || "",
              });
            } else {
              onUpdate(section.id, { kind, content: section.content || "<p></p>" });
            }
          }}
          className="h-9 rounded-lg border border-stone-200 bg-white px-2 text-sm"
        >
          <option value="content">Content section</option>
          <option value="chart">Character chart</option>
        </select>
        <button type="button" onClick={() => onToggleCollapse(section.id)}>
          {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </button>
        <button type="button" onClick={() => onDuplicate(section.id)}>
          <Copy className="h-4 w-4 text-stone-400" />
        </button>
        <button type="button" onClick={() => onDelete(section.id)}>
          <Trash2 className="h-4 w-4 text-red-400" />
        </button>
      </div>
      {!collapsed && (
        <div className="p-3">
          {isChart ? (
            <>
              <p className="mb-2 text-xs text-stone-500">Optional intro above the chart:</p>
              <WikiEditor
                content={section.content || "<p></p>"}
                onChange={(html) => onUpdate(section.id, { content: html })}
                placeholder="Intro text..."
                className="mb-4"
              />
              {section.chart ? (
                <WikiChartEditor
                  chart={section.chart}
                  onChange={(chart) => onUpdate(section.id, { chart })}
                />
              ) : null}
            </>
          ) : (
            <>
              <WikiEditor
                content={section.content}
                onChange={(html) => onUpdate(section.id, { content: html })}
              />

              {(section.children ?? []).map((subsection) => (
                <OutlineSectionEditor
                  key={subsection.id}
                  section={subsection}
                  depth={0}
                  onUpdate={onUpdateSection}
                  onDelete={onDeleteSection}
                  onAddChild={onAddSubsection}
                />
              ))}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-3 text-stone-600"
                onClick={() => onAddSubsection(section.id)}
              >
                <Plus className="h-4 w-4" />
                Add Subsection
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function WikiEditClient({
  slug,
  initialTitle,
  initialSummary,
  initialCoverImage = null,
  initialSections,
  deviceModel = null,
}: WikiEditClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [coverImage, setCoverImage] = useState<string | null>(initialCoverImage);
  const [sections, setSections] = useState<WikiSection[]>(initialSections);
  const [deviceDetails, setDeviceDetails] = useState<WikiDeviceDetailsInput | null>(
    deviceModel ? createDeviceDetailsInput(deviceModel) : null
  );
  const [editSummary, setEditSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const draftKey = `wiki-draft-${slug}`;

  useEffect(() => {
    const draft = localStorage.getItem(draftKey);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.summary) setSummary(parsed.summary);
        if (parsed.coverImage !== undefined) setCoverImage(parsed.coverImage);
        if (parsed.sections) setSections(parsed.sections);
        if (parsed.deviceDetails && deviceModel) setDeviceDetails(parsed.deviceDetails);
      } catch {
        // ignore
      }
    }
  }, [draftKey, deviceModel]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ title, summary, coverImage, sections, deviceDetails })
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, summary, coverImage, sections, deviceDetails, draftKey]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const updateSection = useCallback((id: string, updates: Partial<WikiSection>) => {
    setSections((prev) => updateSectionById(prev, id, updates));
  }, []);

  const deleteSection = (id: string) => {
    if (confirm("Delete this section?")) {
      setSections((prev) => deleteSectionById(prev, id));
    }
  };

  const duplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      setSections((prev) => [...prev, duplicateSectionTree(section)]);
    }
  };

  const addSubsection = (parentId: string) => {
    setSections((prev) => addChildSection(prev, parentId, createSubsection()));
  };

  const deleteSubsection = (subsectionId: string) => {
    if (!confirm("Delete this subsection?")) return;
    setSections((prev) => deleteSectionById(prev, subsectionId));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (deviceModel && deviceDetails) {
        const deviceRes = await fetch(`/api/device-types/${deviceModel.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(deviceDetails),
        });

        if (!deviceRes.ok) {
          if (deviceRes.status === 401) {
            toast.error("Please sign in to save device details.");
            router.push(`/login?callbackUrl=/wiki/${slug}/edit#device-details`);
            return;
          }
          const data = await deviceRes.json().catch(() => ({}));
          throw new Error(data.error ?? "Failed to save device details");
        }
      }

      const res = await fetch(`/api/wiki/${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          summary,
          coverImage,
          sections,
          editSummary: editSummary || "Updated page",
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please sign in to save wiki pages.");
          router.push(`/login?callbackUrl=/wiki/${slug}/edit`);
          return;
        }
        throw new Error("Save failed");
      }

      localStorage.removeItem(draftKey);
      toast.success("Page saved!");
      router.push(`/wiki/${slug}`);
      router.refresh();
    } catch {
      toast.error("Failed to save page");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit: {title}</h1>
        <div className="flex gap-2">
          <Link href={`/wiki/${slug}`}>
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </Link>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Summary</Label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Edit summary</Label>
          <Input
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            placeholder="Briefly describe your changes..."
          />
        </div>
      </div>

      {deviceModel && deviceDetails && (
        <WikiDeviceDetailsEditor
          device={deviceModel}
          value={deviceDetails}
          onChange={setDeviceDetails}
        />
      )}

      {!deviceModel && (
        <WikiPagePhotoEditor title={title} coverImage={coverImage} onChange={setCoverImage} />
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onUpdate={updateSection}
                onDelete={deleteSection}
                onDuplicate={duplicateSection}
                onAddSubsection={addSubsection}
                onUpdateSection={updateSection}
                onDeleteSection={deleteSubsection}
                onToggleCollapse={(id) =>
                  setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
                }
                collapsed={!!collapsed[section.id]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => setSections((prev) => [...prev, createContentSection()])}>
          <Plus className="h-4 w-4" />
          Add Section
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setSections((prev) => [...prev, createChartSection()])}
        >
          <Plus className="h-4 w-4" />
          Add Chart Section
        </Button>
      </div>
    </div>
  );
}
