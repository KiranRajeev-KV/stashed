import { ActionFeedback } from "../../components/ui/action-feedback.js";
import {
  BreadcrumbCurrent,
  BreadcrumbItem,
  BreadcrumbLink,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb.js";
import { Button } from "../../components/ui/button.js";
import { CopyLinkButton } from "../../components/ui/copy-link-button.js";
import { ResourceEditSheet } from "../../components/ui/resource-edit-sheet.js";
import { ResourcePageToolbar } from "../../components/ui/resource-page-toolbar.js";
import { buttonStyles } from "../../components/ui/button-variants.js";
import {
  twIdeaReader,
  twIdeaReaderAuthor,
  twIdeaReaderAvatar,
  twIdeaReaderContent,
  twIdeaReaderDocument,
  twIdeaReaderEmpty,
  twIdeaReaderHeading,
  twIdeaReaderKicker,
  twIdeaReaderLayout,
  twIdeaReaderManage,
  twIdeaReaderProperties,
  twIdeaReaderSidebar,
  twIdeaReaderStatus,
  twIdeaReaderTags,
  twIdeaReaderUsername,
} from "../../styles/idea-page-styles.js";
import { IdeaTagLink } from "./idea-page-ui.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import { FileText, FolderPlus, Pencil } from "lucide-react";
import { useState } from "react";

import { currentUserQueryOptions } from "../../api/auth.js";
import { ApiClientError } from "../../api/client.js";
import {
  type Idea,
  ideaQueryKey,
  invalidateIdeaSurfaces,
  ideaQueryOptions,
  updateIdea,
} from "../../api/ideas.js";
import { MarkdownContent } from "../markdown/markdown-content.js";
import {
  IdeaDetailError,
  IdeaDetailSkeleton,
  IdeaNotFound,
} from "./idea-detail-states.js";
import { DeleteIdeaDialog } from "./delete-idea-dialog.js";
import { IDEA_STATUS_LABELS } from "./idea-status.js";
import { IdeaStatusEditor } from "./idea-status-editor.js";
import {
  IdeaAudienceLabel,
  IdeaDistributionLabel,
} from "./idea-sharing-summary.js";
import { AddIdeaToCollectionsPanel } from "./add-idea-to-collections-panel.js";

import {
  IDEA_DISTRIBUTION_LABELS,
  IDEA_PUBLIC_LINK_NOTE,
} from "./idea-sharing.js";
import { ProceduralIdeaBanner } from "./procedural-art/procedural-idea-banner.js";

const routeApi = getRouteApi("/ideas/$ideaId");
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export function IdeaDetail() {
  const { ideaId } = routeApi.useParams();
  const currentUserQuery = useQuery(currentUserQueryOptions());
  const ideaQuery = useQuery(ideaQueryOptions(ideaId));
  const queryClient = useQueryClient();
  const [collectionPickerOpen, setCollectionPickerOpen] = useState(false);
  const [collectionSelectionCount, setCollectionSelectionCount] = useState(0);
  const taskListMutation = useMutation({
    mutationFn: (content: string) => updateIdea(ideaId, { content }),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ideaQueryKey(ideaId) });
      const previousIdea = queryClient.getQueryData<Idea>(ideaQueryKey(ideaId));

      queryClient.setQueryData<Idea>(ideaQueryKey(ideaId), (idea) =>
        idea ? { ...idea, content } : idea,
      );

      return { previousIdea };
    },
    onError: (_error, _content, context) => {
      if (context?.previousIdea) {
        queryClient.setQueryData(ideaQueryKey(ideaId), context.previousIdea);
      }
    },
    onSuccess: ({ idea }) => {
      queryClient.setQueryData(ideaQueryKey(idea.id), idea);
    },
    onSettled: async () => {
      await invalidateIdeaSurfaces(queryClient);
    },
  });

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
  const isOwner = currentUserQuery.data?.id === idea.author.id;
  const content = idea.content;
  const isPublicLinkOnly =
    idea.access === "PUBLIC" && idea.distribution === "UNLISTED";
  const authorInitials =
    idea.author.displayName.trim().slice(0, 2).toUpperCase() || "ST";

  return (
    <article className={twIdeaReader}>
      <ResourcePageToolbar
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/ideas">Ideas</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbCurrent>{idea.title}</BreadcrumbCurrent>
            </BreadcrumbItem>
          </Breadcrumbs>
        }
        actions={
          <>
            <CopyLinkButton
              key={idea.id}
              isPrivate={idea.access === "PRIVATE"}
            />
            {currentUserQuery.data && !isPublicLinkOnly ? (
              <Button
                variant="secondary"
                onClick={() => setCollectionPickerOpen(true)}
              >
                <FolderPlus size={15} aria-hidden="true" />
                Add to collection
              </Button>
            ) : null}
            {isOwner ? (
              <Link
                to="/ideas/$ideaId/edit"
                params={{ ideaId: idea.id }}
                className={buttonStyles({ variant: "primary" })}
              >
                <Pencil size={14} aria-hidden="true" />
                Edit idea
              </Link>
            ) : null}
          </>
        }
      />

      <ProceduralIdeaBanner ideaId={idea.id} />

      <ResourceEditSheet
        open={collectionPickerOpen}
        title="Add to collection"
        description="Choose collections you own or can edit. Adding never changes this Idea’s permissions."
        dirty={collectionSelectionCount > 0}
        onClose={() => {
          setCollectionSelectionCount(0);
          setCollectionPickerOpen(false);
        }}
      >
        {() => (
          <AddIdeaToCollectionsPanel
            key={collectionPickerOpen ? "open" : "closed"}
            ideaId={idea.id}
            onSelectionCountChange={setCollectionSelectionCount}
          />
        )}
      </ResourceEditSheet>

      <div className={twIdeaReaderLayout}>
        <div className={twIdeaReaderDocument}>
          <header className={twIdeaReaderHeading}>
            <p className={twIdeaReaderKicker}>
              <FileText size={14} aria-hidden="true" />
              Idea
            </p>
            <h1>{idea.title}</h1>
            <div className={twIdeaReaderAuthor}>
              {idea.author.avatarUrl ? (
                <img
                  src={idea.author.avatarUrl}
                  alt=""
                  width="30"
                  height="30"
                />
              ) : (
                <span className={twIdeaReaderAvatar} aria-hidden="true">
                  {authorInitials}
                </span>
              )}
              <span>{idea.author.displayName}</span>
              {idea.author.username &&
              idea.author.username !== idea.author.displayName ? (
                <span className={twIdeaReaderUsername}>
                  @{idea.author.username}
                </span>
              ) : null}
            </div>
          </header>

          <div className={twIdeaReaderContent}>
            {/^\s*(?:&#x20;)?\s*$/i.test(content) ? (
              <div className={twIdeaReaderEmpty}>
                <FileText size={20} aria-hidden="true" />
                <p>No additional notes yet.</p>
                {isOwner ? (
                  <Link to="/ideas/$ideaId/edit" params={{ ideaId: idea.id }}>
                    Add some context <Pencil size={13} aria-hidden="true" />
                  </Link>
                ) : null}
              </div>
            ) : (
              <MarkdownContent
                markdown={content}
                onTaskListChange={
                  isOwner
                    ? (nextContent) => {
                        if (!taskListMutation.isPending)
                          taskListMutation.mutate(nextContent);
                      }
                    : undefined
                }
                taskListDisabled={taskListMutation.isPending}
              />
            )}
            <ActionFeedback
              className="mt-3"
              state={
                taskListMutation.isError
                  ? "error"
                  : taskListMutation.isPending
                    ? "pending"
                    : taskListMutation.isSuccess
                      ? "success"
                      : "idle"
              }
            >
              {taskListMutation.isPending
                ? "Updating checklist…"
                : taskListMutation.isError
                  ? `Checklist wasn’t saved. ${taskListMutation.error.message} Your previous checklist has been restored. Toggle the item to try again.`
                  : taskListMutation.isSuccess
                    ? "Checklist saved."
                    : null}
            </ActionFeedback>
          </div>
        </div>

        <aside className={twIdeaReaderSidebar} aria-label="Idea details">
          <h2>Details</h2>
          <dl className={twIdeaReaderProperties}>
            <div>
              <dt>Status</dt>
              <dd>
                {isOwner ? (
                  <IdeaStatusEditor idea={idea} />
                ) : (
                  <span
                    className={twIdeaReaderStatus}
                    data-status={idea.status}
                  >
                    {IDEA_STATUS_LABELS[idea.status]}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt>Audience</dt>
              <dd>
                <IdeaAudienceLabel access={idea.access} />
              </dd>
            </div>
            <div>
              <dt>Appears in</dt>
              <dd>
                {idea.access === "PUBLIC" ? (
                  <IdeaDistributionLabel distribution={idea.distribution} />
                ) : (
                  "Hidden from others"
                )}
              </dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>
                <time
                  dateTime={idea.createdAt}
                  title={new Date(idea.createdAt).toLocaleString()}
                >
                  {dateFormatter.format(new Date(idea.createdAt))}
                </time>
              </dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>
                <time
                  dateTime={idea.updatedAt}
                  title={new Date(idea.updatedAt).toLocaleString()}
                >
                  {dateFormatter.format(new Date(idea.updatedAt))}
                </time>
              </dd>
            </div>
          </dl>
          <div className="mt-4 grid gap-3 text-caption text-muted-foreground">
            {idea.access === "PRIVATE" ? (
              <p>
                If you choose Anyone again, this idea will use:{" "}
                {IDEA_DISTRIBUTION_LABELS[idea.distribution]}.
              </p>
            ) : (
              <p>{IDEA_PUBLIC_LINK_NOTE}</p>
            )}
            {isPublicLinkOnly ? (
              <p>
                Link only ideas cannot appear in collections.
                {isOwner
                  ? " Choose Everywhere or Collections only to add this idea."
                  : ""}
              </p>
            ) : null}
            {isOwner ? (
              <Link
                to="/ideas/$ideaId/edit"
                params={{ ideaId: idea.id }}
                className="inline-flex min-h-11 items-center gap-1.5 justify-self-start text-foreground underline decoration-border-strong underline-offset-4 hover:decoration-foreground"
              >
                <Pencil size={13} aria-hidden="true" />
                Edit sharing
              </Link>
            ) : null}
          </div>
          {idea.tags.length > 0 ? (
            <section className={twIdeaReaderTags} aria-label="Tags">
              <h2>Tags</h2>
              <ul>
                {idea.tags.map((tag) => (
                  <li key={tag.id}>
                    <IdeaTagLink tag={tag} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {isOwner ? (
            <div className={twIdeaReaderManage}>
              <DeleteIdeaDialog ideaId={idea.id} ideaTitle={idea.title} />
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
