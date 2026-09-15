import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { Check, Search } from "lucide-react";
import { useDeferredValue, useEffect, useState } from "react";

import {
  addCollectionIdeas,
  collectionIdeaTargetsInfiniteQueryOptions,
  type CollectionIdeaTarget,
} from "../../api/collections.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { Button } from "../../components/ui/button.js";
import {
  SearchActivity,
  SearchResultsTransition,
} from "../../components/ui/search-transition.js";
import {
  twCollectionField,
  twCollectionIconTile,
  twCollectionList,
  twCollectionListRow,
  twCollectionMeta,
} from "../../styles/collection-styles.js";
import { twResourceEditSheetFooter } from "../../styles/dialogs-styles.js";
import { CollectionCollaboratorAvatars } from "../collections/collaborator-avatars.js";
import { CollectionIcon } from "../collections/collection-icon.js";
import { VisibilityIcon } from "./visibility-icon.js";

type AddResult = {
  addedCount: number;
  alreadyAddedCount: number;
  failedCollectionIds: string[];
};

function collectionLabel(count: number) {
  return `${count} ${count === 1 ? "collection" : "collections"}`;
}

/**
 * Contextual picker for associating one Idea with collections the current user
 * owns or can edit. It intentionally does not expose collection metadata on
 * the Idea reader itself.
 */
