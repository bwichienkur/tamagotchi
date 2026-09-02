"use client";

import { useEffect, useMemo } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content,
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-stone max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
  });

  useEffect(() => {
    if (!editor || editor.isFocused) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) return null;

  const runCommand = (command: () => void) => {
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

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) {
      runCommand(() => editor.chain().focus().setImage({ src: url }).run());
    }
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border border-stone-200", className)}>
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
        <ToolbarButton onClick={addImage} icon={<ImageIcon className="h-4 w-4" />} label="Image" />
        <ToolbarButton
          onClick={() =>
            runCommand(() =>
              editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
            )
          }
          icon={<TableIcon className="h-4 w-4" />}
          label="Table"
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  icon,
  label,
}: {
  onClick: () => void;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      size="icon"
      className="h-8 w-8"
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
