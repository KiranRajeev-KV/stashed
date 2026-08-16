import type { TCodeBlockElement, TLinkElement, TListElement } from "platejs";
import { getLinkAttributes } from "@platejs/link";
import { isOrderedList } from "@platejs/list";
import {
  useTodoListElement,
  useTodoListElementState,
} from "@platejs/list/react";
import { KEYS } from "platejs";
import {
  PlateElement,
  PlateLeaf,
  type PlateElementProps,
  type PlateLeafProps,
  type RenderNodeWrapper,
  useReadOnly,
} from "platejs/react";

export function ParagraphElement(props: PlateElementProps) {
  return <PlateElement as="p" {...props} />;
}

export function H1Element(props: PlateElementProps) {
  return <PlateElement as="h1" {...props} />;
}

export function H2Element(props: PlateElementProps) {
  return <PlateElement as="h2" {...props} />;
}

export function H3Element(props: PlateElementProps) {
  return <PlateElement as="h3" {...props} />;
}

export function BlockquoteElement(props: PlateElementProps) {
  return <PlateElement as="blockquote" {...props} />;
}

export function InlineCodeLeaf(props: PlateLeafProps) {
  return <PlateLeaf as="code" {...props} />;
}

export function LinkElement(props: PlateElementProps<TLinkElement>) {
  return (
    <PlateElement
      {...props}
      as="a"
      attributes={{
        ...props.attributes,
        ...getLinkAttributes(props.editor, props.element),
      }}
    >
      {props.children}
    </PlateElement>
  );
}

export const MarkdownBlockList: RenderNodeWrapper = (props) => {
  if (!props.element.listStyleType) return;

  return (listProps) => <BlockList {...listProps} />;
};

function BlockList(props: PlateElementProps) {
  const { listStart, listStyleType } = props.element as TListElement;
  const isTaskList = listStyleType === KEYS.listTodo;
  const List = isTaskList || !isOrderedList(props.element) ? "ul" : "ol";

  return (
    <List
      className={
        isTaskList
          ? "markdown-block-list markdown-task-list"
          : "markdown-block-list"
      }
      style={isTaskList ? undefined : { listStyleType }}
      start={listStart}
    >
      {isTaskList ? <TaskListMarker {...props} /> : null}
      <li
        className={
          isTaskList && props.element.checked
            ? "markdown-task-complete"
            : undefined
        }
      >
        {props.children}
      </li>
    </List>
  );
}

function TaskListMarker(props: PlateElementProps) {
  const state = useTodoListElementState({ element: props.element });
  const { checkboxProps } = useTodoListElement(state);
  const readOnly = useReadOnly();

  return (
    <span
      className="markdown-task-checkbox"
      contentEditable={false}
      suppressContentEditableWarning
    >
      <input
        type="checkbox"
        checked={checkboxProps.checked}
        disabled={readOnly}
        aria-label={
          checkboxProps.checked ? "Completed task" : "Incomplete task"
        }
        onChange={(event) =>
          checkboxProps.onCheckedChange(event.currentTarget.checked)
        }
      />
    </span>
  );
}

export function CodeBlockElement(props: PlateElementProps<TCodeBlockElement>) {
  const language = props.element.lang?.trim();

  return (
    <PlateElement {...props}>
      <div className="markdown-code-block">
        {language ? (
          <span className="markdown-code-language" contentEditable={false}>
            {language}
          </span>
        ) : null}
        <pre>
          <code>{props.children}</code>
        </pre>
      </div>
    </PlateElement>
  );
}

export function CodeLineElement(props: PlateElementProps) {
  return <PlateElement {...props} />;
}

export function CodeSyntaxLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} />;
}
