import type { IdeaListItem } from "../../api/ideas.js";

export type IdeaAccess = IdeaListItem["access"];
export type IdeaDistribution = IdeaListItem["distribution"];

export const IDEA_ACCESSES = [
  "PUBLIC",
  "PRIVATE",
] as const satisfies readonly IdeaAccess[];
export const IDEA_DISTRIBUTIONS = [
  "LISTED",
  "COLLECTIONS_ONLY",
  "UNLISTED",
] as const satisfies readonly IdeaDistribution[];

export const IDEA_ACCESS_LABELS: Record<IdeaAccess, string> = {
  PUBLIC: "Anyone",
  PRIVATE: "Only me",
};

export const IDEA_ACCESS_DESCRIPTIONS: Record<IdeaAccess, string> = {
  PUBLIC: "Anyone can open this idea with its link.",
  PRIVATE: "Only you can open this idea.",
};

export const IDEA_DISTRIBUTION_LABELS: Record<IdeaDistribution, string> = {
  LISTED: "Everywhere",
  COLLECTIONS_ONLY: "Collections only",
  UNLISTED: "Link only",
};

export const IDEA_DISTRIBUTION_DESCRIPTIONS: Record<IdeaDistribution, string> =
  {
    LISTED: "Eligible to appear in Ideas, search, tags, and collections.",
    COLLECTIONS_ONLY:
      "Can appear in collections. Hidden from Ideas, global search, and tag discovery.",
    UNLISTED:
      "Opened through its direct link. Hidden from Ideas, search, tags, and collections.",
  };

export const IDEA_PUBLIC_LINK_NOTE =
  "Anyone with the link can view this idea and share its link.";
export const IDEA_LINK_ONLY_MEMBERSHIP_NOTE =
  "Any existing collection placements will be hidden, not removed. They can reappear if you choose Everywhere or Collections only.";
