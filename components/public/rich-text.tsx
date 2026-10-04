import { Fragment, type ReactNode } from "react";

/**
 * Renders a Tiptap document (security.md 4).
 *
 * Posts are stored as structured JSON, never HTML, and this walks that JSON
 * with an explicit allowlist of node and mark types. Anything not on the list
 * is dropped. There is no `dangerouslySetInnerHTML` anywhere in the path, so
 * a stored `<script>` — however it got into the database — cannot execute: it
 * would simply not match a known node type.
 *
 * Link handling is deliberately strict. `javascript:` and `data:` URLs are
 * dropped rather than rendered, because an editor compromise should not become
 * script execution on a visitor's device.
 */

type TiptapMark = { type?: unknown; attrs?: Record<string, unknown> };

type TiptapNode = {
  type?: unknown;
  text?: unknown;
  attrs?: Record<string, unknown>;
  marks?: unknown;
  content?: unknown;
};

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);

function safeHref(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) return null;
  try {
    /* Resolved against a base so relative hrefs like "/about" still parse. */
    const url = new URL(value, "https://osptech.co.tz");
    return SAFE_PROTOCOLS.has(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

/** Wraps a text node in whichever allowed marks it carries. */
function applyMarks(text: string, marks: unknown, key: number): ReactNode {
  if (!Array.isArray(marks) || marks.length === 0) {
    return <Fragment key={key}>{text}</Fragment>;
  }

  return marks.reduce<ReactNode>(
    (acc, rawMark) => {
      const mark = rawMark as TiptapMark;

      switch (mark.type) {
        case "bold":
          return <strong className="font-bold">{acc}</strong>;
        case "italic":
          return <em>{acc}</em>;
        case "underline":
          return <u>{acc}</u>;
        case "strike":
          return <s>{acc}</s>;
        case "code":
          return (
            <code className="bg-cloud rounded-input text-small px-1.5 py-0.5">
              {acc}
            </code>
          );
        case "link": {
          const href = safeHref(mark.attrs?.href);
          if (!href) return acc;
          const external = /^https?:/i.test(href);
          return (
            <a
              href={href}
              className="text-blue-strong rounded-input font-medium underline underline-offset-4"
              {...(external && {
                target: "_blank",
                rel: "noopener noreferrer",
              })}
            >
              {acc}
            </a>
          );
        }
        default:
          /* Unknown mark: keep the text, drop the formatting. */
          return acc;
      }
    },
    <Fragment key={key}>{text}</Fragment>,
  );
}

function renderNodes(content: unknown): ReactNode {
  if (!Array.isArray(content)) return null;
  return content.map((node, i) => (
    <Fragment key={i}>{renderNode(node as TiptapNode, i)}</Fragment>
  ));
}

function renderNode(node: TiptapNode, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return typeof node.text === "string"
        ? applyMarks(node.text, node.marks, key)
        : null;

    case "paragraph":
      return (
        <p className="text-body text-navy mt-5 leading-relaxed">
          {renderNodes(node.content)}
        </p>
      );

    case "heading": {
      const level = Number(node.attrs?.level);
      /* The post's own title is the h1, so body headings start at h2 and the
         document keeps a sensible outline for screen readers. */
      const Tag = (
        level === 1 || level === 2 ? "h2" : level === 3 ? "h3" : "h4"
      ) as "h2" | "h3" | "h4";
      const size =
        Tag === "h2" ? "text-h2" : Tag === "h3" ? "text-h3" : "text-body-lg";
      return (
        <Tag className={`${size} text-navy mt-10 font-bold`}>
          {renderNodes(node.content)}
        </Tag>
      );
    }

    case "bulletList":
      return (
        <ul className="text-body text-navy mt-5 list-disc space-y-2 pl-6">
          {renderNodes(node.content)}
        </ul>
      );

    case "orderedList":
      return (
        <ol className="text-body text-navy mt-5 list-decimal space-y-2 pl-6">
          {renderNodes(node.content)}
        </ol>
      );

    case "listItem":
      return <li>{renderNodes(node.content)}</li>;

    case "blockquote":
      return (
        <blockquote className="border-teal text-slate mt-6 border-l-4 pl-5 italic">
          {renderNodes(node.content)}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre className="bg-navy rounded-card text-small mt-6 overflow-x-auto p-4 text-white">
          <code>{renderNodes(node.content)}</code>
        </pre>
      );

    case "horizontalRule":
      return <hr className="border-border mt-8 border-t" />;

    case "hardBreak":
      return <br />;

    default:
      /* Unknown node type: render its children if it has any, drop it if not.
         Never render it as raw markup. */
      return node.content ? renderNodes(node.content) : null;
  }
}

export function RichText({ doc }: { doc: unknown }) {
  if (!doc || typeof doc !== "object") return null;
  const root = doc as TiptapNode;
  if (root.type !== "doc") return null;

  return <div className="max-w-[42rem]">{renderNodes(root.content)}</div>;
}
