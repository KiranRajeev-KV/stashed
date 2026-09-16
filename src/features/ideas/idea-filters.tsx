import { ArchiveSearchField } from "../../components/ui/archive-search-field.js";
import {
  SearchActivity,
  SearchResultsTransition,
} from "../../components/ui/search-transition.js";
import { MobileChoiceDrawer } from "../../components/ui/mobile-choice-drawer.js";
import { MobileFilterDrawer } from "../../components/ui/mobile-filter-drawer.js";
import { twArchiveFilters } from "../../styles/archive-styles.js";
import { Combobox } from "../../components/ui/combobox.js";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Check,
  ChevronDown as ChevronsUpDown,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import * as React from "react";

import { tagsQueryOptions, type Tag } from "../../api/tags.js";
import type { IdeaSort, IdeaStatus } from "../../api/ideas.js";
import type { SearchIdeaSort } from "../../api/search.js";
import type { IdeaVisibility } from "./idea-visibility.js";
import {
  StatusChoiceFilter,
  StatusFilter,
  VisibilityFilter,
} from "./idea-filter-controls.js";
import { IDEA_STATUS_LABELS } from "./idea-status.js";
import { getSortLabel, getSortOptions } from "./idea-sort.js";
import { SortSelect } from "./sort-select.js";
import { VisibilityIcon } from "./visibility-icon.js";

const tagDiscoveryQuery = { limit: "100", offset: "0" } as const;
const filterFieldClass = "grid min-w-0 gap-2";
const filterLabelClass =
  "font-mono text-xs uppercase tracking-wider text-muted-foreground";
const filterTriggerClass =
  "flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-control border border-border bg-surface px-3 text-left text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-[popup-open]:border-border-strong data-[popup-open]:bg-surface-elevated";
const filterOptionClass =
  "group grid min-h-9 w-full cursor-pointer grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-control px-2.5 py-1.5 text-ui text-foreground outline-none select-none data-[highlighted]:bg-surface-muted";
const filterIndicatorClass =
  "grid size-4 place-items-center rounded-[4px] border border-border-strong bg-transparent text-transparent transition-colors duration-(--duration-fast) group-data-[selected]:border-primary group-data-[selected]:bg-primary group-data-[selected]:text-primary-foreground! [&_svg]:size-3 [&_svg]:opacity-0 group-data-[selected]:[&_svg]:opacity-100 motion-reduce:transition-none";

type FilterTag = Pick<Tag, "id" | "name"> & {
  ideaCount?: number;
};

type IdeaFiltersProps = {
  isSignedIn: boolean;
  isSearching: boolean;
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
                  {value.length === 0
                    ? "All tags"
                    : value.length === 1
                      ? value[0]?.name
                      : `${value[0]?.name} +${value.length - 1}`}
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
            className="z-[70] w-[min(18rem,calc(100vw-2rem))] min-w-[min(var(--anchor-width),calc(100vw-2rem))] outline-none"
            sideOffset={6}
          >
            <Combobox.Popup
              className="flex max-h-[min(19rem,var(--available-height))] w-full min-w-0 flex-col overflow-hidden rounded-card border border-border-strong bg-surface-elevated text-foreground shadow-overlay"
              aria-label="Choose tag filters"
            >
              <div className="grid shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border px-3 transition-colors duration-(--duration-fast) focus-within:border-ring focus-within:bg-surface-muted/30 motion-reduce:transition-none">
                <Search
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <Combobox.Input
                  className="min-h-10 min-w-0 border-0 bg-transparent text-ui text-foreground outline-none placeholder:text-muted-foreground"
                  aria-label="Search tags"
                  placeholder="Filter tags…"
                />
                <SearchActivity
                  active={activeQuery.isFetching}
                  label="Loading tags"
                />
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
                <SearchResultsTransition
                  active={activeQuery.isFetching}
                  hasPreviousResults={activeQuery.data !== undefined}
                  label="Updating tags"
                >
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
                        ? `No tags match “${debouncedInput}”.`
                        : "No tags have been used yet."}
                  </Combobox.Empty>
                  <Combobox.List className="w-full max-h-[min(13.5rem,calc(var(--available-height)-5rem))] overflow-y-auto p-1 outline-none [scrollbar-gutter:stable]">
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
                </SearchResultsTransition>
              )}
              {selectedTags.length > 0 ? (
                <div className="flex min-h-10 shrink-0 items-center justify-between gap-3 border-t border-border bg-surface-muted/30 px-3">
                  <span className="font-mono text-micro uppercase tracking-wider text-muted-foreground">
                    {selectedTags.length} selected
                  </span>
                  <button
                    type="button"
                    className="min-h-8 rounded-control px-2 text-ui font-medium text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                    onClick={() => {
                      onChange(undefined);
                      setInputValue("");
                    }}
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </div>
    </Combobox.Root>
  );
}

