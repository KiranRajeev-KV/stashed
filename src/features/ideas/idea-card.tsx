import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import * as React from "react";
import { toast } from "sonner";

import {
  ideaQueryKey,
  type IdeaListItem,
  type IdeaStatus,
  updateIdea,
} from "../../api/ideas.js";
import { IDEA_STATUS_LABELS } from "./idea-status.js";
import { StatusSelect } from "./status-select.js";

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

function QuickStatusEditor({ idea }: { idea: IdeaListItem }) {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = React.useState(idea.status);
  const mutation = useMutation({
    mutationFn: (status: IdeaStatus) => updateIdea(idea.id, { status }),
    onSuccess: async ({ idea: updatedIdea }) => {
      setSelectedStatus(updatedIdea.status);
      queryClient.setQueryData(ideaQueryKey(updatedIdea.id), updatedIdea);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["ideas"] }),
        queryClient.invalidateQueries({ queryKey: ["search"] }),
      ]);
      toast.success("Status updated", {
        description: `Marked as ${IDEA_STATUS_LABELS[updatedIdea.status]}.`,
      });
    },
    onError: (error) => {
      setSelectedStatus(idea.status);
      toast.error("Failed to update status", { description: error.message });
    },
  });

  React.useEffect(() => {
    if (!mutation.isPending) setSelectedStatus(idea.status);
  }, [idea.status, mutation.isPending]);

  function handleStatusChange(status?: IdeaStatus) {
    if (!status || status === selectedStatus || mutation.isPending) return;

    setSelectedStatus(status);
    mutation.mutate(status);
  }

  return (
    <div className="idea-card-status-editor">
      <StatusSelect
        className="min-w-0"
        disabled={mutation.isPending}
        label="Change status"
        labelClassName="sr-only"
        onValueChange={handleStatusChange}
        triggerClassName="idea-card-status-trigger"
        value={selectedStatus}
      />
      <span className="sr-only" aria-live="polite">
        {mutation.isPending ? "Updating status" : ""}
      </span>
    </div>
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
    <article className="idea-card group">
      <div className="idea-card-margin" aria-hidden="true">
        <span>{IDEA_STATUS_LABELS[idea.status].slice(0, 1)}</span>
      </div>

      <div className="idea-card-content flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {isOwner ? (
            <QuickStatusEditor idea={idea} />
          ) : (
            <span className="idea-status" data-status={idea.status}>
              {IDEA_STATUS_LABELS[idea.status]}
            </span>
          )}
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
            {title ?? idea.title}
          </Link>
        </h2>

        {(excerpt ?? idea.excerpt) ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {excerpt ?? idea.excerpt}
          </p>
        ) : null}

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

        <footer className="mt-auto pt-5 text-sm text-muted-foreground">
          <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
            <IdeaAuthor idea={idea} />
            <Link
              to="/ideas/$ideaId"
              params={{ ideaId: idea.id }}
              className="shrink-0 font-medium text-primary underline-offset-4 hover:underline"
              aria-label={`Open ${idea.title}`}
            >
              Read idea <span aria-hidden="true">→</span>
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}
