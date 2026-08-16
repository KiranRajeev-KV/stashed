import { useEffect, useState, type FormEvent } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { Search, X } from "lucide-react";

import { searchInfiniteQueryOptions } from "../../api/search.js";
import { SearchResultCard } from "./search-result-card.js";
import {
  SearchErrorState,
  SearchNoResultsState,
  SearchPromptState,
  SearchResultsSkeleton,
} from "./search-states.js";

const routeApi = getRouteApi("/_authenticated/search");
const SEARCH_DEBOUNCE_MS = 300;

export function SearchPage() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const query = search.q ?? "";
  const [draft, setDraft] = useState(query);
  const searchQuery = useInfiniteQuery(searchInfiniteQueryOptions(query));
  const results = searchQuery.data?.pages.flatMap((page) => page.results) ?? [];

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    const nextQuery = draft.trim();
    if (nextQuery === query) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void navigate({
        search: { q: nextQuery || undefined },
        replace: true,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [draft, navigate, query]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = draft.trim();
    void navigate({
      search: { q: nextQuery || undefined },
      replace: true,
    });
  };

  const clearSearch = () => {
    setDraft("");
    void navigate({ search: {}, replace: true });
  };

  return (
    <section>
      <header className="search-page-header">
        <div>
          <p className="font-mono text-label uppercase text-accent">
            Search the archive
          </p>
          <h1 className="mt-3 text-page-title font-semibold">Search</h1>
          <p className="mt-4 max-w-2xl text-prose text-muted-foreground">
            Search titles and content from across the group, then open the full
            idea behind a matching fragment.
          </p>
        </div>

        <p className="search-page-annotation" aria-hidden="true">
          <span>Search tip</span>
          Type the beginning of a word. Separate terms to narrow the result.
        </p>
      </header>

      <form
        className="search-field-shell"
        role="search"
        onSubmit={submitSearch}
      >
        <label htmlFor="idea-search" className="sr-only">
          Search ideas
        </label>
        <Search aria-hidden="true" className="search-field-icon" />
        <input
          id="idea-search"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={200}
          autoComplete="off"
          placeholder="Try ‘distributed queue’ or ‘local-first’"
          className="search-field-input"
        />
        {draft ? (
          <button
            type="button"
            onClick={clearSearch}
            className="search-field-clear"
            aria-label="Clear search"
          >
            <X aria-hidden="true" />
          </button>
        ) : null}
        <button type="submit" className="search-field-submit">
          Search
        </button>
      </form>

      <div className="mt-8" aria-busy={searchQuery.isPending && Boolean(query)}>
        {!query ? <SearchPromptState /> : null}

        {query && searchQuery.isPending ? <SearchResultsSkeleton /> : null}

        {query && searchQuery.isError && results.length === 0 ? (
          <SearchErrorState
            message={searchQuery.error.message}
            onRetry={() => searchQuery.refetch()}
          />
        ) : null}

        {query && searchQuery.isSuccess && results.length === 0 ? (
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
                {searchQuery.hasNextPage ? " found so far" : " found"}
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                Best match first
              </p>
            </div>

            <div className="grid gap-4">
              {results.map((result) => (
                <SearchResultCard key={result.id} result={result} />
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-7">
              {searchQuery.hasNextPage ? (
                <button
                  type="button"
                  onClick={() => searchQuery.fetchNextPage()}
                  disabled={searchQuery.isFetchingNextPage}
                  className="min-h-11 rounded-control border border-border-strong bg-surface px-6 font-medium transition-colors duration-(--duration-fast) hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
                >
                  {searchQuery.isFetchingNextPage
                    ? "Searching further…"
                    : "Load more matches"}
                </button>
              ) : (
                <p className="font-mono text-xs text-muted-foreground">
                  — End of matches —
                </p>
              )}

              {searchQuery.isFetchNextPageError ? (
                <div className="text-center" role="alert">
                  <p className="text-sm text-danger">
                    More matches could not be loaded.
                  </p>
                  <button
                    type="button"
                    onClick={() => searchQuery.fetchNextPage()}
                    className="mt-2 min-h-10 px-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Try loading more again
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
