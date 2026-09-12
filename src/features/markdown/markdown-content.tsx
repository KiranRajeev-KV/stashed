import {
  twMarkdownContent,
  twMarkdownReadingSurface,
  twMarkdownCodeBlock,
  twMarkdownCodeLanguage,
  twMarkdownTaskCheckbox,
} from "../../styles/markdown-styles.js";
import { createContext, memo, useContext } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

type MarkdownContentProps = {
  markdown: string;
  onTaskListChange?: (markdown: string) => void;
  taskListDisabled?: boolean;
};

const TaskContext = createContext<
  Omit<MarkdownContentProps, "markdown"> & { markdown: string }
>({ markdown: "" });
const TaskOffsetContext = createContext<number | undefined>(undefined);
const remarkPlugins = [remarkGfm];

// Keep these components stable so a checklist update does not remount the input.
const components: Components = {
  li: ({ node, children, className, ...props }) => (
    <TaskOffsetContext.Provider value={node?.position?.start.offset}>
      <li
        {...props}
        className={`${className ?? ""} relative [&.task-list-item]:list-none [&.task-list-item]:min-h-control [&.task-list-item]:pl-6 [&.task-list-item]:pt-1.5 [&.task-list-item:has(>label>input:checked,>p>label>input:checked)]:text-muted-foreground [&.task-list-item:has(>label>input:checked,>p>label>input:checked)]:line-through`}
      >
        {children}
      </li>
    </TaskOffsetContext.Provider>
  ),
  input: function TaskCheckbox({ checked }) {
    const { markdown, onTaskListChange, taskListDisabled } =
      useContext(TaskContext);
    const offset = useContext(TaskOffsetContext);
    // Change only the task marker; preserve all other source formatting verbatim.
    const marker =
      offset === undefined
        ? null
        : /^(?:[-+*]|\d+[.)])\s+\[([ xX])\]/.exec(markdown.slice(offset));
    const disabled = !onTaskListChange || taskListDisabled || !marker;
    return (
      <label className={`${twMarkdownTaskCheckbox} -left-5! top-0!`}>
        <input
          type="checkbox"
          checked={Boolean(checked)}
          disabled={disabled}
          aria-label={checked ? "Mark task incomplete" : "Mark task complete"}
          onChange={(event) => {
            if (disabled || offset === undefined || !marker) return;
            const index = offset + marker[0].length - 2;
            onTaskListChange?.(
              markdown.slice(0, index) +
                (event.currentTarget.checked ? "x" : " ") +
                markdown.slice(index + 1),
            );
          }}
        />
      </label>
    );
  },
  pre: ({ node, children }) => {
    const code = node?.children.find(
      (child) => child.type === "element" && child.tagName === "code",
    );
    const classes =
      code?.type === "element" ? code.properties.className : undefined;
    const language = Array.isArray(classes)
      ? classes.find((value) => String(value).startsWith("language-"))
      : undefined;
    return (
      <div className={twMarkdownCodeBlock}>
        {language ? (
          <span className={twMarkdownCodeLanguage}>
            {String(language).slice(9)}
          </span>
        ) : null}
        <pre>{children}</pre>
      </div>
    );
  },
  table: ({ children }) => (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full border-collapse [&_th]:border [&_td]:border [&_th]:border-border [&_td]:border-border [&_th]:p-2 [&_td]:p-2">
        {children}
      </table>
    </div>
  ),
};

const MarkdownDocument = memo(function MarkdownDocument({
  markdown,
}: {
  markdown: string;
}) {
  return (
    <Markdown remarkPlugins={remarkPlugins} components={components} skipHtml>
      {markdown}
    </Markdown>
  );
});

export function MarkdownContent({
  markdown,
  onTaskListChange,
  taskListDisabled = false,
}: MarkdownContentProps) {
  const isEmpty = /^\s*(?:&#x20;)?\s*$/i.test(markdown);

  if (isEmpty) return null;

  return (
    <section aria-label="Idea content" className={twMarkdownReadingSurface}>
      <TaskContext.Provider
        value={{ markdown, onTaskListChange, taskListDisabled }}
      >
        <div className={twMarkdownContent}>
          <MarkdownDocument markdown={markdown} />
        </div>
      </TaskContext.Provider>
    </section>
  );
}
