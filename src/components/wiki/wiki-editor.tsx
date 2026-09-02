"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Table as TableIcon,
  Image as ImageIcon,
  Columns2,
  Rows2,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/upload-image";

interface WikiEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function WikiEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className,
}: WikiEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toolbarRevision, setToolbarRevision] = useState(0);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false }),
      Image,
      Underline,
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [placeholder]
  );

  const isInternalUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content,
    onUpdate: ({ editor: currentEditor }) => {
      isInternalUpdate.current = true;
      onChange(currentEditor.getHTML());
      queueMicrotask(() => {
        isInternalUpdate.current = false;
      });
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none min-h-[200px] p-4 focus:outline-none prose-ul:list-disc prose-ol:list-decimal prose-li:my-1",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;

    const refreshToolbar = () => setToolbarRevision((value) => value + 1);
    editor.on("transaction", refreshToolbar);
    editor.on("selectionUpdate", refreshToolbar);

    return () => {
      editor.off("transaction", refreshToolbar);
      editor.off("selectionUpdate", refreshToolbar);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.isFocused || isInternalUpdate.current) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  void toolbarRevision;

  const runCommand = (command: () => boolean | void) => {
    command();
  };

  const addLink = () => {
    const url = window.prompt("URL");
    if (url) {
      runCommand(() =>
        editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
      );
    }
  };

  const addWikiLink = () => {
    const page = window.prompt("Wiki page name (use [[Page Name]] format)");
    if (page) {
      runCommand(() => editor.chain().focus().insertContent(`[[${page}]]`).run());
    }
  };

  const addImageFromUrl = () => {
    const url = window.prompt("Image URL");
    if (url) {
      runCommand(() => editor.chain().focus().setImage({ src: url }).run());
    }
  };

  const addImageFromFile = async (file: File) => {
    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      runCommand(() => editor.chain().focus().setImage({ src: url }).run());
      toast.success("Image added to section");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const inTable = editor.isActive("table");

  return (
    <div className={cn("wiki-editor overflow-hidden rounded-xl border border-stone-200", className)}>
      <div
        className="flex flex-wrap gap-1 border-b border-stone-200 bg-stone-50 p-2"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleBold().run())}
          active={editor.isActive("bold")}
          icon={<Bold className="h-4 w-4" />}
          label="Bold"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleItalic().run())}
          active={editor.isActive("italic")}
          icon={<Italic className="h-4 w-4" />}
          label="Italic"
        />
        <ToolbarButton
          onClick={() =>
            runCommand(() => editor.chain().focus().toggleHeading({ level: 2 }).run())
          }
          active={editor.isActive("heading", { level: 2 })}
          icon={<Heading2 className="h-4 w-4" />}
          label="Heading 2"
        />
        <ToolbarButton
          onClick={() =>
            runCommand(() => editor.chain().focus().toggleHeading({ level: 3 }).run())
          }
          active={editor.isActive("heading", { level: 3 })}
          icon={<Heading3 className="h-4 w-4" />}
          label="Heading 3"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleBulletList().run())}
          active={editor.isActive("bulletList")}
          icon={<List className="h-4 w-4" />}
          label="Bullet list"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleOrderedList().run())}
          active={editor.isActive("orderedList")}
          icon={<ListOrdered className="h-4 w-4" />}
          label="Ordered list"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().toggleBlockquote().run())}
          active={editor.isActive("blockquote")}
          icon={<Quote className="h-4 w-4" />}
          label="Quote"
        />
        <ToolbarButton
          onClick={() => runCommand(() => editor.chain().focus().setHorizontalRule().run())}
          icon={<Minus className="h-4 w-4" />}
          label="Horizontal rule"
        />
        <ToolbarButton onClick={addLink} icon={<LinkIcon className="h-4 w-4" />} label="Link" />
        <ToolbarButton onClick={addWikiLink} icon={<LinkIcon className="h-4 w-4" />} label="Wiki link" />
        <ToolbarButton
          onClick={() => imageInputRef.current?.click()}
          disabled={uploadingImage}
          icon={<ImageIcon className="h-4 w-4" />}
          label={uploadingImage ? "Uploading image..." : "Upload image"}
        />
        <ToolbarButton
          onClick={addImageFromUrl}
          icon={<LinkIcon className="h-4 w-4" />}
          label="Image from URL"
        />
        <ToolbarButton
          onClick={() =>
            runCommand(() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            )
          }
          icon={<TableIcon className="h-4 w-4" />}
          label="Insert table"
        />
      </div>

      {inTable && (
        <div
          className="flex flex-wrap items-center gap-1 border-b border-stone-200 bg-stone-100/80 px-2 py-1.5"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
            Table
          </span>
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().addColumnBefore().run())}
            disabled={!editor.can().addColumnBefore()}
            icon={<ArrowLeft className="h-4 w-4" />}
            label="Add column before"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().addColumnAfter().run())}
            disabled={!editor.can().addColumnAfter()}
            icon={<ArrowRight className="h-4 w-4" />}
            label="Add column after"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().deleteColumn().run())}
            disabled={!editor.can().deleteColumn()}
            icon={<Columns2 className="h-4 w-4" />}
            label="Delete column"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().addRowBefore().run())}
            disabled={!editor.can().addRowBefore()}
            icon={<ArrowUp className="h-4 w-4" />}
            label="Add row above"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().addRowAfter().run())}
            disabled={!editor.can().addRowAfter()}
            icon={<ArrowDown className="h-4 w-4" />}
            label="Add row below"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().deleteRow().run())}
            disabled={!editor.can().deleteRow()}
            icon={<Rows2 className="h-4 w-4" />}
            label="Delete row"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().mergeCells().run())}
            disabled={!editor.can().mergeCells()}
            icon={<TableCellsMerge className="h-4 w-4" />}
            label="Merge cells"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().splitCell().run())}
            disabled={!editor.can().splitCell()}
            icon={<TableCellsSplit className="h-4 w-4" />}
            label="Split cell"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().toggleHeaderRow().run())}
            disabled={!editor.can().toggleHeaderRow()}
            active={editor.isActive("tableHeader")}
            icon={<Rows2 className="h-4 w-4" />}
            label="Toggle header row"
          />
          <ToolbarButton
            onClick={() => runCommand(() => editor.chain().focus().deleteTable().run())}
            disabled={!editor.can().deleteTable()}
            icon={<Trash2 className="h-4 w-4" />}
            label="Delete table"
          />
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void addImageFromFile(file);
          event.target.value = "";
        }}
      />

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  disabled,
  icon,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick();
      }}
      title={label}
      aria-label={label}
    >
      {icon}
    </Button>
  );
}
