import type { IdeaListItem } from "../../api/ideas.js";

export type IdeaVisibility = IdeaListItem["visibility"];

export const IDEA_VISIBILITIES = ["PUBLIC", "UNLISTED", "PRIVATE"] as const;

export const IDEA_VISIBILITY_LABELS: Record<IdeaVisibility, string> = {
  PUBLIC: "Public",
  UNLISTED: "Unlisted",
  PRIVATE: "Private",
};

export const IDEA_VISIBILITY_OPTION_LABELS: Record<IdeaVisibility, string> = {
  PUBLIC: "Public — listed for everyone",
  UNLISTED: "Unlisted — anyone with the link",
  PRIVATE: "Private — only you",
};
