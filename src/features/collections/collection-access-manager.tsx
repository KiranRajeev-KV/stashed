import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Drawer } from "@base-ui/react/drawer";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Info, Search, Trash2, UserPlus, X } from "lucide-react";
import { useEffect, useState, type RefObject } from "react";

import {
  collaboratorsQueryOptions,
  removeCollectionCollaborator,
  setCollectionCollaborator,
} from "../../api/collections.js";
import { userSearchQueryOptions } from "../../api/users.js";
import { ActionFeedback } from "../../components/ui/action-feedback.js";
import { Button } from "../../components/ui/button.js";
import {
  SearchActivity,
  SearchResultsTransition,
} from "../../components/ui/search-transition.js";
import {
  Select,
  type SelectPortalContainer,
} from "../../components/ui/select.js";
import {
  twDeleteDialogActions,
  twDeleteDialogContent,
  twDeleteDialogDescription,
  twDeleteDialogOverlay,
  twDeleteDialogTitle,
  twUiDialogBackdrop,
  twUiDialogPanel,
} from "../../styles/dialogs-styles.js";
import {
  twCollectionField,
  twCollectionList,
  twCollectionListRow,
} from "../../styles/collection-styles.js";
import { VisibilityIcon } from "../ideas/visibility-icon.js";
import { Avatar } from "./collaborator-avatars.js";

type AccessRole = "EDITOR" | "VIEWER";
type CollectionVisibility = "PUBLIC" | "UNLISTED" | "PRIVATE";
type Person = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};
type Collaborator = Person & { role: AccessRole };

const roleOptions = [
  {
    value: "VIEWER",
    label: "Viewer",
    description: "Can view this collection.",
  },
  {
    value: "EDITOR",
    label: "Editor",
    description: "Can edit details and manage Ideas.",
  },
] as const;

const generalAccess = {
  PUBLIC: {
    label: "Public",
    description: "Anyone can discover and view this collection.",
  },
  UNLISTED: {
    label: "Unlisted",
    description: "Anyone with the link can view this collection.",
  },
  PRIVATE: {
    label: "Private",
    description: "Only people with direct access can view this collection.",
  },
} satisfies Record<
  CollectionVisibility,
  { label: string; description: string }
>;

