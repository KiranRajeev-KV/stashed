import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
  ArrowUpDown,
  ArrowUpRight,
  FolderSearch,
  LayoutPanelTop,
  RotateCcw,
} from "lucide-react";

import { currentUserQueryOptions, githubLoginPath } from "../../api/auth.js";
import { collectionsInfiniteQueryOptions } from "../../api/collections.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { ArchiveSearchField } from "../../components/ui/archive-search-field.js";
import { SearchResultsTransition } from "../../components/ui/search-transition.js";
import {
  archiveSortOptions,
  type ArchiveSort,
} from "../../components/ui/archive-sort-options.js";
import {
  MobileChoiceDrawer,
  type MobileChoice,
} from "../../components/ui/mobile-choice-drawer.js";
import { buttonStyles } from "../../components/ui/button-variants.js";
import { Button } from "../../components/ui/button.js";
import { Select } from "../../components/ui/select.js";
import {
  twArchiveFeed,
  twArchiveFilters,
  twArchiveIntro,
  twArchiveIntroDescription,
  twArchivePagination,
  twArchiveResultsLabel,
  twIdeaEmptyState,
} from "../../styles/archive-styles.js";
import {
  twCollectionCard,
  twCollectionCardBody,
  twCollectionGrid,
} from "../../styles/collection-styles.js";
import { twAnimatePulse } from "../../styles/common-styles.js";
import { twViewTab } from "../../styles/navigation-styles.js";
import { CollectionCard } from "./collection-card.js";

const routeApi = getRouteApi("/collections/");
const labelClass =
  "font-mono text-xs uppercase tracking-wider text-muted-foreground";
type CollectionScope = "DISCOVER" | "OWNED" | "COLLABORATING";
const collectionScopeOptions: ReadonlyArray<MobileChoice<CollectionScope>> = [
  { value: "DISCOVER", label: "Discover" },
  { value: "OWNED", label: "Owned by me" },
  { value: "COLLABORATING", label: "Shared with me" },
];

function collectionScopeLabel(scope: CollectionScope) {
  return collectionScopeOptions.find((option) => option.value === scope)?.label;
}

