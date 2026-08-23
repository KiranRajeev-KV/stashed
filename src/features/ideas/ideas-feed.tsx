import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";

import { currentUserQueryOptions, githubLoginPath } from "../../api/auth.js";
import {
  ideasInfiniteQueryOptions,
  type IdeaSort,
  type IdeaStatus,
} from "../../api/ideas.js";
import {
  searchInfiniteQueryOptions,
  type SearchIdeaSort,
} from "../../api/search.js";
import { IdeaCard } from "./idea-card.js";
import { IdeaFilters } from "./idea-filters.js";
import {
  IdeasEmptyState,
  IdeasErrorState,
  IdeasFeedSkeleton,
} from "./ideas-feed-states.js";
import {
  SearchErrorState,
  SearchNoResultsState,
  SearchResultsSkeleton,
} from "./search-result-states.js";

const routeApi = getRouteApi("/ideas/");

export function IdeasFeed() {
  const currentUserQuery = useQuery(currentUserQueryOptions());
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const query = search.q ?? "";
  const browseSort = search.sort === "BEST_MATCH" ? undefined : search.sort;
  const filters = {
    status: search.status,
    sort: browseSort,
    tagIds: search.tag,
  };
  const ideasQuery = useInfiniteQuery(
    ideasInfiniteQueryOptions(filters, { enabled: !query }),
  );
  const searchQuery = useInfiniteQuery(
    searchInfiniteQueryOptions({
      q: query,
      status: search.status,
      sort: search.sort,
      tagIds: search.tag,
    }),
  );
  const ideas = ideasQuery.data?.pages.flatMap((page) => page.ideas) ?? [];
  const results = searchQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const isFiltered = Boolean(search.status || search.tag?.length);
  const ideaTags = [
    ...new Map(
      ideas.flatMap((idea) => idea.tags).map((tag) => [tag.id, tag]),
    ).values(),
  ];

  const updateFilters = (next: {
    q?: string;
    status?: IdeaStatus;
    sort?: IdeaSort | SearchIdeaSort;
    tag?: string[];
  }) =>
    navigate({
      search: {
        q: next.q,
        status: next.status,
        sort: next.sort,
        tag: next.tag,
      },
      replace: true,
    });

  const updateQuery = (nextQuery?: string) =>
    updateFilters({
      q: nextQuery,
      status: search.status,
      sort: nextQuery ? search.sort : browseSort,
      tag: search.tag,
    });

  return (
    <section>
      <header className="grid gap-6 border-b border-border pb-7 sm:pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="font-mono text-label uppercase text-accent">
            Shared archive
          </p>
          <h1 className="mt-3 text-page-title font-semibold">Ideas</h1>
          <p className="mt-4 max-w-2xl text-prose text-muted-foreground">
            Ideas saved by this group—ready to discover, revisit, and develop
            over time.
          </p>
        </div>
        {currentUserQuery.data ? (
          <Link
            to="/ideas/new"
            className="inline-flex min-h-11 w-fit items-center rounded-control bg-primary px-5 font-medium text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary/90 lg:mb-1"
          >
            New idea{" "}
            <span className="ml-2" aria-hidden="true">
              ＋
            </span>
          </Link>
        ) : (
          <a
            href={githubLoginPath}
            className="inline-flex min-h-11 w-fit items-center rounded-control bg-primary px-5 font-medium text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary/90 lg:mb-1"
          >
            Sign in to contribute
            <span className="ml-2" aria-hidden="true">
              →
            </span>
          </a>
        )}
      </header>

      <IdeaFilters
        ideaTags={ideaTags}
        query={query}
        status={search.status}
        sort={query ? search.sort : browseSort}
        tagIds={search.tag}
        onQueryChange={updateQuery}
        onStatusChange={(status) =>
          updateFilters({
            q: query || undefined,
            status,
            sort: query ? search.sort : browseSort,
            tag: search.tag,
          })
        }
        onSortChange={(sort) =>
          updateFilters({
            q: query || undefined,
            status: search.status,
            sort,
            tag: search.tag,
          })
        }
        onTagsChange={(tag) =>
          updateFilters({
            q: query || undefined,
            status: search.status,
            sort: query ? search.sort : browseSort,
            tag,
          })
        }
        onClear={() => updateFilters({})}
      />

      {query ? (
        <SearchResults
          currentUserId={currentUserQuery.data?.id}
          query={query}
          results={results}
          isPending={searchQuery.isPending}
          isError={searchQuery.isError}
          errorMessage={searchQuery.error?.message ?? ""}
          isSuccess={searchQuery.isSuccess}
          hasNextPage={searchQuery.hasNextPage}
          isFetchingNextPage={searchQuery.isFetchingNextPage}
          isFetchNextPageError={searchQuery.isFetchNextPageError}
          onRetry={() => searchQuery.refetch()}
          onFetchNextPage={() => searchQuery.fetchNextPage()}
        />
      ) : (
        <BrowseResults
          currentUserId={currentUserQuery.data?.id}
          ideas={ideas}
          filtered={isFiltered}
          isPending={ideasQuery.isPending}
          isError={ideasQuery.isError}
          errorMessage={ideasQuery.error?.message ?? ""}
          isSuccess={ideasQuery.isSuccess}
          hasNextPage={ideasQuery.hasNextPage}
          isFetchingNextPage={ideasQuery.isFetchingNextPage}
          isFetchNextPageError={ideasQuery.isFetchNextPageError}
          onRetry={() => ideasQuery.refetch()}
          onFetchNextPage={() => ideasQuery.fetchNextPage()}
          onClearFilters={() => updateFilters({})}
        />
      )}
    </section>
  );
}

