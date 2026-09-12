import { buttonStyles } from "../../components/ui/button-variants.js";
import { twArchiveFilters } from "../../styles/archive-styles.js";
import {
  twUiDialogBackdrop,
  twUiDialogSheet,
} from "../../styles/dialogs-styles.js";
import {
  twUiSelectSheet,
  twUiSelectTrigger,
} from "../../styles/selects-styles.js";
import { Combobox } from "../../components/ui/select.js";
import { Drawer } from "@base-ui/react/drawer";
import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown as ChevronsUpDown,
  ListFilter,
  LoaderCircle,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import * as React from "react";

import { tagsQueryOptions, type Tag } from "../../api/tags.js";
import type { IdeaSort, IdeaStatus } from "../../api/ideas.js";
import type { SearchIdeaSort } from "../../api/search.js";
import type { IdeaVisibility } from "./idea-visibility.js";
import { IDEA_STATUS_LABELS } from "./idea-status.js";
import { MobileSortDrawer } from "./mobile-sort-drawer.js";
import { StatusSelect } from "./status-select.js";
import { SortSelect } from "./sort-select.js";
import { VisibilityIcon } from "./visibility-icon.js";
import { VisibilitySelect } from "./visibility-select.js";

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
  isSignedIn: boolean;
  ideaTags: FilterTag[];
  onFiltersChange: (filters: IdeaFilterValues) => void;
  onQueryChange: (query?: string) => void;
  onSortChange: (sort?: IdeaSort | SearchIdeaSort) => void;
  status?: IdeaStatus;
  sort?: IdeaSort | SearchIdeaSort;
  tagIds?: string[];
  query?: string;
  visibility?: IdeaVisibility;
};

export type IdeaFilterValues = {
  status?: IdeaStatus;
  tagIds?: string[];
  visibility?: IdeaVisibility;
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
  className = filterFieldClass,
  ideaTags,
  onChange,
  tagIds = [],
}: {
  className?: string;
  ideaTags: FilterTag[];
  onChange: (tagIds?: string[]) => void;
  tagIds?: string[];
}) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const debouncedInput = useDebouncedValue(inputValue.trim(), 220);
  const discoveryQuery = useQuery({
    ...tagsQueryOptions(tagDiscoveryQuery),
    enabled: open,
  });
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
        <div className={className}>
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
            className="z-[70] w-[min(22rem,calc(100vw-2rem))] min-w-[min(var(--anchor-width),calc(100vw-2rem))] outline-none"
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
      </div>
    </Combobox.Root>
  );
}

const visibilityFilterLabels: Record<IdeaVisibility, string> = {
  PUBLIC: "Public",
  UNLISTED: "My unlisted",
  PRIVATE: "My private",
};

function activeFilterCount(filters: IdeaFilterValues) {
  return (
    Number(Boolean(filters.status)) +
    Number(Boolean(filters.visibility)) +
    (filters.tagIds?.length ?? 0)
  );
}

