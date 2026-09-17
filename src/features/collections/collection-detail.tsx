import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from "@tanstack/react-query";
import { Link, getRouteApi } from "@tanstack/react-router";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Pencil,
  Plus,
  X,
} from "lucide-react";
import { useState } from "react";

import { currentUserQueryOptions } from "../../api/auth.js";
import { ApiClientError } from "../../api/client.js";
import {
  collectionIdeasQueryOptions,
  collectionQueryKey,
  collectionQueryOptions,
  removeCollectionIdea,
  updateCollection,
  type CollectionIdeasResponse,
  type CreateCollectionInput,
  type UpdateCollectionInput,
} from "../../api/collections.js";
import { buttonStyles } from "../../components/ui/button-variants.js";
import { Button } from "../../components/ui/button.js";
import {
  BreadcrumbCurrent,
  BreadcrumbItem,
  BreadcrumbLink,
  Breadcrumbs,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb.js";
import { CopyLinkButton } from "../../components/ui/copy-link-button.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { ArchiveSearchField } from "../../components/ui/archive-search-field.js";
import { SearchResultsTransition } from "../../components/ui/search-transition.js";
import {
  archiveSortOptions,
  type ArchiveSort,
} from "../../components/ui/archive-sort-options.js";
import { MobileChoiceDrawer } from "../../components/ui/mobile-choice-drawer.js";
import { MobileFilterDrawer } from "../../components/ui/mobile-filter-drawer.js";
import { ResourceEditSheet } from "../../components/ui/resource-edit-sheet.js";
import { ResourcePageToolbar } from "../../components/ui/resource-page-toolbar.js";
import { PageState } from "../../components/states/page-state.js";
import {
  twArchiveFilters,
  twIdeaEmptyState,
} from "../../styles/archive-styles.js";
import {
  twIdeaReader,
  twIdeaReaderAuthor,
  twIdeaReaderProperties,
} from "../../styles/idea-page-styles.js";
import {
  twCollectionHero,
  twCollectionHeroMain,
  twCollectionIconTile,
  twCollectionSettingsTab,
  twCollectionSettingsTabs,
  twCollectionSidebar,
} from "../../styles/collection-styles.js";
import { IdeaCard } from "../ideas/idea-card.js";
import { IdeaGrid } from "../ideas/idea-grid.js";
import {
  StatusChoiceFilter,
  StatusFilter,
  VisibilityFilter,
} from "../ideas/idea-filter-controls.js";
import { SortSelect } from "../ideas/sort-select.js";
import { VisibilityIcon } from "../ideas/visibility-icon.js";
import type { IdeaStatus } from "../../api/ideas.js";
import type { IdeaVisibility } from "../ideas/idea-visibility.js";
import {
  IdeasErrorState,
  IdeasFeedSkeleton,
} from "../ideas/ideas-feed-states.js";
import { CollectionIdeaManager } from "./collection-idea-manager.js";
import { CollectionAccessManager } from "./collection-access-manager.js";
import { CollectionForm } from "./collection-form.js";
import { CollectionIcon } from "./collection-icon.js";
import { DeleteCollectionDialog } from "./delete-collection-dialog.js";
import { CollectionCollaboratorAvatars } from "./collaborator-avatars.js";

const routeApi = getRouteApi("/collections/$collectionId");
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});
const filterFieldClass = "grid min-w-0 gap-2";
const filterLabelClass =
  "font-mono text-xs uppercase tracking-wider text-muted-foreground";

type CollectionIdeaFilterValues = {
  status?: IdeaStatus;
  visibility?: IdeaVisibility;
};

function collectionIdeaFilterCount(filters: CollectionIdeaFilterValues) {
  return Number(Boolean(filters.status)) + Number(Boolean(filters.visibility));
}

