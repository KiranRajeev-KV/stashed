import { Combobox } from "@base-ui/react/combobox";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronsUpDown,
  LoaderCircle,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import * as React from "react";

import { tagsQueryOptions, type Tag } from "../../api/tags.js";
import type { IdeaSort, IdeaStatus } from "../../api/ideas.js";
import { StatusSelect } from "./status-select.js";
import { SortSelect } from "./sort-select.js";

const tagDiscoveryQuery = { limit: "100", offset: "0" } as const;
const filterFieldClass = "grid min-w-0 gap-2";
const filterLabelClass =
  "font-mono text-xs uppercase tracking-wider text-muted-foreground";
const filterTriggerClass =
  "flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 text-left text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:border-border-strong data-[popup-open]:bg-surface-elevated";
const filterOptionClass =
  "group grid min-h-11 w-full cursor-pointer grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-control px-3 py-2 text-sm text-foreground outline-none select-none data-[highlighted]:bg-surface-muted";
const filterIndicatorClass =
  "invisible grid place-items-center text-primary group-data-[selected]:visible [&_svg]:size-4";

type FilterTag = Pick<Tag, "id" | "name"> & {
  ideaCount?: number;
};

type IdeaFiltersProps = {
  ideaTags: FilterTag[];
  onClear: () => void;
  onSortChange: (sort?: IdeaSort) => void;
  onStatusChange: (status?: IdeaStatus) => void;
  onTagsChange: (tagIds?: string[]) => void;
  status?: IdeaStatus;
  sort?: IdeaSort;
  tagIds?: string[];
};

function useDebouncedValue(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, value]);

  return debouncedValue;
}

function uniqueTags(tags: FilterTag[]) {
  return [...new Map(tags.map((tag) => [tag.id, tag])).values()];
}