function MobileFilterDrawer({
  filters,
  ideaTags,
  isSignedIn,
  onApply,
}: {
  filters: IdeaFilterValues;
  ideaTags: FilterTag[];
  isSignedIn: boolean;
  onApply: (filters: IdeaFilterValues) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(filters);
  const count = activeFilterCount(filters);

  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft({
        status: filters.status,
        tagIds: filters.tagIds,
        visibility: filters.visibility,
      });
    }
    setOpen(nextOpen);
  }

  function applyFilters() {
    onApply(draft);
    setOpen(false);
  }

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange}>
      <Drawer.Trigger
        className={`${twUiSelectTrigger} flex min-h-14 min-w-0 items-center gap-3 rounded-control border border-border-strong bg-surface px-3 text-left text-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`}
      >
        <ListFilter className="size-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium leading-5">Filters</span>
          <span className="block truncate text-xs leading-4 text-muted-foreground">
            {count > 0
              ? `${count} ${count === 1 ? "filter" : "filters"} active`
              : "All ideas"}
          </span>
        </span>
        {count > 0 ? (
          <span className="grid min-h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 font-mono text-micro text-primary-foreground">
            {count}
          </span>
        ) : null}
      </Drawer.Trigger>

      <Drawer.VirtualKeyboardProvider>
        <Drawer.Portal>
          <Drawer.Backdrop
            className={`${twUiDialogBackdrop} fixed inset-0 z-50 bg-foreground/35 opacity-100 backdrop-blur-[2px] transition-opacity duration-(--duration-standard) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none`}
          />
          <Drawer.Viewport className="fixed inset-0 z-50 flex items-end justify-center">
            <Drawer.Popup
              className={`${twUiDialogSheet} ${twUiSelectSheet} flex max-h-[min(88dvh,52rem)] w-full translate-y-[var(--drawer-swipe-movement-y)] flex-col overflow-hidden rounded-t-[1rem] border border-b-0 border-border-strong bg-surface-elevated text-foreground shadow-overlay transition-transform duration-(--duration-slow) ease-emphasized data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full data-[swiping]:select-none motion-reduce:transition-none sm:max-w-xl`}
            >
              <div className="grid shrink-0 gap-4 border-b border-border px-4 pb-4 pt-2 sm:px-6">
                <div
                  className="mx-auto h-1 w-11 rounded-full bg-border-strong"
                  aria-hidden="true"
                />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Drawer.Title className="text-xl font-semibold tracking-tight">
                      Filter ideas
                    </Drawer.Title>
                    <Drawer.Description className="mt-1 text-sm text-muted-foreground">
                      Narrow the archive using one or more filters.
                    </Drawer.Description>
                  </div>
                  <Drawer.Close
                    className="grid size-11 shrink-0 place-items-center rounded-control text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    aria-label="Close filters"
                  >
                    <X className="size-5" aria-hidden="true" />
                  </Drawer.Close>
                </div>
              </div>

              <Drawer.Content className="min-h-0 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">
                <div className="grid gap-5" data-base-ui-swipe-ignore>
                  <StatusSelect
                    allowAll
                    className={filterFieldClass}
                    label="Status"
                    labelClassName={filterLabelClass}
                    value={draft.status}
                    onValueChange={(status) =>
                      setDraft((current) => ({ ...current, status }))
                    }
                  />
                  {isSignedIn ? (
                    <VisibilitySelect
                      allowAll
                      className={filterFieldClass}
                      label="Visibility"
                      labelClassName={filterLabelClass}
                      onValueChange={(visibility) =>
                        setDraft((current) => ({ ...current, visibility }))
                      }
                      optionLabels={visibilityFilterLabels}
                      size="filter"
                      value={draft.visibility}
                      valueLabels={visibilityFilterLabels}
                    />
                  ) : null}
                  <TagFilter
                    ideaTags={ideaTags}
                    tagIds={draft.tagIds}
                    onChange={(tagIds) =>
                      setDraft((current) => ({ ...current, tagIds }))
                    }
                  />
                </div>
              </Drawer.Content>

              <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)] gap-3 border-t border-border bg-surface px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-6">
                <button
                  type="button"
                  className={buttonStyles({ variant: "ghost" })}
                  onClick={() => setDraft({})}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className={buttonStyles({ variant: "primary" })}
                  onClick={applyFilters}
                >
                  View results
                </button>
              </div>
            </Drawer.Popup>
          </Drawer.Viewport>
        </Drawer.Portal>
      </Drawer.VirtualKeyboardProvider>
    </Drawer.Root>
  );
}

