import { Tooltip } from "@base-ui/react/tooltip";

type Person = { id: string; displayName: string; avatarUrl: string | null };
type CollaboratorRole = "Owner" | "Editor";

const MAX_VISIBLE_AVATARS = 4;

export function Avatar({
  person,
  size = "md",
  owner = false,
}: {
  person: Person;
  size?: "sm" | "md";
  owner?: boolean;
}) {
  const dimensions = size === "sm" ? "!size-7" : "!size-9";
  const ring = owner ? "ring-1 ring-primary" : "ring-1 ring-border";
  if (person.avatarUrl) {
    return (
      <img
        src={person.avatarUrl}
        alt=""
        width={size === "sm" ? 28 : 36}
        height={size === "sm" ? 28 : 36}
        className={`${dimensions} shrink-0 rounded-full border border-surface bg-surface object-cover ${ring}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${dimensions} grid shrink-0 place-items-center rounded-full border border-surface bg-surface-muted font-mono text-micro text-muted-foreground ${ring}`}
    >
      {person.displayName.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function CollectionCollaboratorAvatars({
  owner,
  editors,
  className = "",
}: {
  owner: Person;
  editors: Person[];
  className?: string;
}) {
  const people = [
    { person: owner, role: "Owner" as const },
    ...editors.map((person) => ({ person, role: "Editor" as const })),
  ];
  const visible = people.slice(0, MAX_VISIBLE_AVATARS);
  const hidden = people.slice(MAX_VISIBLE_AVATARS);

  return (
    <div
      className={`relative z-10 flex min-w-0 items-center ${className}`}
      aria-label={`People: ${people
        .map(({ person, role }) => `${role}: ${person.displayName}`)
        .join(", ")}`}
    >
      {visible.map(({ person, role }, index) => (
        <CollaboratorAvatarBadge
          key={person.id}
          person={person}
          role={role}
          overlap={index > 0}
        />
      ))}
      {hidden.length > 0 ? (
        <CollaboratorOverflowBadge
          people={hidden.map(({ person }) => person)}
        />
      ) : null}
    </div>
  );
}

function CollaboratorAvatarBadge({
  person,
  role,
  overlap,
}: {
  person: Person;
  role: CollaboratorRole;
  overlap: boolean;
}) {
  return (
    <span className={overlap ? "-ml-1.5" : ""}>
      <Tooltip.Root>
        <Tooltip.Trigger
          delay={300}
          className="grid size-8 cursor-pointer place-items-center rounded-full p-0.5 outline-none focus-visible:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring/45"
          aria-label={`${role}: ${person.displayName}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.blur();
          }}
        >
          <Avatar person={person} size="sm" owner={role === "Owner"} />
        </Tooltip.Trigger>
        <CollaboratorTooltip role={role} people={[person]} />
      </Tooltip.Root>
    </span>
  );
}

function CollaboratorOverflowBadge({ people }: { people: Person[] }) {
  return (
    <span className="-ml-1.5">
      <Tooltip.Root>
        <Tooltip.Trigger
          delay={300}
          className="grid size-8 cursor-pointer place-items-center rounded-full border border-surface bg-surface p-0.5 font-mono text-micro text-muted-foreground ring-1 ring-border outline-none focus-visible:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring/45"
          aria-label={`${people.length} more editor${people.length === 1 ? "" : "s"}`}
          onKeyDown={(event) => {
            if (event.key === "Escape") event.currentTarget.blur();
          }}
        >
          +{people.length}
        </Tooltip.Trigger>
        <CollaboratorTooltip role="Editor" people={people} />
      </Tooltip.Root>
    </span>
  );
}

function CollaboratorTooltip({
  role,
  people,
}: {
  role: CollaboratorRole;
  people: Person[];
}) {
  return (
    <Tooltip.Portal>
      <Tooltip.Positioner
        side="top"
        align="end"
        sideOffset={8}
        className="z-[70]"
      >
        <Tooltip.Popup className="pointer-events-none w-max max-w-[min(14rem,calc(100vw_-_2rem))] rounded-control border border-border-strong bg-surface-elevated px-2.5 py-2 text-left shadow-overlay transition-[opacity,transform] duration-(--duration-fast) data-[starting-style]:translate-y-1 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-1 data-[ending-style]:opacity-0 motion-reduce:transition-none">
          <span className="block font-mono text-micro uppercase tracking-wider text-muted-foreground">
            {role}
            {people.length > 1 ? "s" : ""}
          </span>
          <span className="mt-1 grid gap-0.5 text-caption text-foreground">
            {people.map((person) => (
              <span key={person.id} className="truncate">
                {person.displayName}
              </span>
            ))}
          </span>
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  );
}
