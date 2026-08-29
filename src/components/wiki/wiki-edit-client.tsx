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

interface WikiEditClientProps {
  slug: string;
  initialTitle: string;
  initialSummary: string;
  initialSections: WikiSection[];
}

function SortableSection({
  section,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleCollapse,
  collapsed,
}: {
  section: WikiSection;
  onUpdate: (id: string, updates: Partial<WikiSection>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleCollapse: (id: string) => void;
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
}: WikiEditClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initialTitle);
  const [summary, setSummary] = useState(initialSummary);
  const [sections, setSections] = useState<WikiSection[]>(initialSections);
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
      } catch {
        // ignore
      }
    }
  }, [draftKey]);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ title, summary, sections })
      );
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, summary, sections, draftKey]);

  const sensors = useSensors(
    useSensor(PointerSensor),
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
        },
      ]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
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