function TagFilter({
  ideaTags,
  onChange,
  tagIds = [],
}: {
  ideaTags: FilterTag[];
  onChange: (tagIds?: string[]) => void;
  tagIds?: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const debouncedInput = useDebouncedValue(inputValue.trim(), 220);
  const discoveryQuery = useQuery(tagsQueryOptions(tagDiscoveryQuery));
  const searchQuery = useQuery({
    ...tagsQueryOptions({
      q: debouncedInput || undefined,
      limit: "20",
      offset: "0",
    }),
    enabled: open && debouncedInput.length > 0,
  });
  const knownTags = uniqueTags([
    ...(discoveryQuery.data?.tags ?? []),
    ...(searchQuery.data?.tags ?? []),
    ...ideaTags,
  ]);
  const knownTagsById = new Map(knownTags.map((tag) => [tag.id, tag]));
  const selectedTags = tagIds.map(
    (id): FilterTag =>
      knownTagsById.get(id) ?? {
        id,
        name: `Tag ${id.slice(0, 8)}`,
      },
  );
  const visibleOptions = uniqueTags([
    ...selectedTags,
    ...(debouncedInput
      ? (searchQuery.data?.tags ?? [])
      : (discoveryQuery.data?.tags ?? [])),
  ]);
  const activeQuery = debouncedInput ? searchQuery : discoveryQuery;

  return (
    <Combobox.Root
      items={visibleOptions}
      value={selectedTags}
      inputValue={inputValue}
      multiple
      filter={null}
      itemToStringLabel={(tag: FilterTag) => tag.name}
      isItemEqualToValue={(tag, selectedTag) => tag.id === selectedTag.id}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setInputValue("");
      }}
      onInputValueChange={(nextValue, details) => {
        if (details.reason !== "item-press") setInputValue(nextValue);
      }}
      onValueChange={(nextTags) => {
        const nextIds = nextTags.map((tag) => tag.id).sort();
        onChange(nextIds.length > 0 ? nextIds : undefined);
        setInputValue("");
      }}
    >
      <div className="contents">
        <div
          className={`${filterFieldClass} sm:col-start-2 sm:row-start-1 lg:col-start-2`}
        >
          <Combobox.Label className={filterLabelClass}>Tags</Combobox.Label>
          <Combobox.Trigger className={filterTriggerClass}>
            <Combobox.Value>
              {(value: FilterTag[]) => (
                <span className="truncate">
                  {value.length > 0
                    ? `${value.length} ${value.length === 1 ? "tag" : "tags"} selected`
                    : "Every tag"}
                </span>
              )}
            </Combobox.Value>
            <Combobox.Icon className="grid shrink-0 place-items-center text-muted-foreground">
              <ChevronsUpDown className="size-4" aria-hidden="true" />
            </Combobox.Icon>
          </Combobox.Trigger>
        </div>

        <Combobox.Portal>
          <Combobox.Positioner
            align="start"
            className="z-50 w-[min(22rem,calc(100vw-2rem))] min-w-[min(var(--anchor-width),calc(100vw-2rem))] outline-none"
            sideOffset={6}
          >
            <Combobox.Popup
              className="flex max-h-[min(24rem,var(--available-height))] w-full min-w-0 flex-col overflow-hidden rounded-card border border-border-strong bg-surface-elevated text-foreground shadow-overlay"
              aria-label="Choose tag filters"
            >
              <div className="m-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-control border border-border bg-surface px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20">
                <Search
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Combobox.Input
                  className="min-h-11 min-w-0 border-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                  aria-label="Search tags"
                  placeholder="Search tags…"
                />
                {activeQuery.isFetching ? (
                  <LoaderCircle
                    className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
                    aria-label="Loading tags"
                  />
                ) : null}
              </div>

              {activeQuery.isError ? (
                <div
                  className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 text-sm leading-relaxed text-muted-foreground"
                  role="status"
                >
                  <span>Tags are unavailable.</span>
                  <button
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-control px-3 font-medium text-foreground hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    type="button"
                    onClick={() => activeQuery.refetch()}
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  <Combobox.Empty
                    className={
                      visibleOptions.length === 0
                        ? "flex min-h-12 items-center px-3 py-2 text-sm leading-relaxed text-muted-foreground"
                        : "sr-only"
                    }
                  >
                    {activeQuery.isPending
                      ? "Looking through tags…"
                      : debouncedInput
                        ? `No tags start with “${debouncedInput}”.`
                        : "No tags have been used yet."}
                  </Combobox.Empty>
                  <Combobox.List className="w-full max-h-[min(19rem,calc(var(--available-height)-4rem))] overflow-y-auto p-1 outline-none">
                    {(tag: FilterTag) => (
                      <Combobox.Item
                        key={tag.id}
                        value={tag}
                        className={filterOptionClass}
                      >
                        <Combobox.ItemIndicator
                          keepMounted
                          className={filterIndicatorClass}
                        >
                          <Check aria-hidden="true" />
                        </Combobox.ItemIndicator>
                        <span className="min-w-0 break-words leading-5">
                          {tag.name}
                        </span>
                        {tag.ideaCount === undefined ? null : (
                          <span className="font-mono text-xs text-muted-foreground">
                            {tag.ideaCount}
                          </span>
                        )}
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </>
              )}
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>

        {selectedTags.length > 0 ? (
          <div
            className="flex min-w-0 flex-wrap items-center gap-1.5 sm:col-span-2 sm:col-start-1 sm:row-start-3 lg:col-span-3 lg:row-start-2"
            aria-label="Selected tag filters"
          >
            <span className="mr-0.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Matching all
            </span>
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex min-h-8 max-w-full items-center gap-1 rounded-full border border-border bg-surface-muted pl-3 font-mono text-xs text-foreground"
              >
                <span className="max-w-56 truncate">{tag.name}</span>
                <button
                  className="grid min-h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring"
                  type="button"
                  aria-label={`Remove ${tag.name} filter`}
                  onClick={() => {
                    const nextTagIds = tagIds.filter((id) => id !== tag.id);
                    onChange(nextTagIds.length > 0 ? nextTagIds : undefined);
                  }}
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </Combobox.Root>
  );
}

export function IdeaFilters({
  ideaTags,
  onClear,
  onSortChange,
  onStatusChange,
  onTagsChange,
  status,
  sort,
  tagIds = [],
}: IdeaFiltersProps) {
  const isFiltered = Boolean(status || tagIds.length > 0);

  return (
    <div className="mt-6">
      <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 sm:items-start lg:grid-cols-[minmax(0,14rem)_minmax(0,18rem)_minmax(0,1fr)]">
        <StatusSelect
          allowAll
          className={`${filterFieldClass} sm:col-start-1 sm:row-start-1`}
          label="Status"
          labelClassName={filterLabelClass}
          value={status}
          onValueChange={onStatusChange}
        />
        <TagFilter
          ideaTags={ideaTags}
          tagIds={tagIds}
          onChange={onTagsChange}
        />
        <SortSelect
          className={`${filterFieldClass} sm:col-start-1 sm:row-start-2 lg:col-start-3 lg:row-start-1 lg:w-56 lg:justify-self-end`}
          labelClassName={filterLabelClass}
          value={sort}
          onValueChange={onSortChange}
        />
        {isFiltered ? (
          <button
            type="button"
            onClick={onClear}
            className="min-h-11 w-fit rounded-control px-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:col-start-2 sm:row-start-2 sm:justify-self-end lg:col-start-3 lg:row-start-2 lg:mt-0 lg:justify-self-end"
          >
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
