import * as React from "react";
import { LoaderCircle, Plus, RotateCcw, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { tagsQueryOptions } from "../../api/tags.js";

type TagSelectorProps = {
  describedBy?: string;
  draft: string;
  inputId: string;
  invalid?: boolean;
  maxTags?: number;
  onChange: (tags: string[]) => void;
  onBlur?: () => void;
  onDraftChange: (draft: string) => void;
  tags: string[];
};

type TagOption = {
  id: string;
  kind: "existing" | "create";
  name: string;
};

function normalizeTagName(name: string) {
  return name.trim();
}

function tagKey(name: string) {
  return normalizeTagName(name).toLocaleLowerCase("en-US");
}

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

export function TagSelector({
  describedBy,
  draft,
  inputId,
  invalid = false,
  maxTags = 20,
  onChange,
  onBlur,
  onDraftChange,
  tags,
}: TagSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listboxId = React.useId();
  const debouncedDraft = useDebouncedValue(draft.trim(), 220);
  const selectedKeys = new Set(tags.map(tagKey));
  const tagsQuery = useQuery({
    ...tagsQueryOptions({
      q: debouncedDraft || undefined,
      limit: "8",
      offset: "0",
    }),
    enabled: open,
  });
  const existingOptions: TagOption[] = (tagsQuery.data?.tags ?? [])
    .filter((tag) => !selectedKeys.has(tagKey(tag.name)))
    .map((tag) => ({ id: tag.id, kind: "existing", name: tag.name }));
  const normalizedDraft = normalizeTagName(draft);
  const canCreate =
    normalizedDraft.length > 0 &&
    !selectedKeys.has(tagKey(normalizedDraft)) &&
    !existingOptions.some((option) => tagKey(option.name) === tagKey(draft));
  const options: TagOption[] = canCreate
    ? [
        ...existingOptions,
        {
          id: `create-${tagKey(normalizedDraft)}`,
          kind: "create",
          name: normalizedDraft,
        },
      ]
    : existingOptions;
  const activeOption = options[activeIndex];
  const suggestionsMatchDraft = debouncedDraft === draft.trim();
  const atLimit = tags.length >= maxTags;

  React.useEffect(() => {
    setActiveIndex(0);
  }, [debouncedDraft]);

  function addTag(name: string) {
    const normalized = normalizeTagName(name);
    if (!normalized || atLimit || selectedKeys.has(tagKey(normalized))) {
      onDraftChange("");
      return;
    }

    onChange([...tags, normalized]);
    onDraftChange("");
    setActiveIndex(0);
    setOpen(true);
  }

  function removeTag(name: string) {
    const key = tagKey(name);
    onChange(tags.filter((tag) => tagKey(tag) !== key));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % options.length);
      return;
    }

    if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
      return;
    }

    if ((event.key === "Enter" || event.key === ",") && normalizedDraft) {
      event.preventDefault();
      addTag(
        suggestionsMatchDraft
          ? (activeOption?.name ?? normalizedDraft)
          : normalizedDraft,
      );
      return;
    }

    if (event.key === "Backspace" && !draft && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={rootRef}
      className="tag-selector"
      data-invalid={invalid || undefined}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget)) {
          if (normalizedDraft) addTag(normalizedDraft);
          onBlur?.();
          setOpen(false);
        }
      }}
    >
      <div className="tag-selector-input-row">
        {tags.map((tag) => (
          <span key={tagKey(tag)} className="tag-token">
            <span>{tag}</span>
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => removeTag(tag)}
            >
              <X aria-hidden="true" />
            </button>
          </span>
        ))}

        <input
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeOption
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          aria-describedby={describedBy}
          aria-invalid={invalid}
          disabled={atLimit}
          value={draft}
          placeholder={
            atLimit
              ? "Tag limit reached"
              : tags.length
                ? "Add another…"
                : "Search or create tags…"
          }
          onChange={(event) => {
            onDraftChange(event.currentTarget.value.replace(/^\s+/, ""));
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
        />

        {tagsQuery.isFetching ? (
          <LoaderCircle
            className="tag-selector-loader"
            aria-label="Loading tag suggestions"
          />
        ) : null}
      </div>

      {open && !atLimit ? (
        <div className="tag-selector-menu" id={listboxId} role="listbox">
          {tagsQuery.isError ? (
            <div className="tag-selector-message" role="status">
              <span>
                Suggestions unavailable. You can still create this tag.
              </span>
              <button type="button" onClick={() => tagsQuery.refetch()}>
                <RotateCcw aria-hidden="true" />
                Retry
              </button>
            </div>
          ) : null}

          {!tagsQuery.isError && tagsQuery.isPending ? (
            <p className="tag-selector-message" role="status">
              Looking through tags…
            </p>
          ) : null}

          {!tagsQuery.isError &&
          !tagsQuery.isPending &&
          options.length === 0 ? (
            <p className="tag-selector-message">
              {normalizedDraft
                ? "No matching tags. Press Enter to create it."
                : "No tags have been used yet."}
            </p>
          ) : null}

          {options.map((option, index) => (
            <button
              key={option.id}
              id={`${listboxId}-option-${index}`}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              className="tag-selector-option"
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => addTag(option.name)}
            >
              <span>{option.name}</span>
              {option.kind === "create" ? (
                <span className="tag-selector-create">
                  <Plus aria-hidden="true" />
                  Create
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <p className="tag-selector-count" aria-live="polite">
        {tags.length}/{maxTags} tags
      </p>
    </div>
  );
}