function MobileCollectionIdeaFilters({
  filters,
  onApply,
}: {
  filters: CollectionIdeaFilterValues;
  onApply: (filters: CollectionIdeaFilterValues) => void;
}) {
  const [draft, setDraft] = useState(filters);
  const count = collectionIdeaFilterCount(filters);

  return (
    <MobileFilterDrawer
      activeCount={count}
      closeLabel="Close collection filters"
      description="Narrow the ideas shown in this collection."
      title="Filter collection ideas"
      triggerSummary={
        count > 0
          ? `${count} ${count === 1 ? "filter" : "filters"} active`
          : "All ideas"
      }
      onOpenChange={(open) => {
        if (open) setDraft(filters);
      }}
      onClear={() => setDraft({})}
      onApply={() => onApply(draft)}
    >
      <StatusChoiceFilter
        className={filterFieldClass}
        label="Status"
        labelClassName={filterLabelClass}
        value={draft.status}
        onValueChange={(status) =>
          setDraft((current) => ({ ...current, status }))
        }
      />
      <VisibilityFilter
        className={filterFieldClass}
        label="Visibility"
        labelClassName={filterLabelClass}
        value={draft.visibility}
        onValueChange={(visibility) =>
          setDraft((current) => ({ ...current, visibility }))
        }
      />
    </MobileFilterDrawer>
  );
}

