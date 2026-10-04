"use client";

import { useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Code,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Tiptap editor for post bodies (FR-A6, architecture.md 4).
 *
 * Produces structured JSON, never HTML. That is what makes the public
 * renderer safe: it walks known node types through an allowlist, so there is
 * no path from this editor to script execution on a visitor's page
 * (security.md 4).
 *
 * The document is mirrored into a hidden input as JSON on every change, so
 * the surrounding form posts it like any other field and the Server Action
 * stays a plain FormData handler.
 *
 * Loaded only inside the admin, and the admin is a dynamic, authenticated
 * surface — so Tiptap never reaches a public page's bundle.
 */
export function PostEditor({
  name = "body",
  initialContent,
}: {
  name?: string;
  /** Tiptap JSON from the database, or null for a new post. */
  initialContent?: unknown;
}) {
  const [json, setJson] = useState<string>(() =>
    initialContent ? JSON.stringify(initialContent) : "",
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        /* Only these protocols can be produced here. The renderer re-checks,
           because the database is the trust boundary, not this component. */
        protocols: ["http", "https", "mailto", "tel"],
      }),
    ],
    content: (initialContent as object) ?? "",
    /* Next renders this on the server first; without this flag Tiptap warns
       about an SSR/client mismatch. */
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[22rem] rounded-b-[14px] bg-white px-4 py-4 text-body text-navy focus:outline-none [&_p]:mt-3 [&_h2]:mt-6 [&_h2]:text-h2 [&_h2]:font-bold [&_h3]:mt-5 [&_h3]:text-h3 [&_h3]:font-semibold [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-teal [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-blue-strong [&_a]:underline",
      },
    },
    onUpdate: ({ editor }) => setJson(JSON.stringify(editor.getJSON())),
  });

  function setLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");

    /* Cancelled: leave the document alone. */
    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const buttonClass =
    "rounded-input text-navy hover:bg-cloud inline-flex size-9 items-center justify-center transition-colors disabled:opacity-40";
  const activeClass = "bg-blue-strong text-white hover:bg-blue-strong";

  return (
    <div>
      <input type="hidden" name={name} value={json} readOnly />

      <div className="border-border rounded-card overflow-hidden border">
        {editor && (
          <div
            className="border-border bg-cloud flex flex-wrap gap-1 border-b p-2"
            role="toolbar"
            aria-label="Formatting"
          >
            <ToolbarButton
              label="Bold"
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              className={cn(
                buttonClass,
                editor.isActive("bold") && activeClass,
              )}
            >
              <Bold aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Italic"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              className={cn(
                buttonClass,
                editor.isActive("italic") && activeClass,
              )}
            >
              <Italic aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Heading 2"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              active={editor.isActive("heading", { level: 2 })}
              className={cn(
                buttonClass,
                editor.isActive("heading", { level: 2 }) && activeClass,
              )}
            >
              <Heading2 aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Heading 3"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              active={editor.isActive("heading", { level: 3 })}
              className={cn(
                buttonClass,
                editor.isActive("heading", { level: 3 }) && activeClass,
              )}
            >
              <Heading3 aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Bullet list"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              className={cn(
                buttonClass,
                editor.isActive("bulletList") && activeClass,
              )}
            >
              <List aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Numbered list"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              className={cn(
                buttonClass,
                editor.isActive("orderedList") && activeClass,
              )}
            >
              <ListOrdered aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Quote"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              className={cn(
                buttonClass,
                editor.isActive("blockquote") && activeClass,
              )}
            >
              <Quote aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Code block"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              active={editor.isActive("codeBlock")}
              className={cn(
                buttonClass,
                editor.isActive("codeBlock") && activeClass,
              )}
            >
              <Code aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Link"
              onClick={setLink}
              active={editor.isActive("link")}
              className={cn(
                buttonClass,
                editor.isActive("link") && activeClass,
              )}
            >
              <LinkIcon aria-hidden className="size-4" />
            </ToolbarButton>

            <span className="bg-border mx-1 w-px" aria-hidden="true" />

            <ToolbarButton
              label="Undo"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={buttonClass}
            >
              <Undo2 aria-hidden className="size-4" />
            </ToolbarButton>

            <ToolbarButton
              label="Redo"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={buttonClass}
            >
              <Redo2 aria-hidden className="size-4" />
            </ToolbarButton>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={className}
    >
      {children}
    </button>
  );
}