/** Collection role policy stays here while the interaction pieces are reusable. */
export function CollectionAccessManager({
  collectionId,
  owner,
  visibility,
  onChangeVisibility,
  selectPortalContainer,
}: {
  collectionId: string;
  owner: Person;
  visibility: CollectionVisibility;
  onChangeVisibility: () => void;
  selectPortalContainer?: RefObject<HTMLDivElement | null>;
}) {
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<Person | null>(null);
  const [inviteRole, setInviteRole] = useState<AccessRole>("VIEWER");
  const [removeTarget, setRemoveTarget] = useState<Collaborator | null>(null);
  const queryClient = useQueryClient();
  const collaborators = useQuery(collaboratorsQueryOptions(collectionId));
  const users = useQuery(userSearchQueryOptions(query.trim()));
  const collaboratorIds = new Set([
    owner.id,
    ...(collaborators.data?.map((person) => person.id) ?? []),
  ]);
  const availableUsers =
    users.data?.filter((user) => !collaboratorIds.has(user.id)) ?? [];
  const hasQuery = query.trim().length >= 2;

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["collection", collectionId] }),
      queryClient.invalidateQueries({
        queryKey: ["collection", collectionId, "collaborators"],
      }),
      queryClient.invalidateQueries({ queryKey: ["collections"] }),
    ]);
  };
  const setRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AccessRole }) =>
      setCollectionCollaborator(collectionId, userId, role),
    onSuccess: refresh,
  });
  const add = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AccessRole }) =>
      setCollectionCollaborator(collectionId, userId, role),
    onSuccess: async () => {
      setSelectedUser(null);
      setQuery("");
      setInviteRole("VIEWER");
      await refresh();
    },
  });
  const remove = useMutation({
    mutationFn: (userId: string) =>
      removeCollectionCollaborator(collectionId, userId),
    onSuccess: async () => {
      setRemoveTarget(null);
      await refresh();
    },
  });
  const access = generalAccess[visibility];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
        <div className="grid gap-7">
          <section aria-labelledby="collection-general-access-title">
            <SectionHeading
              id="collection-general-access-title"
              title="General access"
              description="Who can open this collection without a direct role."
            />
            <div className="mt-3 flex min-w-0 items-center gap-3 rounded-control border border-border-subtle bg-surface-muted/45 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-control border border-border-subtle bg-surface text-muted-foreground">
                <VisibilityIcon visibility={visibility} className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-ui font-medium text-foreground">
                  {access.label}
                </p>
                <p className="mt-0.5 text-caption leading-relaxed text-muted-foreground">
                  {access.description}
                </p>
              </div>
              <Button variant="ghost" onClick={onChangeVisibility}>
                Change
              </Button>
            </div>
          </section>

          <section aria-labelledby="collection-add-access-title">
            <SectionHeading
              id="collection-add-access-title"
              title="Add people"
              description="Give a person direct access to this collection."
            />
            <div className="mt-3 grid gap-3">
              {selectedUser ? (
                <SelectedPerson
                  person={selectedUser}
                  role={inviteRole}
                  pending={add.isPending}
                  portalContainer={selectPortalContainer}
                  onClear={() => setSelectedUser(null)}
                  onRoleChange={setInviteRole}
                  onAdd={() =>
                    add.mutate({ userId: selectedUser.id, role: inviteRole })
                  }
                />
              ) : (
                <UserSearch
                  query={query}
                  users={availableUsers}
                  hasPreviousResults={users.data !== undefined}
                  loading={users.isFetching}
                  searched={hasQuery}
                  onQueryChange={setQuery}
                  onSelect={setSelectedUser}
                />
              )}
            </div>
          </section>

          <section aria-labelledby="collection-direct-access-title">
            <div className="flex items-end justify-between gap-4">
              <SectionHeading
                id="collection-direct-access-title"
                title="People with access"
                description="Direct roles are separate from this collection’s visibility."
              />
              <span className="shrink-0 font-mono text-micro text-muted-foreground">
                {(collaborators.data?.length ?? 0) + 1} people
              </span>
            </div>
            <div className={`${twCollectionList} mt-3`}>
              <OwnerRow owner={owner} />
              {collaborators.data?.map((person) => (
                <CollaboratorRow
                  key={person.id}
                  person={person}
                  pending={
                    (setRole.isPending &&
                      setRole.variables?.userId === person.id) ||
                    (remove.isPending && remove.variables === person.id)
                  }
                  portalContainer={selectPortalContainer}
                  onRoleChange={(role) =>
                    setRole.mutate({ userId: person.id, role })
                  }
                  onRemove={() => setRemoveTarget(person)}
                />
              ))}
            </div>
          </section>

          <div className="flex gap-2.5 rounded-control border border-border-subtle bg-surface-muted/35 px-3 py-3 text-caption leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              Collection roles never grant access to restricted Ideas or
              permission to edit an Idea. People are not notified when access
              changes.
            </p>
          </div>
          <ActionFeedback
            state={
              setRole.isError || add.isError || remove.isError
                ? "error"
                : setRole.isPending || add.isPending || remove.isPending
                  ? "pending"
                  : setRole.isSuccess || add.isSuccess || remove.isSuccess
                    ? "success"
                    : "idle"
            }
          >
            {setRole.isError || add.isError || remove.isError
              ? `Couldn’t update access. ${setRole.error?.message ?? add.error?.message ?? remove.error?.message}`
              : setRole.isPending || add.isPending || remove.isPending
                ? "Updating access…"
                : setRole.isSuccess || add.isSuccess || remove.isSuccess
                  ? "Access updated."
                  : null}
          </ActionFeedback>
        </div>
      </div>

      <RemoveAccessDialog
        person={removeTarget}
        pending={remove.isPending}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setRemoveTarget(null);
        }}
        onRemove={() => removeTarget && remove.mutate(removeTarget.id)}
      />
    </div>
  );
}

function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="min-w-0">
      <h2 id={id} className="text-ui font-medium text-foreground">
        {title}
      </h2>
      <p className="mt-1 text-caption leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function UserSearch({
  query,
  users,
  loading,
  hasPreviousResults,
  searched,
  onQueryChange,
  onSelect,
}: {
  query: string;
  users: Person[];
  loading: boolean;
  hasPreviousResults: boolean;
  searched: boolean;
  onQueryChange: (query: string) => void;
  onSelect: (person: Person) => void;
}) {
  return (
    <div className="grid gap-2">
      <label className={twCollectionField}>
        <Search
          size={16}
          aria-hidden="true"
          className="shrink-0 text-muted-foreground"
        />
        <span className="sr-only">Find a person</span>
        <input
          autoComplete="off"
          value={query}
          onChange={(event) => onQueryChange(event.currentTarget.value)}
          className="min-w-0 flex-1 bg-transparent text-ui outline-none placeholder:text-muted-foreground"
          placeholder="Search name or GitHub username"
        />
        <SearchActivity active={loading && searched} label="Searching people" />
      </label>
      <SearchResultsTransition
        active={loading && searched}
        hasPreviousResults={hasPreviousResults}
        label="Updating people"
      >
        {searched ? (
          users.length > 0 ? (
            <div
              className={twCollectionList}
              aria-label="People matching search"
            >
              {users.map((person) => (
                <Button
                  key={person.id}
                  variant="ghost"
                  className="h-auto w-full justify-start rounded-none border-0 px-3 py-2.5 text-left first:rounded-t-control last:rounded-b-control"
                  onClick={() => onSelect(person)}
                >
                  <Avatar person={person} size="sm" />
                  <PersonIdentity person={person} />
                  <UserPlus
                    className="ml-auto size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Button>
              ))}
            </div>
          ) : !loading ? (
            <p className="px-1 text-caption text-muted-foreground">
              No people found, or everyone matching already has access.
            </p>
          ) : null
        ) : (
          <p className="px-1 text-caption text-muted-foreground">
            Start typing to search people.
          </p>
        )}
      </SearchResultsTransition>
    </div>
  );
}

