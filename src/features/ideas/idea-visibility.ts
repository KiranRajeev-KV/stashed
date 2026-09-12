import type { IdeaListItem } from "../../api/ideas.js";

export type IdeaVisibility = IdeaListItem["visibility"];

export const IDEA_VISIBILITIES = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;

export const IDEA_VISIBILITY_LABELS: Record<IdeaVisibility, string> = {
  PUBLIC: "Public",
  UNLISTED: "Unlisted",
  PRIVATE: "Private",
};