export function AddIdeaToCollectionsPanel({
  ideaId,
  onSelectionCountChange,
}: {
  ideaId: string;
  onSelectionCountChange: (count: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [lastResult, setLastResult] = useState<AddResult | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const queryClient = useQueryClient();
  const targets = useInfiniteQuery(
    collectionIdeaTargetsInfiniteQueryOptions({
      ideaId,
      q: deferredQuery || undefined,
    }),
  );
  const collections =
    targets.data?.pages.flatMap((page) => page.collections) ?? [];

  useEffect(() => {
    onSelectionCountChange(selected.size);
  }, [onSelectionCountChange, selected.size]);

  const add = useMutation({
    mutationFn: async (collectionIds: string[]) => {
      const outcomes = await Promise.allSettled(
        collectionIds.map(async (collectionId) => {
          const result = await addCollectionIdeas(collectionId, [ideaId]);
          return {
            collectionId,
            added: result.addedIdeaIds.includes(ideaId),
          };
        }),
      );
      const fulfilled = outcomes.filter(
        (
          outcome,
        ): outcome is PromiseFulfilledResult<{
          collectionId: string;
          added: boolean;
        }> => outcome.status === "fulfilled",
      );
      const failedCollectionIds = outcomes.flatMap((outcome, index) =>
        outcome.status === "rejected" ? [collectionIds[index]] : [],
      );

      if (fulfilled.length === 0) {
        const firstFailure = outcomes.find(
          (outcome): outcome is PromiseRejectedResult =>
            outcome.status === "rejected",
        );
        throw firstFailure?.reason;
      }

      return {
        addedCount: fulfilled.filter((outcome) => outcome.value.added).length,
        alreadyAddedCount: fulfilled.filter((outcome) => !outcome.value.added)
          .length,
        failedCollectionIds,
      } satisfies AddResult;
    },
    onSuccess: async (result) => {
      setLastResult(result);
      setSelected(new Set(result.failedCollectionIds));
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["collections", "idea-targets"],
        }),
        queryClient.invalidateQueries({ queryKey: ["collections"] }),
        queryClient.invalidateQueries({ queryKey: ["collection"] }),
      ]);
    },
  });

  const toggleCollection = (collection: CollectionIdeaTarget) => {
    if (collection.isMember || add.isPending) return;
    setLastResult(null);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(collection.id)) next.delete(collection.id);
      else next.add(collection.id);
      return next;
    });
  };

  const selectedCount = selected.size;
  const resultLabel = deferredQuery
    ? `${collections.length} ${collections.length === 1 ? "match" : "matches"}`
    : "Collections you can manage";
  const feedbackState = add.isError
    ? "error"
    : add.isPending
      ? "pending"
      : lastResult?.failedCollectionIds.length
        ? "error"
        : lastResult
          ? "success"
          : "idle";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border-subtle p-5 sm:px-6">
        <label className={twCollectionField}>
          <Search
            size={16}
            aria-hidden="true"
            className="shrink-0 text-muted-foreground"
          />
          <span className="sr-only">Search collections</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.currentTarget.value);
              setLastResult(null);
            }}
            className="min-w-0 flex-1 bg-transparent text-ui outline-none"
            placeholder="Search collections…"
          />
          <SearchActivity
            active={targets.isFetching && !targets.isFetchingNextPage}
            label="Searching collections"
          />
        </label>
      </div>

      <SearchResultsTransition
        active={targets.isFetching && !targets.isFetchingNextPage}
        hasPreviousResults={targets.data !== undefined}
        label="Updating collections"
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:px-6">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p
              className="text-caption font-medium text-muted-foreground"
              role="status"
            >
              {resultLabel}
            </p>
            {selectedCount > 0 ? (
              <p className="text-caption text-foreground">
                {collectionLabel(selectedCount)} selected
              </p>
            ) : null}
          </div>

          <div className={twCollectionList}>
            {collections.map((collection) => {
              const isSelected = selected.has(collection.id);
              return (
                <label
                  key={collection.id}
                  className={`${twCollectionListRow} cursor-pointer pr-3 has-checked:bg-primary/8 has-checked:hover:bg-primary/10 has-disabled:cursor-default has-disabled:opacity-60`}
                >
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={isSelected}
                    disabled={collection.isMember || add.isPending}
                    onChange={() => toggleCollection(collection)}
                    aria-label={`${isSelected ? "Deselect" : "Select"} ${collection.name}`}
                  />
                  <span
                    aria-hidden="true"
                    className="grid size-5 shrink-0 place-items-center rounded-[5px] border border-border bg-surface text-transparent transition-colors duration-(--duration-fast) peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring motion-reduce:transition-none"
                  >
                    <Check size={13} strokeWidth={2.5} />
                  </span>
                  <span className={`${twCollectionIconTile} size-8`}>
                    <CollectionIcon icon={collection.icon} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui font-medium">
                      {collection.name}
                    </p>
                    <p className={twCollectionMeta}>
                      <span className="inline-flex items-center gap-1 capitalize">
                        <VisibilityIcon
                          visibility={collection.visibility}
                          className="size-3"
                        />
                        {collection.visibility.toLowerCase()}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">
                        {collection.role === "OWNER" ? "owner" : "editor"}
                      </span>
                    </p>
                  </div>
                  {collection.isMember ? (
                    <span className="shrink-0 text-metadata text-muted-foreground">
                      Added
                    </span>
                  ) : (
                    <CollectionCollaboratorAvatars
                      owner={collection.owner}
                      editors={collection.editors}
                      className="hidden shrink-0 sm:flex"
                    />
                  )}
                </label>
              );
            })}
            {targets.isPending && collections.length === 0 ? (
              <p className="p-4 text-caption text-muted-foreground">
                Finding collections you can manage…
              </p>
            ) : null}
            {targets.isError ? (
              <div className="grid gap-3 p-4">
                <p className="text-caption text-danger">
                  {targets.error.message}
                </p>
                <div>
                  <Button variant="secondary" onClick={() => targets.refetch()}>
                    Try again
                  </Button>
                </div>
              </div>
            ) : null}
            {targets.isSuccess && collections.length === 0 ? (
              <p className="p-4 text-caption leading-relaxed text-muted-foreground">
                No collections you can add this Idea to yet.
              </p>
            ) : null}
          </div>

          {targets.hasNextPage || targets.isFetchNextPageError ? (
            <div className="mt-3 flex justify-center">
              <Button
                variant="ghost"
                loading={targets.isFetchingNextPage}
                loadingLabel="Loading more collections…"
                onClick={() => targets.fetchNextPage()}
              >
                {targets.isFetchNextPageError ? "Try again" : "Load more"}
              </Button>
            </div>
          ) : null}
        </div>
      </SearchResultsTransition>

      <div className={twResourceEditSheetFooter}>
        <ActionFeedback state={feedbackState}>
          {add.isError
            ? add.error.message
            : add.isPending
              ? "Adding to collections…"
              : lastResult?.failedCollectionIds.length
                ? `Added to ${collectionLabel(lastResult.addedCount)}. ${collectionLabel(lastResult.failedCollectionIds.length)} could not be updated; keep it selected and try again.`
                : lastResult
                  ? lastResult.addedCount > 0
                    ? `Added to ${collectionLabel(lastResult.addedCount)}. Idea permissions are unchanged.`
                    : `Already added to ${collectionLabel(lastResult.alreadyAddedCount)}.`
                  : null}
        </ActionFeedback>
        <div className="mt-3 flex flex-wrap justify-end gap-2">
          <Button
            variant="primary"
            disabled={selectedCount === 0}
            loading={add.isPending}
            loadingLabel="Adding to collections…"
            onClick={() => add.mutate([...selected])}
          >
            Add to {collectionLabel(selectedCount)}
          </Button>
        </div>
      </div>
    </div>
  );
}
