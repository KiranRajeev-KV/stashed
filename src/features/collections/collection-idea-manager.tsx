import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, ChevronDown, Link2, Search, Trash2 } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

import {
  addCollectionIdeas,
  collectionIdeaCandidatesInfiniteQueryOptions,
  collectionIdeasInfiniteQueryOptions,
  collectionQueryKey,
  removeCollectionIdeas,
  type CollectionIdeaCandidate,
  type CollectionIdeasResponse,
} from "../../api/collections.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { Button } from "../../components/ui/button.js";
import {
  SearchActivity,
  SearchResultsTransition,
} from "../../components/ui/search-transition.js";
import {
  twCollectionField,
  twCollectionList,
  twCollectionListRow,
} from "../../styles/collection-styles.js";
import { twResourceEditSheetFooter } from "../../styles/dialogs-styles.js";
import { VisibilityIcon } from "../ideas/visibility-icon.js";

type ManagerView = "add" | "members";
type MemberIdea = CollectionIdeasResponse["ideas"][number];

function ideaIdFromInput(value: string) {
  return value
    .trim()
    .match(
      /(?:ideas\/)?([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})(?:\/?(?:[?#].*)?)?$/i,
    )?.[1];
}

function ideaLabel(count: number) {
  return `${count} ${count === 1 ? "Idea" : "Ideas"}`;
}

function IdeaIdentity({
  idea,
}: {
  idea: CollectionIdeaCandidate | MemberIdea;
}) {
  return (
    <>
      <VisibilityIcon
        visibility={idea.visibility}
        className="size-4 shrink-0 text-muted-foreground"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-ui font-medium">{idea.title}</p>
        <p className="truncate text-caption text-muted-foreground">
          {idea.author.displayName} · {idea.visibility.toLowerCase()}
        </p>
      </div>
    </>
  );
}

function CheckIndicator({ danger = false }: { danger?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-5 shrink-0 place-items-center rounded-[5px] border border-border bg-surface text-transparent transition-colors duration-(--duration-fast) ${danger ? "peer-checked:border-danger peer-checked:bg-danger peer-checked:text-danger-foreground" : "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground"} peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring motion-reduce:transition-none`}
    >
      <Check size={13} strokeWidth={2.5} />
    </span>
  );
}

/** Relationship manager: separate discovery from reviewing existing membership. */
export function CollectionIdeaManager({
  collectionId,
  collectionVisibility,
  visibleIdeaCount,
}: {
  collectionId: string;
  collectionVisibility: "PUBLIC" | "UNLISTED" | "PRIVATE";
  visibleIdeaCount: number;
}) {
  const [view, setView] = useState<ManagerView>("add");
  const [addQuery, setAddQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [direct, setDirect] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [selectedForAdd, setSelectedForAdd] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<string>>(
    () => new Set(),
  );
  const [removalMode, setRemovalMode] = useState(false);
  const [lastAddedCount, setLastAddedCount] = useState<number | null>(null);
  const [lastRemovedCount, setLastRemovedCount] = useState<number | null>(null);
  const [undoIdeaIds, setUndoIdeaIds] = useState<string[] | null>(null);
  const queryClient = useQueryClient();
  const deferredAddQuery = useDeferredValue(addQuery.trim());
  const deferredMemberQuery = useDeferredValue(memberQuery.trim());
  const candidates = useInfiniteQuery({
    ...collectionIdeaCandidatesInfiniteQueryOptions(collectionId, {
      q: deferredAddQuery || undefined,
    }),
    enabled: view === "add",
  });
  const members = useInfiniteQuery({
    ...collectionIdeasInfiniteQueryOptions(collectionId, {
      q: deferredMemberQuery || undefined,
      sort: "UPDATED_DESC",
    }),
    enabled: view === "members",
  });
  const candidateIdeas =
    candidates.data?.pages.flatMap((page) => page.ideas) ?? [];
  const memberIdeas = members.data?.pages.flatMap((page) => page.ideas) ?? [];
  const memberCount =
    members.data?.pages[0]?.visibleIdeaCount ?? visibleIdeaCount;
  const directId = ideaIdFromInput(direct);

  const refreshMembership = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["collection", collectionId, "ideas"],
      }),
      queryClient.invalidateQueries({
        queryKey: ["collection", collectionId, "idea-candidates"],
      }),
      queryClient.invalidateQueries({
        queryKey: collectionQueryKey(collectionId),
      }),
      queryClient.invalidateQueries({ queryKey: ["collections"] }),
    ]);
  };

  const add = useMutation({
    mutationFn: (ideaIds: string[]) =>
      addCollectionIdeas(collectionId, ideaIds),
    onSuccess: async (result) => {
      setLastAddedCount(result.addedIdeaIds.length);
      setLastRemovedCount(null);
      setSelectedForAdd(new Set());
      setDirect("");
      await refreshMembership();
    },
  });
  const remove = useMutation({
    mutationFn: (ideaIds: string[]) =>
      removeCollectionIdeas(collectionId, ideaIds),
    onSuccess: async (result) => {
      setLastRemovedCount(result.removedIdeaIds.length);
      setLastAddedCount(null);
      setSelectedForRemoval(new Set());
      setRemovalMode(false);
      setUndoIdeaIds(
        result.removedIdeaIds.length > 0 ? result.removedIdeaIds : null,
      );
      await refreshMembership();
    },
  });
  const undo = useMutation({
    mutationFn: (ideaIds: string[]) =>
      addCollectionIdeas(collectionId, ideaIds),
    onSuccess: async (result) => {
      setLastAddedCount(result.addedIdeaIds.length);
      setLastRemovedCount(null);
      setUndoIdeaIds(null);
      await refreshMembership();
    },
  });

  useEffect(() => {
    if (!undoIdeaIds) return;
    const timeout = window.setTimeout(() => setUndoIdeaIds(null), 8_000);
    return () => window.clearTimeout(timeout);
  }, [undoIdeaIds]);

  const toggleAddIdea = (idea: CollectionIdeaCandidate) => {
    if (idea.isMember || add.isPending) return;
    setLastAddedCount(null);
    setSelectedForAdd((current) => {
      const next = new Set(current);
      if (next.has(idea.id)) next.delete(idea.id);
      else next.add(idea.id);
      return next;
    });
  };
  const toggleMemberIdea = (ideaId: string) => {
    if (remove.isPending) return;
    setLastRemovedCount(null);
    setSelectedForRemoval((current) => {
      const next = new Set(current);
      if (next.has(ideaId)) next.delete(ideaId);
      else next.add(ideaId);
      return next;
    });
  };
  const selectedAddCount = selectedForAdd.size;
  const selectedRemovalCount = selectedForRemoval.size;
  const candidateResultLabel = deferredAddQuery
    ? `${candidateIdeas.length} ${candidateIdeas.length === 1 ? "match" : "matches"}`
    : "Recently updated, accessible Ideas";
  const memberResultLabel = deferredMemberQuery
    ? `${memberIdeas.length} ${memberIdeas.length === 1 ? "match" : "matches"}`
    : `${memberCount} ${memberCount === 1 ? "Idea" : "Ideas"} visible to you`;

  const changeView = (nextView: ManagerView) => {
    setView(nextView);
    setRemovalMode(false);
    setSelectedForRemoval(new Set());
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid shrink-0 gap-3 border-b border-border-subtle p-5 sm:px-6">
        <div
          role="tablist"
          aria-label="Manage collection ideas"
          className="grid grid-cols-2 gap-1 rounded-control border border-border bg-surface-muted p-1"
        >
          <button
            type="button"
            role="tab"
            id="collection-manager-add-tab"
            aria-controls="collection-manager-add-panel"
            aria-selected={view === "add"}
            className="min-h-8 rounded-[5px] px-3 text-ui text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground aria-selected:bg-surface aria-selected:font-medium aria-selected:text-foreground aria-selected:shadow-control motion-reduce:transition-none"
            onClick={() => changeView("add")}
          >
            Add ideas
          </button>
          <button
            type="button"
            role="tab"
            id="collection-manager-members-tab"
            aria-controls="collection-manager-members-panel"
            aria-selected={view === "members"}
            className="min-h-8 rounded-[5px] px-3 text-ui text-muted-foreground transition-colors duration-(--duration-fast) hover:text-foreground aria-selected:bg-surface aria-selected:font-medium aria-selected:text-foreground aria-selected:shadow-control motion-reduce:transition-none"
            onClick={() => changeView("members")}
          >
            In collection · {memberCount}
          </button>
        </div>

        {view === "add" ? (
          <>
            <label className={twCollectionField}>
              <Search
                size={16}
                aria-hidden="true"
                className="shrink-0 text-muted-foreground"
              />
              <span className="sr-only">Search accessible ideas</span>
              <input
                autoFocus
                value={addQuery}
                onChange={(event) => {
                  setAddQuery(event.currentTarget.value);
                  setLastAddedCount(null);
                }}
                className="min-w-0 flex-1 bg-transparent text-ui outline-none"
                placeholder="Search accessible ideas…"
              />
              <SearchActivity
                active={candidates.isFetching && !candidates.isFetchingNextPage}
                label="Searching accessible Ideas"
              />
            </label>
            <div>
              <Button
                variant="ghost"
                size="default"
                className="min-h-8 px-0 text-metadata text-muted-foreground hover:bg-transparent hover:text-foreground"
                aria-expanded={pasteOpen}
                onClick={() => setPasteOpen((current) => !current)}
              >
                <Link2 size={14} />
                Paste an Idea URL or ID
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-(--duration-fast) motion-reduce:transition-none ${pasteOpen ? "rotate-180" : ""}`}
                />
              </Button>
              {pasteOpen ? (
                <form
                  className={`${twCollectionField} mt-2`}
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (directId) add.mutate([directId]);
                  }}
                >
                  <label className="sr-only" htmlFor="collection-idea-url">
                    Idea URL or ID
                  </label>
                  <input
                    id="collection-idea-url"
                    value={direct}
                    onChange={(event) => {
                      setDirect(event.currentTarget.value);
                      setLastAddedCount(null);
                    }}
                    className="min-w-0 flex-1 bg-transparent text-ui outline-none"
                    placeholder="Paste an Idea URL or ID"
                  />
                  <Button
                    variant="secondary"
                    className="shrink-0"
                    type="submit"
                    disabled={!directId || add.isPending}
                  >
                    Add
                  </Button>
                </form>
              ) : null}
            </div>
            {collectionVisibility === "PUBLIC" ? (
              <p className="text-caption leading-relaxed text-muted-foreground">
                Unlisted Ideas can be added, but are not shown to public
                visitors.
              </p>
            ) : null}
          </>
        ) : (
          <label className={twCollectionField}>
            <Search
              size={16}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
            <span className="sr-only">Search ideas in this collection</span>
            <input
              autoFocus
              value={memberQuery}
              onChange={(event) => {
                setMemberQuery(event.currentTarget.value);
                setLastRemovedCount(null);
              }}
              className="min-w-0 flex-1 bg-transparent text-ui outline-none"
              placeholder="Search ideas in this collection…"
            />
            <SearchActivity
              active={members.isFetching && !members.isFetchingNextPage}
              label="Searching collection ideas"
            />
          </label>
        )}
      </div>

      {view === "add" ? (
        <SearchResultsTransition
          active={candidates.isFetching && !candidates.isFetchingNextPage}
          hasPreviousResults={candidates.data !== undefined}
          label="Updating accessible Ideas"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div
            id="collection-manager-add-panel"
            role="tabpanel"
            aria-labelledby="collection-manager-add-tab"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:px-6"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p
                className="text-caption font-medium text-muted-foreground"
                role="status"
              >
                {candidateResultLabel}
              </p>
              {selectedAddCount > 0 ? (
                <p className="text-caption text-foreground">
                  {ideaLabel(selectedAddCount)} selected
                </p>
              ) : null}
            </div>
            <div className={twCollectionList}>
              {candidateIdeas.map((idea) => {
                const isSelected = selectedForAdd.has(idea.id);
                return (
                  <label
                    key={idea.id}
                    className={`${twCollectionListRow} cursor-pointer pr-4 has-checked:bg-primary/8 has-checked:hover:bg-primary/10 has-disabled:cursor-default has-disabled:opacity-60`}
                  >
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={isSelected}
                      disabled={idea.isMember || add.isPending}
                      onChange={() => toggleAddIdea(idea)}
                      aria-label={`${isSelected ? "Deselect" : "Select"} ${idea.title}`}
                    />
                    <CheckIndicator />
                    <IdeaIdentity idea={idea} />
                    {idea.isMember ? (
                      <span className="shrink-0 text-metadata text-muted-foreground">
                        In collection
                      </span>
                    ) : null}
                  </label>
                );
              })}
              {candidates.isPending && candidateIdeas.length === 0 ? (
                <p className="p-4 text-caption text-muted-foreground">
                  Looking through accessible Ideas…
                </p>
              ) : null}
              {candidates.isError ? (
                <div className="grid gap-3 p-4">
                  <p className="text-caption text-danger">
                    {candidates.error.message}
                  </p>
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => candidates.refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              ) : null}
              {candidates.isSuccess && candidateIdeas.length === 0 ? (
                <p className="p-4 text-caption text-muted-foreground">
                  No accessible Ideas found.
                </p>
              ) : null}
            </div>
            {candidates.hasNextPage || candidates.isFetchNextPageError ? (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  loading={candidates.isFetchingNextPage}
                  loadingLabel="Loading more Ideas…"
                  onClick={() => candidates.fetchNextPage()}
                >
                  {candidates.isFetchNextPageError ? "Try again" : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        </SearchResultsTransition>
      ) : (
        <SearchResultsTransition
          active={members.isFetching && !members.isFetchingNextPage}
          hasPreviousResults={members.data !== undefined}
          label="Updating collection Ideas"
          className="flex min-h-0 flex-1 flex-col"
        >
          <div
            id="collection-manager-members-panel"
            role="tabpanel"
            aria-labelledby="collection-manager-members-tab"
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:px-6"
          >
            <div className="mb-2 flex items-center justify-between gap-3">
              <p
                className="text-caption font-medium text-muted-foreground"
                role="status"
              >
                {memberResultLabel}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                {selectedRemovalCount > 0 ? (
                  <p className="text-caption text-foreground">
                    {ideaLabel(selectedRemovalCount)} selected
                  </p>
                ) : null}
                <Button
                  variant="ghost"
                  size="default"
                  className="min-h-8 px-1.5 text-metadata"
                  disabled={remove.isPending}
                  onClick={() => {
                    setRemovalMode((current) => !current);
                    setSelectedForRemoval(new Set());
                  }}
                >
                  {removalMode ? "Cancel" : "Select"}
                </Button>
              </div>
            </div>
            <div className={twCollectionList}>
              {memberIdeas.map((idea) => {
                const isSelected = selectedForRemoval.has(idea.id);
                return (
                  <div
                    key={idea.id}
                    className={`${twCollectionListRow} pr-3 ${removalMode && isSelected ? "bg-danger/8 hover:bg-danger/10" : ""}`}
                  >
                    {removalMode ? (
                      <label className="relative flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <input
                          type="checkbox"
                          className="peer sr-only"
                          checked={isSelected}
                          disabled={remove.isPending}
                          onChange={() => toggleMemberIdea(idea.id)}
                          aria-label={`${isSelected ? "Deselect" : "Select"} ${idea.title} for removal`}
                        />
                        <CheckIndicator danger />
                        <IdeaIdentity idea={idea} />
                      </label>
                    ) : (
                      <>
                        <IdeaIdentity idea={idea} />
                        <Button
                          variant="ghost"
                          size="default"
                          className="min-h-8 shrink-0 px-2 text-caption text-muted-foreground hover:text-danger"
                          loading={
                            remove.isPending &&
                            remove.variables?.[0] === idea.id
                          }
                          loadingLabel="Removing"
                          onClick={() => remove.mutate([idea.id])}
                        >
                          <Trash2 size={14} />
                          <span>Remove</span>
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
              {members.isPending && memberIdeas.length === 0 ? (
                <p className="p-4 text-caption text-muted-foreground">
                  Loading Ideas in this collection…
                </p>
              ) : null}
              {members.isError ? (
                <div className="grid gap-3 p-4">
                  <p className="text-caption text-danger">
                    {members.error.message}
                  </p>
                  <div>
                    <Button
                      variant="secondary"
                      onClick={() => members.refetch()}
                    >
                      Try again
                    </Button>
                  </div>
                </div>
              ) : null}
              {members.isSuccess && memberIdeas.length === 0 ? (
                <p className="p-4 text-caption text-muted-foreground">
                  {deferredMemberQuery
                    ? "No visible Ideas match this search."
                    : "No visible Ideas are in this collection yet."}
                </p>
              ) : null}
            </div>
            {members.hasNextPage || members.isFetchNextPageError ? (
              <div className="mt-3 flex justify-center">
                <Button
                  variant="ghost"
                  loading={members.isFetchingNextPage}
                  loadingLabel="Loading more Ideas…"
                  onClick={() => members.fetchNextPage()}
                >
                  {members.isFetchNextPageError ? "Try again" : "Load more"}
                </Button>
              </div>
            ) : null}
          </div>
        </SearchResultsTransition>
      )}

      <div className={twResourceEditSheetFooter}>
        {view === "add" ? (
          <>
            <ActionFeedback
              state={
                add.isError
                  ? "error"
                  : add.isPending
                    ? "pending"
                    : lastAddedCount !== null
                      ? "success"
                      : "idle"
              }
            >
              {add.isError
                ? add.error.message
                : add.isPending
                  ? "Adding Ideas…"
                  : lastAddedCount !== null
                    ? `${ideaLabel(lastAddedCount)} added. Original permissions are unchanged.`
                    : null}
            </ActionFeedback>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button
                variant="primary"
                disabled={selectedAddCount === 0}
                loading={add.isPending}
                loadingLabel="Adding Ideas…"
                onClick={() => add.mutate([...selectedForAdd])}
              >
                Add {ideaLabel(selectedAddCount)}
              </Button>
            </div>
          </>
        ) : (
          <>
            <ActionFeedback
              state={
                remove.isError || undo.isError
                  ? "error"
                  : remove.isPending || undo.isPending
                    ? "pending"
                    : lastRemovedCount !== null || lastAddedCount !== null
                      ? "success"
                      : "idle"
              }
            >
              {remove.isError
                ? `Couldn’t remove the Idea. ${remove.error.message}`
                : undo.isError
                  ? `Couldn’t restore the Idea. ${undo.error.message}`
                  : remove.isPending
                    ? "Removing from this collection…"
                    : undo.isPending
                      ? "Restoring to this collection…"
                      : lastRemovedCount !== null
                        ? `${ideaLabel(lastRemovedCount)} removed from this collection. The Ideas are unchanged.`
                        : lastAddedCount !== null
                          ? `${ideaLabel(lastAddedCount)} restored to this collection.`
                          : null}
            </ActionFeedback>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              {undoIdeaIds ? (
                <Button
                  variant="secondary"
                  loading={undo.isPending}
                  loadingLabel="Restoring…"
                  onClick={() => undo.mutate(undoIdeaIds)}
                >
                  Undo
                </Button>
              ) : null}
              {removalMode ? (
                <Button
                  variant="destructive"
                  disabled={selectedRemovalCount === 0}
                  loading={remove.isPending}
                  loadingLabel="Removing Ideas…"
                  onClick={() => remove.mutate([...selectedForRemoval])}
                >
                  Remove {ideaLabel(selectedRemovalCount)}
                </Button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
