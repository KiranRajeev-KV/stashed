import { Link } from "@tanstack/react-router";

import type { SearchResult } from "../../api/search.js";
import { IDEA_STATUS_LABELS } from "../ideas/idea-status.js";
import { HighlightedExcerpt } from "./highlighted-excerpt.js";

type SearchResultCardProps = {
  index: number;
  result: SearchResult;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function SearchResultCard({ index, result }: SearchResultCardProps) {
  const updated = result.updatedAt !== result.createdAt;
  const timestamp = updated ? result.updatedAt : result.createdAt;

  return (
    <article className="search-result-card group">
      <div className="search-result-margin" aria-hidden="true">
        {String(index + 1).padStart(2, "0")}
      </div>

      <div className="search-result-content">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <span className="idea-status" data-status={result.status}>
            {IDEA_STATUS_LABELS[result.status]}
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
            params={{ ideaId: result.id }}
            className="text-foreground decoration-1 underline-offset-4 group-hover:text-primary group-hover:underline"
          >
            {result.title}
          </Link>
        </h2>

        <p className="search-result-excerpt">
          <HighlightedExcerpt excerpt={result.excerpt} />
        </p>

        <footer className="mt-5 flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
            <span className="truncate font-medium text-foreground">
              {result.author.displayName}
            </span>
            {result.author.username ? (
              <span className="truncate font-mono text-xs">
                @{result.author.username}
              </span>
            ) : null}
          </div>

          <Link
            to="/ideas/$ideaId"
            params={{ ideaId: result.id }}
            className="min-h-10 w-fit shrink-0 content-center font-medium text-primary underline-offset-4 hover:underline"
            aria-label={`Open ${result.title}`}
          >
            Read note <span aria-hidden="true">→</span>
          </Link>
        </footer>

        {result.tags.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Tags">
            {result.tags.map((tag) => (
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
      </div>
    </article>
  );
}
