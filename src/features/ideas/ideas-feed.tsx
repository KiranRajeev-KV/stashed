import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";

import { currentUserQueryOptions, githubLoginPath } from "../../api/auth.js";
import { ideasInfiniteQueryOptions, type IdeaStatus } from "../../api/ideas.js";
import { IdeaCard } from "./idea-card.js";
import { IdeaFilters } from "./idea-filters.js";
import {
  IdeasEmptyState,
  IdeasErrorState,
  IdeasFeedSkeleton,
} from "./ideas-feed-states.js";

const routeApi = getRouteApi("/ideas/");

export function IdeasFeed() {
  const currentUserQuery = useQuery(currentUserQueryOptions());
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const filters = {
    status: search.status,
    tagIds: search.tag,
  };
  const ideasQuery = useInfiniteQuery(ideasInfiniteQueryOptions(filters));
  const ideas = ideasQuery.data?.pages.flatMap((page) => page.ideas) ?? [];
  const isFiltered = Boolean(search.status || search.tag?.length);
  const ideaTags = [
    ...new Map(
      ideas.flatMap((idea) => idea.tags).map((tag) => [tag.id, tag]),
    ).values(),
  ];

  const updateFilters = (next: { status?: IdeaStatus; tag?: string[] }) =>
    navigate({
      search: {
        status: next.status,
        tag: next.tag,
      },
      replace: true,
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
        status={search.status}
        tagIds={search.tag}
        onStatusChange={(status) => updateFilters({ status, tag: search.tag })}
        onTagsChange={(tag) => updateFilters({ status: search.status, tag })}
        onClear={() => updateFilters({})}
      />

      <div className="mt-7" aria-busy={ideasQuery.isPending}>
        {ideasQuery.isPending ? <IdeasFeedSkeleton /> : null}

        {ideasQuery.isError && ideas.length === 0 ? (
          <IdeasErrorState
            message={ideasQuery.error.message}
            onRetry={() => ideasQuery.refetch()}
          />
        ) : null}

        {ideasQuery.isSuccess && ideas.length === 0 ? (
          <IdeasEmptyState
            filtered={isFiltered}
            onClearFilters={() => updateFilters({})}
          />
        ) : null}

        {ideas.length > 0 ? (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {ideas.map((idea) => (
                <IdeaCard key={idea.id} idea={idea} />
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-7">
              {ideasQuery.hasNextPage ? (
                <button
                  type="button"
                  onClick={() => ideasQuery.fetchNextPage()}
                  disabled={ideasQuery.isFetchingNextPage}
                  className="min-h-11 rounded-control border border-border-strong bg-surface px-6 font-medium transition-colors duration-(--duration-fast) hover:bg-surface-muted disabled:cursor-wait disabled:opacity-60"
                >
                  {ideasQuery.isFetchingNextPage
                    ? "Loading more ideas…"
                    : "Load more"}
                </button>
              ) : (
                <p className="font-mono text-xs text-muted-foreground">
                  — End of results —
                </p>
              )}

              {ideasQuery.isFetchNextPageError ? (
                <div className="text-center" role="alert">
                  <p className="text-sm text-danger">
                    More ideas could not be loaded.
                  </p>
                  <button
                    type="button"
                    onClick={() => ideasQuery.fetchNextPage()}
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