export function CollectionsPage() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const session = useQuery(currentUserQueryOptions());
  const scope = search.scope ?? "DISCOVER";
  const collections = useInfiniteQuery(
    collectionsInfiniteQueryOptions({
      scope,
      q: search.q,
      sort: search.sort,
    }),
  );
  const rows =
    collections.data?.pages.flatMap((page) => page.collections) ?? [];
  const isFiltered = Boolean(
    search.q ||
    scope !== "DISCOVER" ||
    (search.sort && search.sort !== "UPDATED_DESC"),
  );

  function updateSearch(
    next: Partial<{
      q: string;
      scope: CollectionScope;
      sort: ArchiveSort;
    }>,
  ) {
    return navigate({
      replace: true,
      search: (current) => ({ ...current, ...next }),
    });
  }

  const clearFilters = () =>
    navigate({ replace: true, search: { scope: "DISCOVER" } });

  return (
    <section className={twArchiveFeed}>
      <header className={twArchiveIntro}>
        <div>
          <h1>
            Collections<span className="text-accent">.</span>
          </h1>
          <p className={twArchiveIntroDescription}>
            Related ideas, gathered without changing who can see them.
          </p>
        </div>
        {session.data ? (
          <Link
            to="/collections/new"
            className={buttonStyles({ variant: "primary" })}
          >
            Create a collection <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        ) : (
          <a
            href={githubLoginPath}
            className={buttonStyles({ variant: "primary" })}
          >
            Sign in to curate <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        )}
      </header>

      <div className={twArchiveFilters}>
        <div className="flex min-w-0 flex-col gap-4">
          <ArchiveSearchField
            id="collection-search"
            label="Search collections"
            value={search.q}
            isSearching={
              collections.isFetching && !collections.isFetchingNextPage
            }
            onValueChange={(q) => updateSearch({ q })}
            placeholder="Search collections…"
            description="Searches collection names and descriptions. Results update automatically as you type."
          />
          <div className="grid grid-cols-2 gap-3 lg:hidden">
            <MobileChoiceDrawer
              closeLabel="Close collection views"
              description="Choose which collections are shown."
              options={collectionScopeOptions.map((option) => ({
                ...option,
                disabled: !session.data && option.value !== "DISCOVER",
              }))}
              selectedLabel={collectionScopeLabel(scope) ?? "Discover"}
              title="View collections"
              triggerIcon={<LayoutPanelTop className="size-4" />}
              triggerLabel="View"
              value={scope}
              onValueChange={(nextScope) => updateSearch({ scope: nextScope })}
            />
            <MobileChoiceDrawer
              closeLabel="Close sorting options"
              description="Choose how collections are ordered."
              options={archiveSortOptions}
              selectedLabel={
                archiveSortOptions.find(
                  (option) => option.value === (search.sort ?? "UPDATED_DESC"),
                )?.label ?? "Recently updated"
              }
              title="Sort collections"
              triggerIcon={<ArrowUpDown className="size-4" />}
              triggerLabel="Sort"
              value={(search.sort ?? "UPDATED_DESC") as ArchiveSort}
              onValueChange={(sort) =>
                updateSearch({
                  sort: sort === "UPDATED_DESC" ? undefined : sort,
                })
              }
            />
          </div>
          <div className="hidden min-w-0 flex-wrap items-end justify-between gap-4 border-t border-border-subtle pt-4 lg:flex">
            <div className="grid min-w-0 gap-2">
              <span className={labelClass}>View</span>
              <div
                className="flex min-w-0 flex-wrap gap-1"
                role="tablist"
                aria-label="Collection view"
              >
                {collectionScopeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={scope === option.value}
                    disabled={!session.data && option.value !== "DISCOVER"}
                    onClick={() => updateSearch({ scope: option.value })}
                    className={twViewTab}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex min-w-0 flex-wrap items-end gap-2">
              {isFiltered ? (
                <Button variant="ghost" onClick={clearFilters}>
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Reset view
                </Button>
              ) : null}
              <Select
                className="grid min-w-48 gap-2"
                label="Sort by"
                labelClassName={labelClass}
                options={archiveSortOptions}
                positionerProps={{ align: "end" }}
                value={(search.sort ?? "UPDATED_DESC") as ArchiveSort}
                variant="filter"
                onValueChange={(sort) =>
                  updateSearch({
                    sort: sort === "UPDATED_DESC" ? undefined : sort,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <SearchResultsTransition
        active={collections.isFetching && !collections.isFetchingNextPage}
        hasPreviousResults={collections.data !== undefined}
        label="Updating collections"
        className="mt-7"
      >
        {collections.isPending ? <CollectionsSkeleton /> : null}
        {collections.isError && rows.length === 0 ? (
          <CollectionsError
            message={collections.error.message}
            onRetry={() => collections.refetch()}
          />
        ) : null}
        {collections.isSuccess && rows.length === 0 ? (
          <CollectionsEmpty
            hasQuery={Boolean(search.q)}
            scope={scope}
            signedIn={Boolean(session.data)}
            onClear={clearFilters}
          />
        ) : null}
        {rows.length > 0 ? (
          <>
            <div className={twArchiveResultsLabel} role="status">
              <span>
                {rows.length} {rows.length === 1 ? "collection" : "collections"}
                {collections.hasNextPage ? " loaded" : " to explore"}
              </span>
            </div>
            <div className={twCollectionGrid}>
              {rows.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))}
            </div>
            <CollectionPagination
              hasNextPage={collections.hasNextPage}
              isFetching={collections.isFetchingNextPage}
              isError={collections.isFetchNextPageError}
              onLoad={() => collections.fetchNextPage()}
            />
          </>
        ) : null}
      </SearchResultsTransition>
    </section>
  );
}

function CollectionsSkeleton() {
  return (
    <div className={twCollectionGrid} aria-hidden="true">
      {[0, 1, 2, 3].map((item) => (
        <article key={item} className={`${twCollectionCard} ${twAnimatePulse}`}>
          <div className={twCollectionCardBody}>
            <div className="flex gap-3.5">
              <div className="size-10 shrink-0 rounded-control bg-surface-muted" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-6 w-3/4 rounded-control bg-surface-muted" />
                <div className="h-3 w-2/5 rounded-full bg-surface-muted" />
              </div>
            </div>
            <div className="mt-5 h-3 w-full rounded-full bg-surface-muted" />
            <div className="mt-2 h-3 w-4/5 rounded-full bg-surface-muted" />
            <div className="mt-auto h-7 w-1/3 rounded-full bg-surface-muted" />
          </div>
        </article>
      ))}
    </div>
  );
}

function CollectionsError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <section
      className="rounded-card border border-danger/35 bg-danger/5 p-7"
      role="alert"
    >
      <p className="font-mono text-label uppercase text-danger">
        Archive unavailable
      </p>
      <h2 className="mt-2 font-display text-3xl font-normal">
        The collections could not be opened.
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      <Button variant="primary" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </section>
  );
}

