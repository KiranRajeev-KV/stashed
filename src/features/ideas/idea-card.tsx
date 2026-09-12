import {
  twIdeaCard,
  twIdeaCardContent,
  twIdeaStatus,
} from "../../styles/archive-styles.js";
import { IdeaTagLink } from "./idea-page-ui.js";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";

import type { IdeaListItem } from "../../api/ideas.js";
import { IDEA_STATUS_LABELS } from "./idea-status.js";
import { IdeaStatusEditor } from "./idea-status-editor.js";
import { IdeaVisibilityEditor } from "./idea-visibility-editor.js";

type IdeaCardProps = {
  idea: IdeaListItem;
  currentUserId?: string;
  excerpt?: ReactNode;
  title?: ReactNode;
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
      <span className="truncate">{author.displayName}</span>
    </span>
  );
}

export function IdeaCard({
  currentUserId,
  excerpt,
  idea,
  title,
}: IdeaCardProps) {
  const updated = idea.updatedAt !== idea.createdAt;
  const timestamp = updated ? idea.updatedAt : idea.createdAt;
  const isOwner = currentUserId === idea.author.id;

  return (
    <article className={`${twIdeaCard} group`} data-idea-status={idea.status}>
      <div className={`${twIdeaCardContent} flex h-full flex-col`}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {isOwner ? (
            <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
              <IdeaStatusEditor idea={idea} />
              <IdeaVisibilityEditor idea={idea} />
            </div>
          ) : (
            <span className={twIdeaStatus} data-status={idea.status}>
              {IDEA_STATUS_LABELS[idea.status]}
            </span>
          )}
          <time
            dateTime={timestamp}
            title={new Date(timestamp).toLocaleString()}
            className="font-sans text-caption text-muted-foreground"
          >
            {updated ? "Revised" : "Saved"}{" "}
            {dateFormatter.format(new Date(timestamp))}
          </time>
        </div>

        <h2 className="mt-[19px] font-display text-card-title font-normal">
          <Link
            to="/ideas/$ideaId"
            params={{ ideaId: idea.id }}
            className="text-foreground decoration-border-strong decoration-1 underline-offset-4 hover:underline"
          >
            {title ?? idea.title}
          </Link>
        </h2>

        {(excerpt ?? idea.excerpt) ? (
          <p className="mt-2.5 line-clamp-3 text-ui leading-6 text-muted-foreground">
            {excerpt ?? idea.excerpt}
          </p>
        ) : null}

        {idea.tags.length > 0 ? (
          <ul className="mt-[17px] flex flex-wrap gap-1.75" aria-label="Tags">
            {idea.tags.map((tag) => (
              <li key={tag.id} className="min-w-0 max-w-full">
                <IdeaTagLink tag={tag} />
              </li>
            ))}
          </ul>
        ) : null}

        <footer className="pt-5 text-caption text-muted-foreground">
          <div className="-mx-6.5 flex items-center justify-between gap-4 border-t border-border bg-foreground/2 px-6.5 py-2.25 max-md:-mx-5 max-md:px-5">
            <IdeaAuthor idea={idea} />
            <Link
              to="/ideas/$ideaId"
              params={{ ideaId: idea.id }}
              className="inline-flex min-h-9.5 shrink-0 items-center justify-center gap-2 rounded-sm font-medium text-muted-foreground transition-[color,transform] duration-200 hover:translate-x-0.5 hover:text-foreground motion-reduce:transform-none motion-reduce:transition-none"
              aria-label={`Open ${idea.title}`}
            >
              Open idea
              <ArrowUpRight
                size={15}
                className="inline-block size-4.5"
                aria-hidden="true"
              />
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}
