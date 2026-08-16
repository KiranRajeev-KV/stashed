import { Link } from "@tanstack/react-router";

import type { IdeaListItem } from "../../api/ideas.js";
import { IDEA_STATUS_LABELS } from "./idea-status.js";

type IdeaCardProps = {
  idea: IdeaListItem;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function IdeaAuthor({ idea }: IdeaCardProps) {
  const { author } = idea;
  const initials = author.displayName.trim().slice(0, 2).toUpperCase() || "ST";

  return (
    <span className="flex min-w-0 items-center gap-2">
      {author.avatarUrl ? (
        <img
          src={author.avatarUrl}
          alt=""
          width="28"
          height="28"
          loading="lazy"
          className="size-7 shrink-0 rounded-full border border-border object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted font-mono text-micro font-medium text-muted-foreground"
        >
          {initials}
        </span>
      )}
      <span className="truncate">
        {author.displayName}
        {author.username ? (
          <span className="hidden text-muted-foreground sm:inline">
            {" "}
            @{author.username}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const updated = idea.updatedAt !== idea.createdAt;
  const timestamp = updated ? idea.updatedAt : idea.createdAt;

  return (
    <article className="idea-card group">
      <div className="idea-card-margin" aria-hidden="true">
        <span>{IDEA_STATUS_LABELS[idea.status].slice(0, 1)}</span>
      </div>

      <div className="idea-card-content">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="idea-status" data-status={idea.status}>
            {IDEA_STATUS_LABELS[idea.status]}
          </span>
          <time
            dateTime={timestamp}
            title={new Date(timestamp).toLocaleString()}
            className="font-mono text-xs text-muted-foreground"
          >
            {updated ? "Revised" : "Saved"}{" "}
            {dateFormatter.format(new Date(timestamp))}
          </time>
        </div>

        <h2 className="mt-4 text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
          <Link
            to="/ideas/$ideaId"
            params={{ ideaId: idea.id }}
            className="idea-card-link text-foreground decoration-1 underline-offset-4 group-hover:text-primary group-hover:underline"
          >
            {idea.title}
          </Link>
        </h2>

        <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {idea.excerpt}
        </p>

        {idea.tags.length > 0 ? (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Tags">
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

        <footer className="mt-5 flex items-center justify-between gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
          <IdeaAuthor idea={idea} />
          <Link
            to="/ideas/$ideaId"
            params={{ ideaId: idea.id }}
            className="shrink-0 font-medium text-primary underline-offset-4 hover:underline"
            aria-label={`Open ${idea.title}`}
          >
            Read note <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </div>
    </article>
  );
}
