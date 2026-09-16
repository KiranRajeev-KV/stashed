import { Search, X } from "lucide-react";
import * as React from "react";

import { twArchiveSearchField } from "../../styles/archive-styles.js";
import { SearchActivity } from "./search-transition.js";

type ArchiveSearchFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value?: string;
  onValueChange: (value?: string) => void;
  description?: string;
  debounceMs?: number;
  isSearching?: boolean;
  className?: string;
};

/**
 * A local, URL-backed archive search. Pages own their result scope and layout;
 * this component keeps the field's visual and keyboard behaviour consistent.
 */
export function ArchiveSearchField({
  id,
  label,
  placeholder,
  value = "",
  onValueChange,
  description = "Results update automatically as you type.",
  debounceMs = 250,
  isSearching = false,
  className,
}: ArchiveSearchFieldProps) {
  const [draftValue, setDraftValue] = React.useState(value);
  const descriptionId = React.useId();

  React.useEffect(() => {
    setDraftValue(value);
  }, [value]);

  React.useEffect(() => {
    const nextValue = draftValue.trim();
    if (nextValue === value) return;

    const timeout = window.setTimeout(
      () => onValueChange(nextValue || undefined),
      debounceMs,
    );
    return () => window.clearTimeout(timeout);
  }, [debounceMs, draftValue, onValueChange, value]);

  const clear = () => {
    setDraftValue("");
    onValueChange(undefined);
  };

  return (
    <div className={`${twArchiveSearchField} ${className ?? ""}`} role="search">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span id={descriptionId} className="sr-only">
        {description}
      </span>
      <Search
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span className="grid size-4 place-items-center">
        <SearchActivity
          active={isSearching}
          label={`Searching ${label.toLowerCase()}`}
        />
      </span>
      <input
        id={id}
        type="search"
        value={draftValue}
        onChange={(event) => setDraftValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== "Escape" || !draftValue) return;
          event.preventDefault();
          clear();
        }}
        maxLength={200}
        autoComplete="off"
        aria-describedby={descriptionId}
        placeholder={placeholder}
        className="h-full w-full"
      />
      {draftValue ? (
        <button
          type="button"
          onClick={clear}
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-control text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
          aria-label={`Clear ${label.toLowerCase()}`}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      ) : (
        <span className="size-8" aria-hidden="true" />
      )}
    </div>
  );
}