function SelectedPerson({
  person,
  role,
  pending,
  portalContainer,
  onClear,
  onRoleChange,
  onAdd,
}: {
  person: Person;
  role: AccessRole;
  pending: boolean;
  portalContainer?: SelectPortalContainer;
  onClear: () => void;
  onRoleChange: (role: AccessRole) => void;
  onAdd: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-control border border-border-subtle bg-surface-muted/35 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar person={person} size="sm" />
        <PersonIdentity person={person} />
        <Button
          size="icon"
          variant="ghost"
          disabled={pending}
          onClick={onClear}
          aria-label={`Choose someone other than ${person.displayName}`}
        >
          <X size={15} aria-hidden="true" />
        </Button>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <Select
          label="Access role"
          value={role}
          options={roleOptions}
          disabled={pending}
          modal={false}
          portalContainer={portalContainer}
          onValueChange={onRoleChange}
        />
        <Button
          variant="primary"
          loading={pending}
          loadingLabel="Adding…"
          onClick={onAdd}
        >
          Add access
        </Button>
      </div>
    </div>
  );
}

function OwnerRow({ owner }: { owner: Person }) {
  return (
    <div className={`${twCollectionListRow} flex-nowrap`}>
      <Avatar person={owner} size="sm" owner />
      <PersonIdentity className="flex-1" person={owner} />
      <span className="ml-auto inline-flex min-h-8 items-center rounded-full border border-primary/30 bg-primary/8 px-2.5 text-metadata font-medium text-primary">
        Owner
      </span>
    </div>
  );
}

function CollaboratorRow({
  person,
  pending,
  portalContainer,
  onRoleChange,
  onRemove,
}: {
  person: Collaborator;
  pending: boolean;
  portalContainer?: SelectPortalContainer;
  onRoleChange: (role: AccessRole) => void;
  onRemove: () => void;
}) {
  return (
    <div className={`${twCollectionListRow} flex-nowrap`}>
      <Avatar person={person} size="sm" />
      <PersonIdentity className="flex-1" person={person} />
      <div className="ml-auto hidden shrink-0 items-center gap-1 lg:flex">
        <Select
          className="w-27"
          disabled={pending}
          label={`Role for ${person.displayName}`}
          modal={false}
          options={roleOptions}
          portalContainer={portalContainer}
          positionerProps={{ align: "end" }}
          value={person.role}
          variant="compact"
          onValueChange={onRoleChange}
        />
        <Button
          size="icon"
          variant="ghost"
          disabled={pending}
          onClick={onRemove}
          aria-label={`Remove ${person.displayName}’s access`}
        >
          <Trash2 size={15} aria-hidden="true" />
        </Button>
      </div>
      <div className="ml-auto shrink-0 lg:hidden">
        <MobileCollaboratorActions
          person={person}
          pending={pending}
          onRemove={onRemove}
          onRoleChange={onRoleChange}
        />
      </div>
    </div>
  );
}

function PersonIdentity({
  person,
  className = "",
}: {
  person: Person;
  className?: string;
}) {
  return (
    <span className={`grid min-w-0 gap-0.5 text-left ${className}`}>
      <span className="truncate text-ui font-medium text-foreground">
        {person.displayName}
      </span>
      {person.username ? (
        <span className="truncate text-caption text-muted-foreground">
          @{person.username}
        </span>
      ) : null}
    </span>
  );
}