const visibilityFilterLabels: Record<IdeaVisibility, string> = {
  PUBLIC: "Public",
  UNLISTED: "Unlisted",
  PRIVATE: "Private",
};

function activeFilterCount(filters: IdeaFilterValues) {
  return (
    Number(Boolean(filters.status)) +
    Number(Boolean(filters.visibility)) +
    (filters.tagIds?.length ?? 0)
  );
}

function IdeaMobileFilterDrawer({
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
  const [draft, setDraft] = React.useState(filters);
  const count = activeFilterCount(filters);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setDraft({
        status: filters.status,
        tagIds: filters.tagIds,
        visibility: filters.visibility,
      });
    }
  }

  function applyFilters() {
    onApply(draft);
  }

  return (
    <MobileFilterDrawer
      activeCount={count}
      closeLabel="Close filters"
      description="Narrow the archive using one or more filters."
      title="Filter ideas"
      triggerSummary={
        count > 0
          ? `${count} ${count === 1 ? "filter" : "filters"} active`
          : "All ideas"
      }
      onOpenChange={handleOpenChange}
      onClear={() => setDraft({})}
      onApply={applyFilters}
    >
      <StatusChoiceFilter
        className={filterFieldClass}
        label="Status"
        labelClassName={filterLabelClass}
        value={draft.status}
        onValueChange={(status) =>
          setDraft((current) => ({ ...current, status }))
        }
      />
      {isSignedIn ? (
        <VisibilityFilter
          className={filterFieldClass}
          label="Visibility"
          labelClassName={filterLabelClass}
          onValueChange={(visibility) =>
            setDraft((current) => ({ ...current, visibility }))
          }
          value={draft.visibility}
        />
      ) : null}
      <TagFilter
        ideaTags={ideaTags}
        tagIds={draft.tagIds}
        onChange={(tagIds) => setDraft((current) => ({ ...current, tagIds }))}
      />
    </MobileFilterDrawer>
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
  isSearching,
  onFiltersChange,
  onQueryChange,
  onSortChange,
  status,
  sort,
  tagIds = [],
  query,
  visibility,
}: IdeaFiltersProps) {
  const selectedTagsQuery = useQuery({
    ...tagsQueryOptions(tagDiscoveryQuery),
    enabled: tagIds.length > 0,
  });
  const knownTags = uniqueTags([
    ...(selectedTagsQuery.data?.tags ?? []),
    ...ideaTags,
  ]);
  const filters = { status, tagIds, visibility } satisfies IdeaFilterValues;
  const mobileSortValue = sort ?? "UPDATED_DESC";
  const mobileSortOptions = getSortOptions();

  return (
    <div className={twArchiveFilters}>
      <ArchiveSearchField
        id="idea-search"
        label="Search ideas"
        value={query}
        isSearching={isSearching}
        onValueChange={onQueryChange}
        placeholder="Search ideas…"
        description="Searches idea titles and content. Results update automatically as you type."
      />

      <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
        <IdeaMobileFilterDrawer
          filters={filters}
          ideaTags={knownTags}
          isSignedIn={isSignedIn}
          onApply={onFiltersChange}
        />
        <MobileChoiceDrawer
          closeLabel="Close sorting options"
          description="Choose how ideas are ordered."
          options={mobileSortOptions}
          selectedLabel={getSortLabel(mobileSortValue) ?? "Recently updated"}
          title="Sort ideas"
          triggerIcon={<ArrowUpDown className="size-4" />}
          triggerLabel="Sort"
          value={mobileSortValue}
          onValueChange={(nextValue) =>
            onSortChange(nextValue === "UPDATED_DESC" ? undefined : nextValue)
          }
        />
      </div>

      <div className="mt-5 hidden items-start gap-4 lg:grid lg:grid-cols-[minmax(0,12rem)_minmax(0,22rem)_minmax(0,14rem)_minmax(0,1fr)_minmax(0,14rem)]">
        <StatusFilter
          className={filterFieldClass}
          label="Status"
          labelClassName={filterLabelClass}
          value={status}
          onValueChange={(nextStatus) =>
            onFiltersChange({ ...filters, status: nextStatus })
          }
        />
        {isSignedIn ? (
          <VisibilityFilter
            className={filterFieldClass}
            label="Visibility"
            labelClassName={filterLabelClass}
            onValueChange={(nextVisibility) =>
              onFiltersChange({ ...filters, visibility: nextVisibility })
            }
            value={visibility}
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
            options={mobileSortOptions}
            value={sort}
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
