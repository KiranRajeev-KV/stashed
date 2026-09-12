import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { Button } from "../../components/ui/button.js";
import { buttonStyles } from "../../components/ui/button-variants.js";
import {
  twArchiveFeed,
  twArchiveIntro,
  twArchiveIntroDescription,
  twArchivePagination,
  twArchiveResultsLabel,
} from "../../styles/archive-styles.js";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

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
import type { SearchResult } from "../../api/search.js";
import { IdeaCard } from "./idea-card.js";
import { IdeaGrid } from "./idea-grid.js";
import { IdeaFilters, type IdeaFilterValues } from "./idea-filters.js";
import type { IdeaVisibility } from "./idea-visibility.js";
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
    visibility: search.visibility,
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
      visibility: search.visibility,
      sort: search.sort,
      tagIds: search.tag,
    }),
  );
  const ideas = ideasQuery.data?.pages.flatMap((page) => page.ideas) ?? [];
  const results = searchQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const isFiltered = Boolean(
    search.status || search.visibility || search.tag?.length,
  );
  const ideaTags = [
    ...new Map(
      ideas.flatMap((idea) => idea.tags).map((tag) => [tag.id, tag]),
    ).values(),
  ];

  const updateFilters = (next: {
    q?: string;
    status?: IdeaStatus;
    visibility?: IdeaVisibility;
    sort?: IdeaSort | SearchIdeaSort;
    tag?: string[];
  }) =>
    navigate({
      search: {
        q: next.q,
        status: next.status,
        visibility: next.visibility,
        sort: next.sort,
        tag: next.tag,
      },
      replace: true,
    });

  const updateQuery = (nextQuery?: string) =>
    updateFilters({
      q: nextQuery,
      status: search.status,
      visibility: search.visibility,
      sort: nextQuery ? search.sort : browseSort,
      tag: search.tag,
    });

  const updateFacets = (next: IdeaFilterValues) =>
    updateFilters({
      q: query || undefined,
      status: next.status,
      visibility: next.visibility,
      sort: query ? search.sort : browseSort,
      tag: next.tagIds,
    });

  return (
    <section className={twArchiveFeed}>
      <header className={twArchiveIntro}>
        <div>
          <h1>
            Ideas<span className="text-accent">.</span>
          </h1>
          <p className={twArchiveIntroDescription}>
            A place for your next good thought.
          </p>
        </div>
        {currentUserQuery.data ? (
          <Link
            to="/ideas/new"
            className={buttonStyles({ variant: "primary" })}
          >
            Stash an idea <ArrowUpRight size={17} aria-hidden="true" />
          </Link>
        ) : (
          <a
            href={githubLoginPath}
            className={buttonStyles({ variant: "primary" })}
          >
            Sign in to contribute
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        )}
      </header>

      <IdeaFilters
        ideaTags={ideaTags}
        isSignedIn={Boolean(currentUserQuery.data)}
        query={query}
        status={search.status}
        visibility={search.visibility}
        sort={query ? search.sort : browseSort}
        tagIds={search.tag}
        onQueryChange={updateQuery}
        onFiltersChange={updateFacets}
        onSortChange={(sort) =>
          updateFilters({
            q: query || undefined,
            status: search.status,
            visibility: search.visibility,
            sort,
            tag: search.tag,
          })
        }
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
          onClearFilters={() => updateFacets({})}
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
  results: SearchResult[];
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

          <IdeaGrid>
            {results.map((result) => (
              <IdeaCard
                key={result.id}
                currentUserId={currentUserId}
                idea={result}
              />
            ))}
          </IdeaGrid>

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
          <div className={twArchiveResultsLabel} role="status">
            <span>
              {ideas.length} {ideas.length === 1 ? "idea" : "ideas"}
              {hasNextPage ? " loaded" : " to explore"}
            </span>
          </div>
          <IdeaGrid>
            {ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                currentUserId={currentUserId}
                idea={idea}
              />
            ))}
          </IdeaGrid>

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
    <div
      className={`${twArchivePagination} mt-8 flex flex-col items-center gap-3 border-t border-border pt-7`}
    >
      {hasNextPage || isFetchNextPageError ? (
        <Button
          type="button"
          onClick={onFetchNextPage}
          disabled={isFetchingNextPage}
          loading={isFetchingNextPage}
          loadingLabel={loadingLabel}
          variant="secondary"
        >
          {isFetchNextPageError ? retryLabel : loadLabel}
        </Button>
      ) : (
        <p className="font-mono text-xs text-muted-foreground">
          You've reached the end. Another idea is always beginning.
        </p>
      )}

      <ActionFeedback
        state={
          isFetchingNextPage
            ? "pending"
            : isFetchNextPageError
              ? "error"
              : "idle"
        }
        className="text-center"
      >
        {isFetchingNextPage
          ? loadingLabel
          : isFetchNextPageError
            ? `${errorMessage} Your loaded results are still here. Try again.`
            : null}
      </ActionFeedback>
    </div>
  );
}
