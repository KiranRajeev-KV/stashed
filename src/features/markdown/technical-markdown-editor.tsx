import * as React from "react";
import {
  Bold,
  Check,
  Code2,
  FileCode2,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Strikethrough,
  Unlink,
  X,
} from "lucide-react";
import { toggleCodeBlock } from "@platejs/code-block";
import { unwrapLink, upsertLink, validateUrl } from "@platejs/link";
import { toggleList } from "@platejs/list";
import { MarkdownPlugin } from "@platejs/markdown";
import {
  KEYS,
  type TElement,
  type TLinkElement,
  type TListElement,
} from "platejs";
import {
  Plate,
  PlateContent,
  useEditorState,
  usePlateEditor,
} from "platejs/react";

import { technicalMarkdownPlugins } from "./technical-markdown-plugins.js";

const EMPTY_VALUE = [{ type: KEYS.p, children: [{ text: "" }] }];
const BLOCK_TYPES: readonly string[] = [
  KEYS.p,
  KEYS.h1,
  KEYS.h2,
  KEYS.h3,
  KEYS.blockquote,
];

type TechnicalMarkdownEditorProps = {
  describedBy?: string;
  initialMarkdown: string;
  invalid?: boolean;
  onBlur?: () => void;
  onChange: (markdown: string) => void;
};

type ToolbarButtonProps = {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  pressed?: boolean;
};

function ToolbarButton({
  children,
  label,
  onPress,
  pressed,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className="idea-editor-tool"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
    >
      {children}
    </button>
  );
}

