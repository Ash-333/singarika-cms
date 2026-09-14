"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useState } from "react";
import { Button, inputClass } from "@/components/ui";

const btn = (active: boolean) =>
  `rounded-md px-2.5 py-1.5 text-sm transition ${
    active ? "bg-primary text-white" : "text-ink-soft hover:bg-sunk"
  }`;

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener" } }),
    ],
    content: value,
    // Tiptap renders on the client only; SSR would mismatch the DOM.
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose-content px-4 py-3" },
    },
  });

  if (!editor) {
    return <div className="h-96 animate-pulse rounded-lg border border-hairline bg-sunk" />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-hairline-strong bg-surface">
      <div className="flex flex-wrap items-center gap-1 border-b border-hairline bg-sunk px-2 py-2">
        <button
          type="button"
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive("bold"))}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive("italic"))}
        >
          <em>I</em>
        </button>
        <span className="mx-1 h-5 w-px bg-hairline" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive("heading", { level: 2 }))}
        >
          Heading
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive("heading", { level: 3 }))}
        >
          Subheading
        </button>
        <span className="mx-1 h-5 w-px bg-hairline" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive("bulletList"))}
        >
          Bullets
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive("orderedList"))}
        >
          Numbers
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btn(editor.isActive("blockquote"))}
        >
          Quote
        </button>
        <span className="mx-1 h-5 w-px bg-hairline" />
        <button
          type="button"
          onClick={() => {
            setLinkUrl(editor.getAttributes("link").href ?? "");
            setLinkOpen((o) => !o);
          }}
          className={btn(editor.isActive("link"))}
        >
          Link
        </button>
        {editor.isActive("link") && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
            className={btn(false)}
          >
            Remove link
          </button>
        )}
      </div>

      {linkOpen && (
        <div className="flex gap-2 border-b border-hairline bg-primary-soft px-3 py-2">
          <input
            autoFocus
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            aria-label="Link address"
            className={`${inputClass} py-2`}
          />
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (linkUrl) editor.chain().focus().setLink({ href: linkUrl }).run();
              setLinkOpen(false);
            }}
          >
            Add link
          </Button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
