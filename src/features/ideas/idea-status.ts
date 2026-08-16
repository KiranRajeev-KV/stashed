import type { IdeaStatus } from "../../api/ideas.js";

export const IDEA_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
] as const satisfies ReadonlyArray<IdeaStatus>;

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  PLANNED: "Planned",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};