export function CollectionDetail() {
  const { collectionId } = routeApi.useParams();
  const search = routeApi.useSearch();
  const routeNavigate = routeApi.useNavigate();
  const queryClient = useQueryClient();
  const session = useQuery(currentUserQueryOptions());
  const collectionQuery = useQuery(collectionQueryOptions(collectionId));
  const ideasQuery = useQuery(
    collectionIdeasQueryOptions(collectionId, search),
  );
  const [panel, setPanel] = useState<"settings" | "ideas" | null>(null);
  const [settingsTab, setSettingsTab] = useState<"details" | "access">(
    "details",
  );
  const [editDirty, setEditDirty] = useState(false);

  const edit = useMutation({
    mutationFn: (values: UpdateCollectionInput) =>
      updateCollection(collectionId, values),
    onSuccess: async () => {
      setEditDirty(false);
      setPanel(null);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: collectionQueryKey(collectionId),
        }),
        queryClient.invalidateQueries({ queryKey: ["collections"] }),
      ]);
    },
  });
  const remove = useMutation({
    mutationFn: (ideaId: string) => removeCollectionIdea(collectionId, ideaId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["collection", collectionId, "ideas"],
        }),
        queryClient.invalidateQueries({
          queryKey: collectionQueryKey(collectionId),
        }),
        queryClient.invalidateQueries({ queryKey: ["collections"] }),
      ]);
    },
  });

  if (collectionQuery.isPending) {
    return (
      <div
        className="h-80 animate-pulse rounded-card border border-border bg-surface-muted motion-reduce:animate-none"
        aria-label="Loading collection"
      />
    );
  }
  if (collectionQuery.isError) {
    const notFound =
      collectionQuery.error instanceof ApiClientError &&
      collectionQuery.error.status === 404;
    return (
      <PageState
        role="alert"
        label="Collection unavailable"
        title={
          notFound
            ? "This collection cannot be found."
            : "The collection could not be opened."
        }
        description={collectionQuery.error.message}
        actions={
          <>
            <Link to="/collections" className={buttonStyles()}>
              Browse collections
            </Link>
            {!notFound ? (
              <Button onClick={() => collectionQuery.refetch()}>
                Try again
              </Button>
            ) : null}
          </>
        }
      />
    );
  }
  const collection = collectionQuery.data;

  return (
    <article className={twIdeaReader}>
      <ResourcePageToolbar
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem>
              <BreadcrumbLink>
                <Link to="/collections">Collections</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbCurrent>{collection.name}</BreadcrumbCurrent>
            </BreadcrumbItem>
          </Breadcrumbs>
        }
        actions={
          <>
            <CopyLinkButton
              isPrivate={collection.visibility === "PRIVATE"}
              subject="collection"
            />
            {collection.capabilities.editMetadata ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSettingsTab("details");
                  setPanel(panel === "settings" ? null : "settings");
                }}
                aria-pressed={panel === "settings"}
              >
                <Pencil size={15} />
                Edit
              </Button>
            ) : null}
            {collection.capabilities.manageIdeas ? (
              <Button
                variant="primary"
                onClick={() => setPanel("ideas")}
                aria-pressed={panel === "ideas"}
              >
                <Plus size={15} />
                Manage ideas
              </Button>
            ) : null}
          </>
        }
      />

      <header className={twCollectionHero}>
        <div className={twCollectionHeroMain}>
          <div className="flex min-w-0 items-start gap-4">
            <span className={`${twCollectionIconTile} mt-1 size-12`}>
              <CollectionIcon icon={collection.icon} className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="m-0 font-display text-idea-title font-normal text-pretty wrap-anywhere">
                {collection.name}
              </h1>
              <div className={twIdeaReaderAuthor}>
                <CollectionCollaboratorAvatars
                  owner={collection.owner}
                  editors={collection.editors}
                />
              </div>
            </div>
          </div>
          <p className="mt-7 max-w-[var(--layout-reading)] whitespace-pre-wrap text-body leading-reading text-muted-foreground">
            {collection.description || "No description has been added yet."}
          </p>
        </div>
        <aside className={twCollectionSidebar} aria-label="Collection details">
          <h2 className="mb-3 text-caption font-medium text-muted-foreground">
            Details
          </h2>
          <dl className={twIdeaReaderProperties}>
            <div>
              <dt>Visibility</dt>
              <dd className="inline-flex items-center gap-1.5 capitalize">
                <VisibilityIcon
                  visibility={collection.visibility}
                  className="size-3.5 text-muted-foreground"
                />
                {collection.visibility.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt>Ideas</dt>
              <dd>{collection.visibleIdeaCount} visible</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>
                <time dateTime={collection.createdAt}>
                  {dateFormatter.format(new Date(collection.createdAt))}
                </time>
              </dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>
                <time dateTime={collection.updatedAt}>
                  {dateFormatter.format(new Date(collection.updatedAt))}
                </time>
              </dd>
            </div>
          </dl>
        </aside>
      </header>

      <ResourceEditSheet
        open={panel === "settings"}
        title="Collection settings"
        description="Update this collection’s identity and access level."
        dirty={editDirty}
        pending={edit.isPending}
        onClose={() => {
          setEditDirty(false);
          setPanel(null);
        }}
      >
        {({ requestClose, selectPortalContainer }) => (
          <div className="flex min-h-0 flex-1 flex-col">
            {collection.capabilities.manageCollaborators ? (
              <div
                role="tablist"
                aria-label="Collection settings"
                className={twCollectionSettingsTabs}
              >
                <button
                  type="button"
                  role="tab"
                  id="collection-settings-details-tab"
                  aria-selected={settingsTab === "details"}
                  aria-controls="collection-settings-details"
                  className={twCollectionSettingsTab}
                  onClick={() => setSettingsTab("details")}
                >
                  Details
                </button>
                <button
                  type="button"
                  role="tab"
                  id="collection-settings-access-tab"
                  aria-selected={settingsTab === "access"}
                  aria-controls="collection-settings-access"
                  className={twCollectionSettingsTab}
                  onClick={() => setSettingsTab("access")}
                >
                  Access
                </button>
              </div>
            ) : null}

            <CollectionForm
              mode="edit"
              sheet
              id={
                collection.capabilities.manageCollaborators
                  ? "collection-settings-details"
                  : undefined
              }
              labelledBy={
                collection.capabilities.manageCollaborators
                  ? "collection-settings-details-tab"
                  : undefined
              }
              hidden={
                collection.capabilities.manageCollaborators &&
                settingsTab !== "details"
              }
              initialValues={{
                name: collection.name,
                description: collection.description,
                icon: collection.icon as Required<CreateCollectionInput>["icon"],
                visibility: collection.visibility,
              }}
              canChangeVisibility={collection.capabilities.changeVisibility}
              error={edit.error?.message}
              onCancel={requestClose}
              onDirtyChange={setEditDirty}
              selectPortalContainer={selectPortalContainer}
              additionalContent={
                collection.capabilities.deleteCollection ? (
                  <div>
                    <p className="mb-1 text-caption font-medium text-danger">
                      Danger zone
                    </p>
                    <p className="mb-3 text-caption leading-relaxed text-muted-foreground">
                      Deleting this collection removes its memberships, never
                      the Ideas themselves.
                    </p>
                    <DeleteCollectionDialog
                      collectionId={collection.id}
                      collectionName={collection.name}
                    />
                  </div>
                ) : null
              }
              onSubmit={async (values) => {
                const { visibility, ...metadata } = values;
                await edit.mutateAsync(
                  collection.capabilities.changeVisibility
                    ? { ...metadata, visibility }
                    : metadata,
                );
              }}
            />

            {collection.capabilities.manageCollaborators ? (
              <div
                id="collection-settings-access"
                role="tabpanel"
                aria-labelledby="collection-settings-access-tab"
                hidden={settingsTab !== "access"}
                className="flex min-h-0 flex-1 flex-col"
              >
                <CollectionAccessManager
                  collectionId={collection.id}
                  owner={collection.owner}
                  visibility={collection.visibility}
                  selectPortalContainer={selectPortalContainer}
                  onChangeVisibility={() => setSettingsTab("details")}
                />
              </div>
            ) : null}
          </div>
        )}
      </ResourceEditSheet>

      <ResourceEditSheet
        open={panel === "ideas"}
        size="wide"
        title="Manage ideas"
        description="Add accessible Ideas or remove visible Ideas from this collection."
        onClose={() => setPanel(null)}
      >
        {() => (
          <CollectionIdeaManager
            collectionId={collectionId}
            collectionVisibility={collection.visibility}
            visibleIdeaCount={collection.visibleIdeaCount}
          />
        )}
      </ResourceEditSheet>

      <section className="mt-10" aria-label="Collection ideas">
        <div className={`${twArchiveFilters} mt-5`}>
          <ArchiveSearchField
            id="collection-ideas-search"
            label="Search this collection"
            value={search.q}
            isSearching={ideasQuery.isFetching}
            placeholder="Search this collection…"
            description="Searches ideas in this collection. Results update automatically as you type."
            onValueChange={(q) =>
              routeNavigate({
                replace: true,
                search: (old) => ({
                  ...old,
                  q,
                  offset: undefined,
                }),
              })
            }
          />
          <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
            <MobileCollectionIdeaFilters
              filters={{ status: search.status, visibility: search.visibility }}
              onApply={(filters) =>
                routeNavigate({
                  search: (old) => ({
                    ...old,
                    ...filters,
                    offset: undefined,
                  }),
                })
              }
            />
            <MobileChoiceDrawer
              closeLabel="Close sorting options"
              description="Choose how ideas in this collection are ordered."
              options={archiveSortOptions}
              selectedLabel={
                archiveSortOptions.find(
                  (option) => option.value === (search.sort ?? "UPDATED_DESC"),
                )?.label ?? "Recently updated"
              }
              title="Sort collection ideas"
              triggerIcon={<ArrowUpDown className="size-4" />}
              triggerLabel="Sort"
              value={(search.sort ?? "UPDATED_DESC") as ArchiveSort}
              onValueChange={(sort) =>
                routeNavigate({
                  search: (old) => ({
                    ...old,
                    sort: sort === "UPDATED_DESC" ? undefined : sort,
                    offset: undefined,
                  }),
                })
              }
            />
          </div>
          <div className="mt-5 hidden items-start gap-4 lg:grid lg:grid-cols-[minmax(0,12rem)_minmax(0,22rem)_minmax(0,1fr)_minmax(0,14rem)]">
            <StatusFilter
              className={filterFieldClass}
              label="Status"
              labelClassName={filterLabelClass}
              value={search.status}
              onValueChange={(status) =>
                routeNavigate({
                  search: (old) => ({
                    ...old,
                    status,
                    offset: undefined,
                  }),
                })
              }
            />
            <VisibilityFilter
              className={filterFieldClass}
              label="Visibility"
              labelClassName={filterLabelClass}
              value={search.visibility}
              onValueChange={(visibility) =>
                routeNavigate({
                  search: (old) => ({
                    ...old,
                    visibility,
                    offset: undefined,
                  }),
                })
              }
            />
            <div className="min-w-0 border-l border-border pl-4 lg:col-start-4">
              <SortSelect
                className={filterFieldClass}
                labelClassName={filterLabelClass}
                options={archiveSortOptions}
                value={search.sort ?? "UPDATED_DESC"}
                onValueChange={(sort) =>
                  routeNavigate({
                    search: (old) => ({
                      ...old,
                      sort: sort as typeof old.sort,
                      offset: undefined,
                    }),
                  })
                }
              />
            </div>
          </div>
          {search.q || search.status || search.visibility ? (
            <div className="mt-3 hidden justify-end border-t border-border-subtle pt-3 lg:flex">
              <Button
                variant="ghost"
                onClick={() =>
                  routeNavigate({
                    replace: true,
                    search: (old) => ({ sort: old.sort }),
                  })
                }
              >
                Clear filters
              </Button>
            </div>
          ) : null}
        </div>
        <SearchResultsTransition
          active={ideasQuery.isFetching}
          hasPreviousResults={ideasQuery.data !== undefined}
          label="Updating collection Ideas"
        >
          <CollectionIdeas
            canManage={collection.capabilities.manageIdeas}
            currentUserId={session.data?.id}
            filtered={Boolean(search.q || search.status || search.visibility)}
            ideasQuery={ideasQuery}
            onAdd={() => setPanel("ideas")}
            onRemove={(ideaId) => remove.mutate(ideaId)}
            onPageChange={(offset) =>
              routeNavigate({
                replace: true,
                search: (old) => ({ ...old, offset: String(offset) }),
              })
            }
            removeError={remove.error?.message}
            removingId={remove.isPending ? remove.variables : undefined}
          />
        </SearchResultsTransition>
      </section>
    </article>
  );
}

