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
import { WikiSection } from "@/components/wiki/wiki-content";
import {
  WikiDeviceDetailsEditor,
  createDeviceDetailsInput,
  type WikiDeviceDetails,
  type WikiDeviceDetailsInput,
} from "@/components/wiki/wiki-device-details-editor";

interface WikiEditClientProps {
  slug: string;
  initialTitle: string;
  initialSummary: string;
  initialSections: WikiSection[];
  deviceModel?: WikiDeviceDetails | null;
}

type WikiSubsection = NonNullable<WikiSection["children"]>[number];

function SubsectionEditor({
  subsection,
  onUpdate,
  onDelete,
}: {
  subsection: WikiSubsection;
  onUpdate: (updates: Partial<WikiSubsection>) => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/80">
      <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Subsection
        </span>
        <Input
          value={subsection.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="flex-1 border-0 bg-transparent text-sm font-semibold shadow-none focus-visible:ring-0"
          placeholder="Subsection title"
        />
        <button
          type="button"
          onClick={onDelete}
          className="rounded-md p-1 text-red-400 hover:bg-red-50"
          aria-label="Delete subsection"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="p-3">
        <WikiEditor
          content={subsection.content}
          onChange={(html) => onUpdate({ content: html })}
          placeholder="Subsection content..."
          className="bg-white"
        />
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
  onUpdateSubsection,
  onDeleteSubsection,
  collapsed,
}: {
  section: WikiSection;
  onUpdate: (id: string, updates: Partial<WikiSection>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onAddSubsection: (id: string) => void;
  onUpdateSubsection: (
    sectionId: string,
    subsectionId: string,
    updates: Partial<WikiSubsection>
  ) => void;
  onDeleteSubsection: (sectionId: string, subsectionId: string) => void;
  collapsed: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-2xl border border-stone-200 bg-white"
    >
      <div className="flex items-center gap-2 border-b border-stone-100 p-3">
        <button type="button" className="cursor-grab touch-none" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-stone-400" />
        </button>
        <Input
          value={section.title}
          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
          className="flex-1 border-0 bg-transparent font-semibold shadow-none focus-visible:ring-0"
        />
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
          <WikiEditor
            content={section.content}
            onChange={(html) => onUpdate(section.id, { content: html })}
          />

          {(section.children ?? []).map((subsection) => (
            <SubsectionEditor
              key={subsection.id}
              subsection={subsection}
              onUpdate={(updates) => onUpdateSubsection(section.id, subsection.id, updates)}
              onDelete={() => onDeleteSubsection(section.id, subsection.id)}
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
        </div>
      )}
    </div>
  );
}

export function WikiEditClient({
  slug,
  initialTitle,
  initialSummary,
  initialSections,
  deviceModel = null,
}: WikiEditClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
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
        JSON.stringify({ title, summary, sections, deviceDetails })
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, summary, sections, deviceDetails, draftKey]);

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

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: `section-${Date.now()}`,
        title: "New Section",
        content: "<p></p>",
        children: [],
      },
    ]);
  };

  const updateSection = useCallback((id: string, updates: Partial<WikiSection>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const deleteSection = (id: string) => {
    if (confirm("Delete this section?")) {
      setSections((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const duplicateSection = (id: string) => {
    const section = sections.find((s) => s.id === id);
    if (section) {
      setSections([
        ...sections,
        {
          ...section,
          id: `section-${Date.now()}`,
          title: `${section.title} (copy)`,
          children: section.children?.map((child) => ({
            ...child,
            id: `subsection-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          })),
        },
      ]);
    }
  };

  const addSubsection = (sectionId: string) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const children = section.children ?? [];
        return {
          ...section,
          children: [
            ...children,
            {
              id: `subsection-${Date.now()}`,
              title: "New Subsection",
              content: "<p></p>",
            },
          ],
        };
      })
    );
  };

  const updateSubsection = (
    sectionId: string,
    subsectionId: string,
    updates: Partial<WikiSubsection>
  ) => {
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          children: (section.children ?? []).map((child) =>
            child.id === subsectionId ? { ...child, ...updates } : child
          ),
        };
      })
    );
  };

  const deleteSubsection = (sectionId: string, subsectionId: string) => {
    if (!confirm("Delete this subsection?")) return;
    setSections((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          children: (section.children ?? []).filter((child) => child.id !== subsectionId),
        };
      })
    );
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
            <Button variant="outline" size="sm">Cancel</Button>
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
          <Textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
          />
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
                onUpdateSubsection={updateSubsection}
                onDeleteSubsection={deleteSubsection}
                onToggleCollapse={(id) =>
                  setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }))
                }
                collapsed={!!collapsed[section.id]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button type="button" variant="outline" className="mt-4" onClick={addSection}>
        <Plus className="h-4 w-4" />
        Add Section
      </Button>
    </div>
  );
}