function SearchResults({
  currentUserId,
  query,
  results,
  errorMessage,
  hasNextPage,
  isError,
  isFetchNextPageError,
  isFetchingNextPage,
  isPending,
  isSuccess,
  onFetchNextPage,
  onRetry,
}: {
  currentUserId?: string;
  query: string;
  results: import("../../api/search.js").SearchResult[];
  errorMessage: string;
  hasNextPage: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  isPending: boolean;
  isSuccess: boolean;
  onFetchNextPage: () => void;
  onRetry: () => void;
}) {
  return (
    <div className="mt-7" aria-busy={isPending}>
      {isPending ? <SearchResultsSkeleton /> : null}

      {isError && results.length === 0 ? (
        <SearchErrorState message={errorMessage} onRetry={onRetry} />
      ) : null}

      {isSuccess && results.length === 0 ? (
        <SearchNoResultsState query={query} />
      ) : null}

      {results.length > 0 ? (
        <>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <p
              className="font-mono text-xs text-muted-foreground"
              role="status"
            >
              {results.length} {results.length === 1 ? "match" : "matches"}
              {hasNextPage ? " found so far" : " found"}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {results.map((result) => (
              <IdeaCard
                key={result.id}
                currentUserId={currentUserId}
                idea={result}
              />
            ))}
          </div>

          <LoadMore
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            onFetchNextPage={onFetchNextPage}
            loadingLabel="Searching further…"
            loadLabel="Load more matches"
            errorMessage="More matches could not be loaded."
            retryLabel="Try searching again"
          />
        </>
      ) : null}
    </div>
  );
}

function BrowseResults({
  currentUserId,
  ideas,
  filtered,
  errorMessage,
  hasNextPage,
  isError,
  isFetchNextPageError,
  isFetchingNextPage,
  isPending,
  isSuccess,
  onFetchNextPage,
  onRetry,
  onClearFilters,
}: {
  currentUserId?: string;
  ideas: import("../../api/ideas.js").IdeaListItem[];
  filtered: boolean;
  errorMessage: string;
  hasNextPage: boolean;
  isError: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  isPending: boolean;
  isSuccess: boolean;
  onFetchNextPage: () => void;
  onRetry: () => void;
  onClearFilters: () => void;
}) {
  return (
    <div className="mt-7" aria-busy={isPending}>
      {isPending ? <IdeasFeedSkeleton /> : null}

      {isError && ideas.length === 0 ? (
        <IdeasErrorState message={errorMessage} onRetry={onRetry} />
      ) : null}

      {isSuccess && ideas.length === 0 ? (
        <IdeasEmptyState filtered={filtered} onClearFilters={onClearFilters} />
      ) : null}

      {ideas.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                currentUserId={currentUserId}
                idea={idea}
              />
            ))}
          </div>

          <LoadMore
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            onFetchNextPage={onFetchNextPage}
            loadingLabel="Loading more ideas…"
            loadLabel="Load more"
            errorMessage="More ideas could not be loaded."
            retryLabel="Try loading more again"
          />
        </>
      ) : null}
    </div>
  );
}

function LoadMore({
  errorMessage,
  hasNextPage,
  isFetchNextPageError,
  isFetchingNextPage,
  loadLabel,
  loadingLabel,
  onFetchNextPage,
  retryLabel,
}: {
  errorMessage: string;
  hasNextPage: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  loadLabel: string;
  loadingLabel: string;
  onFetchNextPage: () => void;
  retryLabel: string;
}) {
  return (
    <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-7">
      {hasNextPage ? (
        <button
          type="button"
          onClick={onFetchNextPage}
          disabled={isFetchingNextPage}
          className="min-h-11 rounded-control border border-border-strong bg-surface px-6 font-medium transition-colors duration-(--duration-fast) hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
        >
          {isFetchingNextPage ? loadingLabel : loadLabel}
        </button>
      ) : (
        <p className="font-mono text-xs text-muted-foreground">
          — End of results —
        </p>
      )}

      {isFetchNextPageError ? (
        <div className="text-center" role="alert">
          <p className="text-sm text-danger">{errorMessage}</p>
          <button
            type="button"
            onClick={onFetchNextPage}
            className="mt-2 min-h-10 px-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