function CollectionIdeas({
  canManage,
  currentUserId,
  filtered,
  ideasQuery,
  onAdd,
  onRemove,
  onPageChange,
  removeError,
  removingId,
}: {
  canManage: boolean;
  currentUserId?: string;
  filtered: boolean;
  ideasQuery: UseQueryResult<CollectionIdeasResponse, Error>;
  onAdd: () => void;
  onRemove: (ideaId: string) => void;
  onPageChange: (offset: number) => void;
  removeError?: string;
  removingId?: string;
}) {
  if (ideasQuery.isPending)
    return (
      <div className="mt-7">
        <IdeasFeedSkeleton />
      </div>
    );
  if (ideasQuery.isError)
    return (
      <div className="mt-7">
        <IdeasErrorState
          message={ideasQuery.error.message}
          onRetry={() => ideasQuery.refetch()}
        />
      </div>
    );
  if (ideasQuery.data.ideas.length === 0)
    return (
      <section className={`${twIdeaEmptyState} mt-7`}>
        <FolderKanban
          className="mx-auto mb-5 box-content size-6 rounded-dialog bg-surface-muted p-4 text-primary [transform:rotate(-5deg)]"
          aria-hidden="true"
        />
        <p className="font-mono text-label uppercase text-accent">
          {filtered ? "No match" : "Nothing gathered yet"}
        </p>
        <h2 className="mt-3 font-display text-3xl font-normal tracking-tight">
          {filtered
            ? "No visible ideas match these filters."
            : "There are no visible ideas here yet."}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {filtered
            ? "Clear the filters to return to every Idea you can see in this collection."
            : "Counts and results include only Ideas you are independently allowed to see."}
        </p>
        {filtered ? null : canManage ? (
          <Button className="mt-6" variant="primary" onClick={onAdd}>
            <Plus size={15} />
            Add ideas
          </Button>
        ) : null}
      </section>
    );
  return (
    <div className="mt-7">
      <IdeaGrid>
        {ideasQuery.data.ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            currentUserId={currentUserId}
            footerAction={
              canManage ? (
                <Button
                  variant="ghost"
                  disabled={Boolean(removingId)}
                  loading={removingId === idea.id}
                  loadingLabel="Removing…"
                  onClick={() => onRemove(idea.id)}
                >
                  <X size={14} />
                  Remove
                </Button>
              ) : undefined
            }
          />
        ))}
      </IdeaGrid>
      <ActionFeedback
        className="mt-3"
        state={removeError ? "error" : removingId ? "pending" : "idle"}
      >
        {removeError
          ? `Couldn’t remove the Idea. ${removeError} The collection is unchanged.`
          : removingId
            ? "Removing Idea from collection…"
            : null}
      </ActionFeedback>
      {ideasQuery.data.offset > 0 || ideasQuery.data.nextOffset !== null ? (
        <nav
          className="mt-6 flex items-center justify-between gap-3 border-t border-border-subtle pt-4"
          aria-label="Collection ideas pages"
        >
          <Button
            variant="ghost"
            disabled={ideasQuery.data.offset === 0}
            onClick={() =>
              onPageChange(
                Math.max(0, ideasQuery.data.offset - ideasQuery.data.limit),
              )
            }
          >
            <ChevronLeft size={15} aria-hidden="true" />
            Previous
          </Button>
          <span className="font-mono text-micro text-muted-foreground">
            {ideasQuery.data.offset + 1}–
            {ideasQuery.data.offset + ideasQuery.data.ideas.length} of{" "}
            {ideasQuery.data.visibleIdeaCount}
          </span>
          <Button
            variant="ghost"
            disabled={ideasQuery.data.nextOffset === null}
            onClick={() => {
              if (ideasQuery.data.nextOffset !== null)
                onPageChange(ideasQuery.data.nextOffset);
            }}
          >
            Next
            <ChevronRight size={15} aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
