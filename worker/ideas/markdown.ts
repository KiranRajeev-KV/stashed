import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { unified } from "unified";

type MarkdownNode = {
  alt?: string;
  children?: MarkdownNode[];
  type: string;
  value?: string;
};

const markdownParser = unified().use(remarkParse).use(remarkGfm);

function textFromNode(node: MarkdownNode): string {
  if (typeof node.value === "string") return node.value;
  if (typeof node.alt === "string") return node.alt;

  const separator =
    node.type === "tableRow"
      ? " "
      : ["root", "blockquote", "list", "listItem", "table"].includes(node.type)
        ? "\n"
        : "";

  return (node.children ?? []).map(textFromNode).join(separator);
}

/**
 * Converts the Markdown stored for an idea into text suitable for excerpts and
 * full-text search. The GFM parser understands the same task-list syntax as
 * the editor, so formatting markers and character references never reach the
 * cards or FTS index.
 */
export function markdownToPlainText(markdown: string): string {
  if (/^\s*(?:&#x20;)?\s*$/i.test(markdown)) return "";

  const document = markdownParser.parse(markdown) as MarkdownNode;

  return textFromNode(document).replace(/\s+/g, " ").trim();
}

export function excerptFromPlainText(content: string, limit = 240): string {
  const compact = markdownToPlainText(content);
  if (compact.length <= limit) return compact;

  const boundary = compact.lastIndexOf(" ", limit - 1);
  return `${compact.slice(0, boundary > 0 ? boundary : limit - 1)}…`;
}
