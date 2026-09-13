"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { useState } from "react";

const btn = (active: boolean) =>
  `rounded px-2 py-1 text-sm transition ${
    active ? "bg-pink-100 text-pink-900" : "text-stone-600 hover:bg-stone-100"
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
    return <div className="h-96 animate-pulse rounded-lg border border-stone-300 bg-stone-50" />;
  }

  return (
    <div className="rounded-lg border border-stone-300 bg-white">
      <div className="flex flex-wrap items-center gap-1 border-b border-stone-200 px-2 py-1.5">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive("bold"))}>
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive("italic"))}>
          <em>I</em>
        </button>
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive("heading", { level: 2 }))}>
          H2
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive("heading", { level: 3 }))}>
          H3
        </button>
        <span className="mx-1 h-4 w-px bg-stone-200" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive("bulletList"))}>
          • List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive("orderedList"))}>
          1. List
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive("blockquote"))}>
          Quote
        </button>
        <span className="mx-1 h-4 w-px bg-stone-200" />
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
        <button type="button" onClick={() => editor.chain().focus().unsetLink().run()} className={btn(false)}>
          Unlink
        </button>
      </div>

      {linkOpen && (
        <div className="flex gap-2 border-b border-stone-200 bg-stone-50 px-3 py-2">
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            className="flex-1 rounded border border-stone-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={() => {
              if (linkUrl) editor.chain().focus().setLink({ href: linkUrl }).run();
              setLinkOpen(false);
            }}
            className="rounded bg-pink-800 px-3 py-1 text-sm text-white"
          >
            Apply
          </button>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
