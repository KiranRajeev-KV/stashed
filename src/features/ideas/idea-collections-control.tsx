import { Popover } from "@base-ui/react/popover";
import {
  useMutation,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, FolderPlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  removeCollectionIdea,
  type IdeaCollectionMembership,
} from "../../api/collections.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { Button } from "../../components/ui/button.js";
import { ResourceEditSheet } from "../../components/ui/resource-edit-sheet.js";
import {
  twUiSelectItem,
  twUiSelectPopup,
} from "../../styles/selects-styles.js";
import { CollectionIcon } from "../collections/collection-icon.js";
import { AddIdeaToCollectionsPanel } from "./add-idea-to-collections-panel.js";

type Memberships = { collections: IdeaCollectionMembership[] };

export function IdeaCollectionsControl({
  ideaId,
  signedIn,
  membershipsQuery,
  onRemoved,
}: {
  ideaId: string;
  signedIn: boolean;
  membershipsQuery: UseQueryResult<Memberships, Error>;
  onRemoved: (collectionId: string) => Promise<void>;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [sheet, setSheet] = useState<"memberships" | "add" | null>(null);
  const [selectionCount, setSelectionCount] = useState(0);
  const [adding, setAdding] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // A ref also covers the popover's closing animation after the sheet opens.
  const handingOff = useRef(false);
  const queryClient = useQueryClient();
  const collections = membershipsQuery.data?.collections ?? [];
  const noMemberships = membershipsQuery.isSuccess && collections.length === 0;

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeMemberships = () => {
      setPopoverOpen(false);
      setSheet((current) => (current === "memberships" ? null : current));
    };
    desktop.addEventListener("change", closeMemberships);
    return () => desktop.removeEventListener("change", closeMemberships);
  }, []);

  const remove = useMutation({
    mutationFn: (collection: IdeaCollectionMembership) =>
      removeCollectionIdea(collection.id, ideaId),
    onSuccess: async (_result, collection) => {
      if (
        document.activeElement
          ?.closest("[data-collection-id]")
          ?.getAttribute("data-collection-id") === collection.id
      ) {
        listRef.current?.focus();
      }
      queryClient.setQueriesData<Memberships>(
        { queryKey: ["collections", "idea-memberships", ideaId] },
        (current) =>
          current
            ? {
                ...current,
                collections: current.collections.filter(
                  (member) => member.id !== collection.id,
                ),
              }
            : current,
      );
      await onRemoved(collection.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["collections"] }),
        queryClient.invalidateQueries({
          queryKey: ["collection", collection.id],
        }),
      ]);
    },
  });

  function openAddSheet() {
    handingOff.current = true;
    setPopoverOpen(false);
    setSheet("add");
  }

  function closeSheet() {
    setSelectionCount(0);
    setSheet(null);
    // Keep popover focus restoration suppressed until the next explicit open.
  }

  const label =
    membershipsQuery.isPending || membershipsQuery.isError
      ? "Collections"
      : noMemberships
        ? "Add to collection"
        : collections.length === 1
          ? `In ${collections[0].name}`
          : `In ${collections.length} collections`;

  const membershipList = (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-[5px] [scrollbar-width:thin]">
        {membershipsQuery.isPending ? (
          <p className="p-3 text-caption text-muted-foreground" role="status">
            Loading collections…
          </p>
        ) : null}
        <ActionFeedback
          className={membershipsQuery.isError ? "px-3 py-2" : ""}
          state={membershipsQuery.isError ? "error" : "idle"}
        >
          {membershipsQuery.isError
            ? collections.length > 0
              ? "Couldn’t refresh collections. Showing the last saved list. Try again to check for changes."
              : "Couldn’t load collections. Try again to see where this idea is saved."
            : null}
        </ActionFeedback>
        {membershipsQuery.isError ? (
          <Button variant="ghost" onClick={() => membershipsQuery.refetch()}>
            Try again
          </Button>
        ) : null}
        {noMemberships ? (
          <p className="p-3 text-ui text-muted-foreground">
            This idea isn’t in any visible collections.
          </p>
        ) : null}
        <ul
          ref={listRef}
          tabIndex={-1}
          aria-label="Collections containing this idea"
          className="rounded-[5px] focus-visible:outline-2 focus-visible:outline-ring"
        >
          {collections.map((collection) => (
            <li
              key={collection.id}
              data-collection-id={collection.id}
              className="flex min-w-0 items-center rounded-[5px] hover:bg-surface-muted focus-within:bg-surface-muted"
            >
              <Link
                to="/collections/$collectionId"
                params={{ collectionId: collection.id }}
                className={`${twUiSelectItem} flex min-w-0 flex-1 items-center text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring max-lg:[&]:min-h-11`}
                onClick={() => {
                  setPopoverOpen(false);
                  setSheet(null);
                }}
              >
                <CollectionIcon
                  icon={collection.icon}
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
                <span className="min-w-0 break-words">{collection.name}</span>
              </Link>
              {collection.capabilities.manageIdeas ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-0.5 shrink-0 text-muted-foreground hover:text-danger [&]:size-8 [&]:min-h-8 [&]:rounded-[5px] max-lg:[&]:size-11 max-lg:[&]:min-h-11 [@media(pointer:_coarse)]:[&]:size-control [@media(pointer:_coarse)]:[&]:min-h-control"
                  aria-label={`Remove from ${collection.name}`}
                  title={`Remove from ${collection.name}`}
                  loading={
                    remove.isPending && remove.variables.id === collection.id
                  }
                  loadingLabel={<span className="sr-only">Removing…</span>}
                  disabled={remove.isPending}
                  onClick={() => {
                    // Disabling the pending button must not drop keyboard focus.
                    listRef.current?.focus();
                    remove.mutate(collection);
                  }}
                >
                  <X size={14} aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
        <ActionFeedback
          className={remove.isIdle ? "" : "px-3 pt-2"}
          state={
            remove.isError
              ? "error"
              : remove.isPending
                ? "pending"
                : remove.isSuccess
                  ? "success"
                  : "idle"
          }
        >
          {remove.isError
            ? `Couldn’t remove from ${remove.variables.name}. The idea is still in the collection. Use its remove button to try again.`
            : remove.isPending
              ? `Removing from ${remove.variables.name}…`
              : remove.isSuccess
                ? `Removed from ${remove.variables.name}. Your idea is unchanged.`
                : null}
        </ActionFeedback>
      </div>
      {signedIn ? (
        <div className="shrink-0 border-t border-border p-[5px]">
          <Button
            variant="ghost"
            className={`${twUiSelectItem} w-full justify-start border-0 text-left max-lg:[&]:min-h-11`}
            onClick={openAddSheet}
            disabled={remove.isPending}
          >
            <FolderPlus size={14} aria-hidden="true" />
            Add to collection
          </Button>
        </div>
      ) : null}
    </>
  );

  if (!signedIn && collections.length === 0) return null;

  return (
    <>
      <Popover.Root
        open={popoverOpen}
        onOpenChange={(open) => {
          if (open && noMemberships && signedIn) {
            openAddSheet();
            return;
          }
          if (open && !window.matchMedia("(min-width: 64rem)").matches) {
            handingOff.current = true;
            if (!remove.isPending) remove.reset();
            setSheet("memberships");
            return;
          }
          if (open) {
            handingOff.current = false;
            if (!remove.isPending) remove.reset();
          }
          setPopoverOpen(open);
        }}
      >
        <Popover.Trigger
          render={
            <Button
              ref={triggerRef}
              variant="secondary"
              className="max-w-full"
            />
          }
        >
          {collections.length > 0 ? (
            <Check size={15} aria-hidden="true" className="shrink-0" />
          ) : (
            <FolderPlus size={15} aria-hidden="true" className="shrink-0" />
          )}
          <span className="truncate">{label}</span>
          {!noMemberships ? (
            <ChevronDown
              size={14}
              aria-hidden="true"
              className="shrink-0 text-muted-foreground"
            />
          ) : null}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="bottom"
            align="end"
            sideOffset={6}
            collisionPadding={16}
            className="z-[70] outline-none"
          >
            <Popover.Popup
              finalFocus={() =>
                handingOff.current ? false : triggerRef.current
              }
              className={`${twUiSelectPopup} flex w-72 min-w-0 flex-col outline-none`}
            >
              <Popover.Title className="sr-only">Collections</Popover.Title>
              {membershipList}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <ResourceEditSheet
        open={sheet !== null}
        title={sheet === "add" ? "Add to collection" : "Collections"}
        description={
          sheet === "add"
            ? "Choose collections you own or can edit. Adding never changes this idea’s permissions."
            : "Open a collection or remove this idea from collections you manage."
        }
        dirty={selectionCount > 0}
        pending={adding}
        finalFocus={triggerRef}
        onClose={closeSheet}
      >
        {() =>
          sheet === "add" ? (
            <AddIdeaToCollectionsPanel
              key={sheet}
              ideaId={ideaId}
              onSelectionCountChange={setSelectionCount}
              onPendingChange={setAdding}
              onAdded={closeSheet}
            />
          ) : (
            membershipList
          )
        }
      </ResourceEditSheet>
    </>
  );
}