function AppliedFilters({
  filters,
  ideaTags,
  onChange,
}: {
  filters: IdeaFilterValues;
  ideaTags: FilterTag[];
  onChange: (filters: IdeaFilterValues) => void;
}) {
  if (activeFilterCount(filters) === 0) return null;

  const tagsById = new Map(ideaTags.map((tag) => [tag.id, tag]));
  const chipClass =
    "inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border border-border bg-surface-muted pl-3 pr-1 font-mono text-xs text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div
      className="mt-4 flex min-w-0 flex-wrap items-center gap-2"
      aria-label="Applied filters"
      role="group"
    >
      <span className="mr-0.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        Matching all
      </span>
      {filters.status ? (
        <button
          type="button"
          className={chipClass}
          onClick={() => onChange({ ...filters, status: undefined })}
          aria-label={`Remove ${IDEA_STATUS_LABELS[filters.status]} status filter`}
        >
          <span>{IDEA_STATUS_LABELS[filters.status]}</span>
          <X className="size-5 rounded-full p-1" aria-hidden="true" />
        </button>
      ) : null}
      {filters.visibility ? (
        <button
          type="button"
          className={chipClass}
          onClick={() => onChange({ ...filters, visibility: undefined })}
          aria-label={`Remove ${visibilityFilterLabels[filters.visibility]} visibility filter`}
        >
          <VisibilityIcon
            visibility={filters.visibility}
            className="size-3.5 shrink-0 text-muted-foreground"
          />
          <span>{visibilityFilterLabels[filters.visibility]}</span>
          <X className="size-5 rounded-full p-1" aria-hidden="true" />
        </button>
      ) : null}
      {filters.tagIds?.map((tagId) => {
        const label = tagsById.get(tagId)?.name ?? `Tag ${tagId.slice(0, 8)}`;
        return (
          <button
            type="button"
            key={tagId}
            className={chipClass}
            onClick={() => {
              const tagIds = filters.tagIds?.filter((id) => id !== tagId);
              onChange({
                ...filters,
                tagIds: tagIds?.length ? tagIds : undefined,
              });
            }}
            aria-label={`Remove ${label} tag filter`}
          >
            <span className="min-w-0 max-w-56 wrap-anywhere text-left">
              {label}
            </span>
            <X className="size-5 rounded-full p-1" aria-hidden="true" />
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onChange({})}
        className="min-h-8 rounded-control px-2 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors duration-(--duration-fast) hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Clear filters
      </button>
    </div>
  );
}

export function IdeaFilters({
  ideaTags,
  isSignedIn,
  onFiltersChange,
  onQueryChange,
  onSortChange,
  status,
  sort,
  tagIds = [],
  query,
  visibility,
}: IdeaFiltersProps) {
  const [draftQuery, setDraftQuery] = React.useState(query ?? "");
  const selectedTagsQuery = useQuery({
    ...tagsQueryOptions(tagDiscoveryQuery),
    enabled: tagIds.length > 0,
  });
  const knownTags = uniqueTags([
    ...(selectedTagsQuery.data?.tags ?? []),
    ...ideaTags,
  ]);
  const filters = { status, tagIds, visibility } satisfies IdeaFilterValues;

  React.useEffect(() => {
    setDraftQuery(query ?? "");
  }, [query]);

  React.useEffect(() => {
    const nextQuery = draftQuery.trim();
    if (nextQuery === (query ?? "")) return;

    const timeout = window.setTimeout(
      () => onQueryChange(nextQuery || undefined),
      250,
    );
    return () => window.clearTimeout(timeout);
  }, [draftQuery, onQueryChange, query]);

  return (
    <div className={twArchiveFilters}>
      <div
        className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-card border border-border-strong bg-surface-elevated p-2 shadow-raised transition-[border-color,box-shadow] duration-(--duration-fast) focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
        role="search"
      >
        <label htmlFor="idea-search" className="sr-only">
          Search ideas
        </label>
        <span id="idea-search-guidance" className="sr-only">
          Results update automatically as you type.
        </span>
        <Search
          aria-hidden="true"
          className="ml-2 size-[1.15rem] text-muted-foreground"
          strokeWidth={1.8}
        />
        <input
          id="idea-search"
          type="search"
          value={draftQuery}
          onChange={(event) => setDraftQuery(event.target.value)}
          maxLength={200}
          autoComplete="off"
          aria-describedby="idea-search-guidance"
          placeholder="Find that thought… search titles and content"
          className="min-h-11 min-w-0 border-0 bg-transparent text-foreground outline-none placeholder:text-muted-foreground/80 [&::-webkit-search-cancel-button]:hidden"
        />
        {draftQuery ? (
          <button
            type="button"
            onClick={() => {
              setDraftQuery("");
              onQueryChange(undefined);
            }}
            className="grid size-11 shrink-0 place-items-center rounded-control text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
        <MobileFilterDrawer
          filters={filters}
          ideaTags={knownTags}
          isSignedIn={isSignedIn}
          onApply={onFiltersChange}
        />
        <MobileSortDrawer
          value={sort}
          includeBestMatch={Boolean(query)}
          onValueChange={onSortChange}
        />
      </div>

      <div className="mt-5 hidden items-start gap-4 lg:grid lg:grid-cols-[repeat(3,minmax(0,14rem))_minmax(0,1fr)_minmax(0,14rem)]">
        <StatusSelect
          allowAll
          className={filterFieldClass}
          label="Status"
          labelClassName={filterLabelClass}
          value={status}
          onValueChange={(nextStatus) =>
            onFiltersChange({ ...filters, status: nextStatus })
          }
        />
        {isSignedIn ? (
          <VisibilitySelect
            allowAll
            className={filterFieldClass}
            label="Visibility"
            labelClassName={filterLabelClass}
            onValueChange={(nextVisibility) =>
              onFiltersChange({ ...filters, visibility: nextVisibility })
            }
            optionLabels={visibilityFilterLabels}
            size="filter"
            value={visibility}
            valueLabels={visibilityFilterLabels}
          />
        ) : null}
        <TagFilter
          className={filterFieldClass}
          ideaTags={knownTags}
          tagIds={tagIds}
          onChange={(nextTagIds) =>
            onFiltersChange({ ...filters, tagIds: nextTagIds })
          }
        />
        <div className="min-w-0 border-l border-border pl-4 lg:col-start-5">
          <SortSelect
            className={filterFieldClass}
            labelClassName={filterLabelClass}
            value={sort}
            includeBestMatch={Boolean(query)}
            onValueChange={onSortChange}
          />
        </div>
      </div>

      <AppliedFilters
        filters={filters}
        ideaTags={knownTags}
        onChange={onFiltersChange}
      />
    </div>
  );
}