/** A concise mobile role control: role changes and revocation stay together. */
function MobileCollaboratorActions({
  person,
  pending,
  onRoleChange,
  onRemove,
}: {
  person: Collaborator;
  pending: boolean;
  onRoleChange: (role: AccessRole) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 64rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const updateRole = (role: AccessRole) => {
    setOpen(false);
    onRoleChange(role);
  };

  const requestRemoval = () => {
    setOpen(false);
    window.requestAnimationFrame(onRemove);
  };

  return (
    <Drawer.Root open={open} onOpenChange={setOpen}>
      <Drawer.Trigger
        disabled={pending}
        className="inline-flex min-h-9 min-w-22 items-center justify-center gap-1.5 rounded-control border border-border bg-surface px-2.5 text-metadata font-medium text-foreground shadow-control transition-colors duration-(--duration-fast) hover:border-border-strong hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
        aria-label={`Manage ${person.displayName}’s ${person.role.toLowerCase()} access`}
      >
        {roleOptions.find((option) => option.value === person.role)?.label}
        <ChevronDown
          className="size-3.5 text-muted-foreground"
          aria-hidden="true"
        />
      </Drawer.Trigger>
      <Drawer.Portal>
        <Drawer.Backdrop
          className={`${twUiDialogBackdrop} fixed inset-0 z-[79] bg-foreground/35 opacity-100 backdrop-blur-[2px] transition-opacity duration-(--duration-standard) data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none`}
        />
        <Drawer.Viewport className="fixed inset-0 z-[80] flex items-end justify-center">
          <Drawer.Popup className="flex max-h-[min(76dvh,30rem)] w-full translate-y-[var(--drawer-swipe-movement-y)] flex-col overflow-hidden rounded-t-dialog border border-b-0 border-border bg-surface-elevated text-foreground shadow-dialog transition-transform duration-(--duration-slow) ease-emphasized data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full data-[swiping]:select-none motion-reduce:transition-none sm:max-w-xl">
            <div className="grid shrink-0 gap-4 border-b border-border px-4 pb-4 pt-2">
              <div
                className="mx-auto h-1 w-11 rounded-full bg-border-strong"
                aria-hidden="true"
              />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Drawer.Title className="text-ui font-medium">
                    {person.displayName}
                  </Drawer.Title>
                  <Drawer.Description className="mt-1 text-caption leading-relaxed text-muted-foreground">
                    Choose this person’s direct access role.
                  </Drawer.Description>
                </div>
                <Drawer.Close
                  className="grid size-11 shrink-0 place-items-center rounded-control text-muted-foreground transition-colors duration-(--duration-fast) hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none"
                  aria-label={`Close ${person.displayName} access actions`}
                >
                  <X className="size-5" aria-hidden="true" />
                </Drawer.Close>
              </div>
            </div>
            <Drawer.Content className="min-h-0 overflow-y-auto overscroll-contain p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
              <div className="grid gap-1" data-base-ui-swipe-ignore>
                {roleOptions.map((option) => {
                  const selected = option.value === person.role;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      disabled={pending}
                      className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-control px-3 py-2 text-left transition-colors duration-(--duration-fast) hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring aria-pressed:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
                      onClick={() => updateRole(option.value)}
                    >
                      <span className="min-w-0">
                        <span className="block text-ui font-medium text-foreground">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-caption leading-relaxed text-muted-foreground">
                          {option.description}
                        </span>
                      </span>
                      {selected ? (
                        <span
                          className="text-primary"
                          aria-label="Current role"
                        >
                          ✓
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </Drawer.Content>
            <div className="shrink-0 border-t border-border bg-surface-elevated p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
              <Button
                variant="ghost"
                className="w-full justify-start text-danger hover:bg-danger/10 hover:text-danger"
                disabled={pending}
                onClick={requestRemoval}
              >
                <Trash2 size={16} aria-hidden="true" />
                Remove access
              </Button>
            </div>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function RemoveAccessDialog({
  person,
  pending,
  onOpenChange,
  onRemove,
}: {
  person: Collaborator | null;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
}) {
  return (
    <AlertDialog.Root open={Boolean(person)} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className={`${twDeleteDialogOverlay} ${twUiDialogBackdrop} z-[89]`}
        />
        <AlertDialog.Content
          className={`${twDeleteDialogContent} ${twUiDialogPanel} z-[90]`}
          onEscapeKeyDown={(event) => {
            if (pending) event.preventDefault();
          }}
        >
          <AlertDialog.Title className={twDeleteDialogTitle}>
            Remove access?
          </AlertDialog.Title>
          <AlertDialog.Description className={twDeleteDialogDescription}>
            {person ? (
              <>
                <span>
                  {person.displayName} will no longer have a direct role on this
                  collection.
                </span>
                <span>
                  They may still be able to view it if its visibility allows
                  that.
                </span>
              </>
            ) : null}
          </AlertDialog.Description>
          <div className={twDeleteDialogActions}>
            <AlertDialog.Cancel asChild>
              <Button disabled={pending}>Cancel</Button>
            </AlertDialog.Cancel>
            <Button
              variant="destructive"
              loading={pending}
              loadingLabel="Removing…"
              onClick={onRemove}
            >
              <Trash2 size={16} aria-hidden="true" />
              Remove access
            </Button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
