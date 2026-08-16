import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";

import { ideasInfiniteQueryOptions, type IdeaStatus } from "../../api/ideas.js";
import { tagsQueryOptions } from "../../api/tags.js";
import { IdeaCard } from "./idea-card.js";
import {
  IdeasEmptyState,
  IdeasErrorState,
  IdeasFeedSkeleton,
} from "./ideas-feed-states.js";
import { IDEA_STATUSES, IDEA_STATUS_LABELS } from "./idea-status.js";

const routeApi = getRouteApi("/_authenticated/ideas/");
const feedTagsQuery = { limit: "100", offset: "0" } as const;

export function IdeasFeed() {
  const search = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const filters = {
    status: search.status,
    tagId: search.tag,
  };
  const ideasQuery = useInfiniteQuery(ideasInfiniteQueryOptions(filters));
  const tagsQuery = useQuery(tagsQueryOptions(feedTagsQuery));
  const ideas = ideasQuery.data?.pages.flatMap((page) => page.ideas) ?? [];
  const isFiltered = Boolean(search.status || search.tag);
  const selectedTag = search.tag
    ? (tagsQuery.data?.tags.find((tag) => tag.id === search.tag) ??
      ideas.flatMap((idea) => idea.tags).find((tag) => tag.id === search.tag))
    : undefined;
  const selectedTagIsOutsideDiscovery =
    selectedTag &&
    !tagsQuery.data?.tags.some((tag) => tag.id === selectedTag.id);

  const updateFilters = (next: { status?: IdeaStatus; tag?: string }) =>
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
            Idea index
          </p>
          <h1 className="mt-3 text-page-title font-semibold">Ideas</h1>
          <p className="mt-4 max-w-2xl text-prose text-muted-foreground">
            Saved thoughts in every stage—ready to revisit, connect, and carry
            forward.
          </p>
        </div>
        <Link
          to="/ideas/new"
          className="inline-flex min-h-11 w-fit items-center rounded-control bg-primary px-5 font-medium text-primary-foreground transition-colors duration-(--duration-fast) hover:bg-primary/90 lg:mb-1"
        >
          New idea{" "}
          <span className="ml-2" aria-hidden="true">
            ＋
          </span>
        </Link>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,14rem)_minmax(0,18rem)_auto] lg:items-end">
        <label className="grid gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            Status
          </span>
          <select
            value={search.status ?? ""}
            onChange={(event) =>
              updateFilters({
                status: (event.target.value || undefined) as
                  IdeaStatus | undefined,
                tag: search.tag,
              })
            }
            className="min-h-11 w-full rounded-control border border-border bg-surface px-3 text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong"
          >
            <option value="">Every status</option>
            {IDEA_STATUSES.map((status) => (
              <option key={status} value={status}>
                {IDEA_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-2">
          <label
            htmlFor="idea-tag-filter"
            className="font-mono text-xs uppercase tracking-wider text-muted-foreground"
          >
            Tag
          </label>
          <div className="flex gap-2">
            <select
              id="idea-tag-filter"
              value={search.tag ?? ""}
              onChange={(event) =>
                updateFilters({
                  status: search.status,
                  tag: event.target.value || undefined,
                })
              }
              disabled={tagsQuery.isPending || tagsQuery.isError}
              className="min-h-11 min-w-0 flex-1 rounded-control border border-border bg-surface px-3 text-sm text-foreground transition-colors duration-(--duration-fast) hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">
                {tagsQuery.isPending
                  ? "Loading tags…"
                  : tagsQuery.isError
                    ? "Tags unavailable"
                    : "Every tag"}
              </option>
              {selectedTagIsOutsideDiscovery ? (
                <option value={selectedTag.id}>{selectedTag.name}</option>
              ) : null}
              {tagsQuery.data?.tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name} ({tag.ideaCount})
                </option>
              ))}
            </select>
            {tagsQuery.isError ? (
              <button
                type="button"
                onClick={() => tagsQuery.refetch()}
                className="min-h-11 shrink-0 rounded-control border border-border-strong px-3 text-sm font-medium hover:bg-surface-muted"
              >
                Retry
              </button>
            ) : null}
          </div>
        </div>

        {isFiltered ? (
          <button
            type="button"
            onClick={() => updateFilters({})}
            className="min-h-11 w-fit rounded-control px-3 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline lg:justify-self-end"
          >
            Clear filters
          </button>
        ) : (
          <p className="self-center font-mono text-xs text-muted-foreground lg:justify-self-end">
            Newest first
          </p>
        )}
      </div>

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
            <p className="mb-4 font-mono text-xs text-muted-foreground">
              {ideas.length} {ideas.length === 1 ? "note" : "notes"} on the desk
            </p>
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
                    ? "Opening more pages…"
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