function EditorToolbar() {
  const editor = useEditorState();
  const [linkOpen, setLinkOpen] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState("");
  const [linkText, setLinkText] = React.useState("");
  const [linkError, setLinkError] = React.useState<string>();
  const selectionRef = React.useRef(editor.selection);
  const urlInputRef = React.useRef<HTMLInputElement>(null);
  const block = editor.api.block<TElement>();
  const blockType = block?.[0].type;
  const listStyleType = (block?.[0] as TListElement | undefined)?.listStyleType;

  React.useEffect(() => {
    if (linkOpen) urlInputRef.current?.focus();
  }, [linkOpen]);

  function focusEditor() {
    window.requestAnimationFrame(() => editor.tf.focus());
  }

  function runTransform(transform: () => void) {
    transform();
    focusEditor();
  }

  function openLinkEditor() {
    selectionRef.current = editor.selection;
    const currentLink = editor.api.above<TLinkElement>({
      match: { type: KEYS.link },
    });
    const selectedText = editor.selection
      ? editor.api.string(editor.selection)
      : "";

    setLinkUrl(currentLink?.[0].url ?? "");
    setLinkText(currentLink ? editor.api.string(currentLink[1]) : selectedText);
    setLinkError(undefined);
    setLinkOpen(true);
  }

  function closeLinkEditor() {
    setLinkOpen(false);
    setLinkError(undefined);
    focusEditor();
  }

  function submitLink() {
    const url = linkUrl.trim();

    if (!url || !validateUrl(editor, url)) {
      setLinkError("Enter a valid http, https, mailto, or tel URL.");
      return;
    }

    if (selectionRef.current) editor.tf.select(selectionRef.current);
    upsertLink(editor, {
      url,
      text: linkText.trim() || undefined,
    });
    setLinkOpen(false);
    setLinkError(undefined);
    focusEditor();
  }

  function removeLink() {
    if (selectionRef.current) editor.tf.select(selectionRef.current);
    unwrapLink(editor, { split: true });
    setLinkOpen(false);
    focusEditor();
  }

  return (
    <div className="idea-editor-toolbar-shell">
      <div
        className="idea-editor-toolbar"
        role="toolbar"
        aria-label="Formatting tools"
      >
        <label className="idea-editor-block-select">
          <span className="sr-only">Block style</span>
          <select
            aria-label="Block style"
            value={
              typeof blockType === "string" && BLOCK_TYPES.includes(blockType)
                ? blockType
                : KEYS.p
            }
            onChange={(event) =>
              runTransform(() =>
                editor.tf.toggleBlock(event.currentTarget.value, {
                  defaultType: KEYS.p,
                }),
              )
            }
          >
            <option value={KEYS.p}>Paragraph</option>
            <option value={KEYS.h1}>Heading 1</option>
            <option value={KEYS.h2}>Heading 2</option>
            <option value={KEYS.h3}>Heading 3</option>
            <option value={KEYS.blockquote}>Quote</option>
          </select>
        </label>

        <span
          className="idea-editor-tool-group"
          role="group"
          aria-label="Text styles"
        >
          <ToolbarButton
            label="Bold"
            pressed={Boolean(editor.api.mark(KEYS.bold))}
            onPress={() => runTransform(() => editor.tf.toggleMark(KEYS.bold))}
          >
            <Bold aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Italic"
            pressed={Boolean(editor.api.mark(KEYS.italic))}
            onPress={() =>
              runTransform(() => editor.tf.toggleMark(KEYS.italic))
            }
          >
            <Italic aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Strikethrough"
            pressed={Boolean(editor.api.mark(KEYS.strikethrough))}
            onPress={() =>
              runTransform(() => editor.tf.toggleMark(KEYS.strikethrough))
            }
          >
            <Strikethrough aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Inline code"
            pressed={Boolean(editor.api.mark(KEYS.code))}
            onPress={() => runTransform(() => editor.tf.toggleMark(KEYS.code))}
          >
            <Code2 aria-hidden="true" />
          </ToolbarButton>
        </span>

        <span
          className="idea-editor-tool-group"
          role="group"
          aria-label="Lists"
        >
          <ToolbarButton
            label="Bulleted list"
            pressed={listStyleType === KEYS.ul}
            onPress={() =>
              runTransform(() => toggleList(editor, { listStyleType: KEYS.ul }))
            }
          >
            <List aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Numbered list"
            pressed={listStyleType === KEYS.ol}
            onPress={() =>
              runTransform(() => toggleList(editor, { listStyleType: KEYS.ol }))
            }
          >
            <ListOrdered aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Task list"
            pressed={listStyleType === KEYS.listTodo}
            onPress={() =>
              runTransform(() =>
                toggleList(editor, { listStyleType: KEYS.listTodo }),
              )
            }
          >
            <ListChecks aria-hidden="true" />
          </ToolbarButton>
        </span>

        <span
          className="idea-editor-tool-group"
          role="group"
          aria-label="Insert"
        >
          <ToolbarButton
            label="Link"
            pressed={linkOpen}
            onPress={openLinkEditor}
          >
            <Link2 aria-hidden="true" />
          </ToolbarButton>
          <ToolbarButton
            label="Code block"
            pressed={blockType === KEYS.codeBlock}
            onPress={() => runTransform(() => toggleCodeBlock(editor))}
          >
            <FileCode2 aria-hidden="true" />
          </ToolbarButton>
        </span>
      </div>

      {linkOpen ? (
        <div
          className="idea-editor-link-row"
          role="group"
          aria-label="Edit link"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeLinkEditor();
            }
          }}
        >
          <div className="idea-editor-link-field">
            <label htmlFor="idea-editor-link-url">URL</label>
            <input
              ref={urlInputRef}
              id="idea-editor-link-url"
              type="url"
              inputMode="url"
              value={linkUrl}
              aria-invalid={Boolean(linkError)}
              aria-describedby={
                linkError ? "idea-editor-link-error" : undefined
              }
              placeholder="https://example.com"
              onChange={(event) => {
                setLinkUrl(event.currentTarget.value);
                setLinkError(undefined);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitLink();
                }
              }}
            />
          </div>
          <div className="idea-editor-link-field">
            <label htmlFor="idea-editor-link-text">Text</label>
            <input
              id="idea-editor-link-text"
              value={linkText}
              placeholder="Selected text"
              onChange={(event) => setLinkText(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitLink();
                }
              }}
            />
          </div>
          <div className="idea-editor-link-actions">
            <button
              type="button"
              aria-label="Apply link"
              title="Apply link"
              onClick={submitLink}
            >
              <Check aria-hidden="true" />
            </button>
            {editor.api.above({ match: { type: KEYS.link } }) ? (
              <button
                type="button"
                aria-label="Remove link"
                title="Remove link"
                onClick={removeLink}
              >
                <Unlink aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Close link editor"
              title="Close link editor"
              onClick={closeLinkEditor}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          {linkError ? (
            <p
              id="idea-editor-link-error"
              className="idea-editor-link-error"
              role="alert"
            >
              {linkError}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TechnicalMarkdownEditor({
  describedBy,
  initialMarkdown,
  invalid = false,
  onBlur,
  onChange,
}: TechnicalMarkdownEditorProps) {
  const editor = usePlateEditor(
    {
      plugins: technicalMarkdownPlugins,
      value: (currentEditor) => {
        const value = currentEditor
          .getApi(MarkdownPlugin)
          .markdown.deserialize(initialMarkdown);
        return value.length > 0 ? value : EMPTY_VALUE;
      },
    },
    [initialMarkdown],
  );

  return (
    <div className="idea-editor" data-invalid={invalid || undefined}>
      <Plate
        editor={editor}
        onValueChange={({ value }) =>
          onChange(editor.getApi(MarkdownPlugin).markdown.serialize({ value }))
        }
      >
        <EditorToolbar />
        <PlateContent
          className="idea-editor-content markdown-content"
          aria-label="Idea content"
          aria-describedby={describedBy}
          aria-invalid={invalid}
          placeholder="Develop the idea here…"
          spellCheck
          onBlur={onBlur}
        />
      </Plate>
    </div>
  );
}
