import { useQuery } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";

import { ApiClientError } from "../../api/client.js";
import { ideaQueryOptions } from "../../api/ideas.js";
import { MarkdownContent } from "../markdown/markdown-content.js";
import {
  IdeaDetailError,
  IdeaDetailSkeleton,
  IdeaNotFound,
} from "./idea-detail-states.js";
import { DeleteIdeaDialog } from "./delete-idea-dialog.js";
import { IDEA_STATUS_LABELS } from "./idea-status.js";

const routeApi = getRouteApi("/_authenticated/ideas/$ideaId/");
const authenticatedRouteApi = getRouteApi("/_authenticated");
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "long",
  timeStyle: "short",
});

export function IdeaDetail() {
  const { ideaId } = routeApi.useParams();
  const { currentUser } = authenticatedRouteApi.useRouteContext();
  const ideaQuery = useQuery(ideaQueryOptions(ideaId));

  if (ideaQuery.isPending) {
    return <IdeaDetailSkeleton />;
  }

  if (ideaQuery.isError) {
    if (
      ideaQuery.error instanceof ApiClientError &&
      ideaQuery.error.status === 404
    ) {
      return <IdeaNotFound />;
    }

    return (
      <IdeaDetailError
        message={ideaQuery.error.message}
        onRetry={() => ideaQuery.refetch()}
      />
    );
  }

  const idea = ideaQuery.data;
  const isOwner = currentUser.id === idea.author.id;
  const authorInitials =
    idea.author.displayName.trim().slice(0, 2).toUpperCase() || "ST";

  return (
    <article>
      <Link
        to="/ideas"
        className="inline-flex min-h-10 items-center font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <span aria-hidden="true">←</span>
        <span className="ml-2">Shared archive</span>
      </Link>

      <header className="mt-5 border-b border-border pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <span className="idea-status" data-status={idea.status}>
            {IDEA_STATUS_LABELS[idea.status]}
          </span>

          {isOwner ? (
            <div className="idea-detail-actions">
              <Link
                to="/ideas/$ideaId/edit"
                params={{ ideaId: idea.id }}
                className="inline-flex min-h-11 items-center rounded-control border border-border-strong bg-surface px-4 text-sm font-medium transition-colors duration-(--duration-fast) hover:bg-surface-muted"
              >
                Edit idea
              </Link>
              <DeleteIdeaDialog ideaId={idea.id} ideaTitle={idea.title} />
            </div>
          ) : null}
        </div>

        <h1 className="mt-5 max-w-4xl text-page-title font-semibold wrap-anywhere">
          {idea.title}
        </h1>

        <div className="mt-6 flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {idea.author.avatarUrl ? (
              <img
                src={idea.author.avatarUrl}
                alt=""
                width="36"
                height="36"
                className="size-9 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted font-mono text-xs font-medium"
              >
                {authorInitials}
              </span>
            )}
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">
                {idea.author.displayName}
              </span>
              {idea.author.username ? (
                <span className="block truncate font-mono text-xs">
                  @{idea.author.username}
                </span>
              ) : null}
            </span>
          </div>

          <dl className="grid gap-1 font-mono text-xs sm:text-right">
            <div>
              <dt className="inline">Created </dt>
              <dd className="inline">
                <time dateTime={idea.createdAt}>
                  {dateFormatter.format(new Date(idea.createdAt))}
                </time>
              </dd>
            </div>
            <div>
              <dt className="inline">Updated </dt>
              <dd className="inline">
                <time dateTime={idea.updatedAt}>
                  {dateFormatter.format(new Date(idea.updatedAt))}
                </time>
              </dd>
            </div>
          </dl>
        </div>

        {idea.tags.length > 0 ? (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
            {idea.tags.map((tag) => (
              <li key={tag.id} className="min-w-0 max-w-full">
                <Link
                  to="/ideas"
                  search={{ tag: tag.id }}
                  className="inline-flex min-h-8 max-w-full items-center rounded-full border border-border bg-surface-muted px-3 font-mono text-xs text-muted-foreground transition-colors duration-(--duration-fast) hover:border-border-strong hover:text-foreground"
                >
                  <span className="truncate">{tag.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <div className="idea-detail-sheet mt-8 sm:mt-10">
        <aside className="idea-detail-margin" aria-hidden="true">
          <span>IDEA</span>
          <span>{idea.id.slice(0, 8)}</span>
        </aside>
        <div className="idea-detail-paper">
          <MarkdownContent markdown={idea.content} />
        </div>
      </div>
    </article>
  );
}
