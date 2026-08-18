import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";

import { technicalMarkdownPlugins } from "./technical-markdown-plugins.js";

type MarkdownContentProps = {
  markdown: string;
};

export function MarkdownContent({ markdown }: MarkdownContentProps) {
  const isEmpty = /^\s*(?:&#x20;)?\s*$/i.test(markdown);

  const editor = usePlateEditor(
    {
      plugins: technicalMarkdownPlugins,
      value: (nextEditor) =>
        nextEditor.getApi(MarkdownPlugin).markdown.deserialize(markdown),
    },
    [markdown],
  );

  if (isEmpty) return null;

  return (
    <section aria-label="Idea content" className="markdown-reading-surface">
      <Plate editor={editor} readOnly>
        <PlateContent readOnly className="markdown-content" />
      </Plate>
    </section>
  );
}
