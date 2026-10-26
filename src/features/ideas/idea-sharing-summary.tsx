import { Link } from "@tanstack/react-router";
import {
  Folder,
  Globe,
  Link as LinkIcon,
  List,
  LockKeyhole,
} from "lucide-react";
import type { IdeaListItem } from "../../api/ideas.js";
import {
  IDEA_ACCESS_LABELS,
  IDEA_DISTRIBUTION_LABELS,
  type IdeaAccess,
  type IdeaDistribution,
} from "./idea-sharing.js";

export function IdeaAudienceLabel({ access }: { access: IdeaAccess }) {
  const Icon = access === "PRIVATE" ? LockKeyhole : Globe;
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      {IDEA_ACCESS_LABELS[access]}
    </span>
  );
}

const distributionIcons = {
  LISTED: List,
  COLLECTIONS_ONLY: Folder,
  UNLISTED: LinkIcon,
};

export function IdeaDistributionLabel({
  distribution,
}: {
  distribution: IdeaDistribution;
}) {
  const Icon = distributionIcons[distribution];
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <Icon
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground"
      />
      {IDEA_DISTRIBUTION_LABELS[distribution]}
    </span>
  );
}

export function IdeaSharingSummary({
  idea,
  isOwner,
}: {
  idea: Pick<IdeaListItem, "id" | "title" | "access" | "distribution">;
  isOwner: boolean;
}) {
  const summary = (
    <>
      <IdeaAudienceLabel access={idea.access} />
      {idea.access === "PUBLIC" ? (
        <>
          <span aria-hidden="true">·</span>
          <span>{IDEA_DISTRIBUTION_LABELS[idea.distribution]}</span>
        </>
      ) : null}
    </>
  );
  const className =
    "inline-flex min-h-11 min-w-0 max-w-full flex-wrap items-center gap-1.5 rounded-control text-caption text-muted-foreground";
  return isOwner ? (
    <Link
      to="/ideas/$ideaId/edit"
      params={{ ideaId: idea.id }}
      aria-label={`Edit sharing for ${idea.title}: ${IDEA_ACCESS_LABELS[idea.access]}${idea.access === "PUBLIC" ? `, ${IDEA_DISTRIBUTION_LABELS[idea.distribution]}` : ""}`}
      className={`${className} hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ring`}
    >
      {summary}
    </Link>
  ) : (
    <span className={className}>{summary}</span>
  );
}
