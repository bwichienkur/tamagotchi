"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface WikiCreateClientProps {
  parentPages: Array<{ id: string; title: string }>;
}

export function WikiCreateClient({ parentPages }: WikiCreateClientProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [parentPageId, setParentPageId] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          summary: summary.trim() || undefined,
          parentPageId: parentPageId || undefined,
        }),
      });

      const data = await res.json();

      if (res.status === 401) {
        toast.error("Please sign in to create wiki pages.");
        router.push("/login?callbackUrl=/wiki/new");
        return;
      }

      if (!res.ok) {
        toast.error(data.error ?? "Failed to create page");
        return;
      }

      toast.success("Page created!");
      router.push(`/wiki/${data.slug}/edit`);
      router.refresh();
    } catch {
      toast.error("Failed to create page");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Wiki Page</h1>
        <Link href="/wiki">
          <Button variant="outline" size="sm">Cancel</Button>
        </Link>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tamagotchi Connection Version 2"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="summary">Summary (optional)</Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            placeholder="Brief description of this page..."
          />
        </div>

        {parentPages.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="parent">Parent page (optional)</Label>
            <select
              id="parent"
              value={parentPageId}
              onChange={(e) => setParentPageId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">None (top-level page)</option>
              {parentPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <Button type="submit" disabled={creating || !title.trim()}>
          {creating ? "Creating..." : "Create & Edit"}
        </Button>
      </form>
    </div>
  );
}
