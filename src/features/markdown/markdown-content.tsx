import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";

import { technicalMarkdownPlugins } from "./technical-markdown-plugins.js";
import { TaskListInteractionContext } from "./task-list-interaction.js";

type MarkdownContentProps = {
  markdown: string;
  onTaskListChange?: (markdown: string) => void;
  taskListDisabled?: boolean;
};

export function MarkdownContent({
  markdown,
  onTaskListChange,
  taskListDisabled = false,
}: MarkdownContentProps) {
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
      <TaskListInteractionContext.Provider
        value={
          onTaskListChange
            ? { disabled: taskListDisabled, onToggle: onTaskListChange }
            : null
        }
      >
        <Plate editor={editor} readOnly>
          <PlateContent readOnly className="markdown-content" />
        </Plate>
      </TaskListInteractionContext.Provider>
    </section>
  );
}