function CollectionsEmpty({
  hasQuery,
  scope,
  signedIn,
  onClear,
}: {
  hasQuery: boolean;
  scope: "DISCOVER" | "OWNED" | "COLLABORATING";
  signedIn: boolean;
  onClear: () => void;
}) {
  const isOwned = scope === "OWNED";
  const isShared = scope === "COLLABORATING";
  const label = hasQuery
    ? "No match"
    : isOwned
      ? "No collections yet"
      : isShared
        ? "Nothing shared yet"
        : "Nothing gathered yet";
  const title = hasQuery
    ? "No collections match your search."
    : isOwned
      ? "Create your first collection."
      : isShared
        ? "No collections have been shared with you."
        : "The first shelf is waiting.";
  const description = hasQuery
    ? "Reset this view to browse collections again."
    : isOwned
      ? "Gather related Ideas while keeping their original permissions intact."
      : isShared
        ? "Collections where you are an Editor or Viewer will appear here."
        : "Bring related ideas together while their original permissions stay intact.";

  return (
    <section className={twIdeaEmptyState}>
      <FolderSearch
        className="mx-auto mb-5 box-content size-6 rounded-dialog bg-surface-muted p-4 text-primary [transform:rotate(-5deg)]"
        aria-hidden="true"
      />
      <p className="font-mono text-label uppercase text-accent">{label}</p>
      <h2 className="mt-3 font-display text-3xl font-normal tracking-tight">
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
      {hasQuery ? (
        <Button className="mt-6" onClick={onClear}>
          Reset view
        </Button>
      ) : signedIn && !isShared ? (
        <Link
          to="/collections/new"
          className={buttonStyles({ variant: "primary", className: "mt-6" })}
        >
          Create your first collection
        </Link>
      ) : null}
    </section>
  );
}

function CollectionPagination({
  hasNextPage,
  isFetching,
  isError,
  onLoad,
}: {
  hasNextPage: boolean;
  isFetching: boolean;
  isError: boolean;
  onLoad: () => void;
}) {
  return (
    <div
      className={`${twArchivePagination} mt-8 flex flex-col items-center gap-3 border-t border-border pt-7`}
    >
      {hasNextPage || isError ? (
        <Button
          loading={isFetching}
          loadingLabel="Loading more collections…"
          onClick={onLoad}
        >
          {isError ? "Try loading more again" : "Load more"}
        </Button>
      ) : (
        <p className="font-mono text-xs text-muted-foreground">
          You've reached the end. Another collection can always begin.
        </p>
      )}
      <ActionFeedback
        state={isFetching ? "pending" : isError ? "error" : "idle"}
        className="text-center"
      >
        {isFetching
          ? "Loading more collections…"
          : isError
            ? "More collections could not be loaded. Your results are still here."
            : null}
      </ActionFeedback>
    </div>
  );
}
