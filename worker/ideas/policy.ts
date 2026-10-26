import { and, eq, or, type SQL } from "drizzle-orm";

import { ideas, type IdeaAccess, type IdeaDistribution } from "../db/schema.js";

/** Every read surface has an explicit rule; unknown surfaces deny by default. */
export type IdeaSurface =
  | "DETAIL"
  | "ARCHIVE"
  | "GLOBAL_SEARCH"
  | "COLLECTION"
  | "TAG_DISCOVERY"
  | "OWNER_MANAGEMENT";

export type IdeaScope = "DISCOVER" | "MINE";

/**
 * Collection roles never change idea authorization. For each PUBLIC,
 * UNLISTED, or PRIVATE collection, first require container access:
 * anyone may open PUBLIC/UNLISTED; PRIVATE requires owner/editor/viewer.
 * Then the idea matrix is identical for anonymous, owner, editor, viewer,
 * and unrelated member: listed public and collections-only public appear;
 * public unlisted never appears; private appears only to its author.
 * Zero memberships are valid and simply produce no nested result.
 */

type PolicyIdea = {
  access: IdeaAccess;
  distribution: IdeaDistribution;
  authorId: string;
};

function canAccessIdea(idea: PolicyIdea, viewerId?: string) {
  return idea.access === "PUBLIC" || idea.authorId === viewerId;
}

export function canSurfaceIdea(
  idea: PolicyIdea,
  surface: IdeaSurface,
  viewerId?: string,
): boolean {
  if (!canAccessIdea(idea, viewerId)) return false;
  switch (surface) {
    case "DETAIL":
      return true;
    case "ARCHIVE":
    case "TAG_DISCOVERY":
      return idea.access === "PUBLIC" && idea.distribution === "LISTED";
    case "GLOBAL_SEARCH":
      return (
        (idea.access === "PUBLIC" && idea.distribution === "LISTED") ||
        (idea.access === "PRIVATE" && idea.authorId === viewerId)
      );
    case "COLLECTION":
      return (
        (idea.access === "PUBLIC" && idea.distribution !== "UNLISTED") ||
        (idea.access === "PRIVATE" && idea.authorId === viewerId)
      );
    case "OWNER_MANAGEMENT":
      return idea.authorId === viewerId;
    default:
      return false;
  }
}

export function ideaPolicySql(surface: IdeaSurface, viewerId?: string): SQL {
  const listed = and(
    eq(ideas.access, "PUBLIC"),
    eq(ideas.distribution, "LISTED"),
  )!;
  const ownedPrivate = viewerId
    ? and(eq(ideas.access, "PRIVATE"), eq(ideas.authorId, viewerId))
    : undefined;
  switch (surface) {
    case "DETAIL":
      return (
        viewerId
          ? or(eq(ideas.access, "PUBLIC"), eq(ideas.authorId, viewerId))
          : eq(ideas.access, "PUBLIC")
      )!;
    case "ARCHIVE":
    case "TAG_DISCOVERY":
      return listed;
    case "GLOBAL_SEARCH":
      return (ownedPrivate ? or(listed, ownedPrivate) : listed)!;
    case "COLLECTION":
      return (
        ownedPrivate
          ? or(
              and(eq(ideas.access, "PUBLIC"), eq(ideas.distribution, "LISTED")),
              and(
                eq(ideas.access, "PUBLIC"),
                eq(ideas.distribution, "COLLECTIONS_ONLY"),
              ),
              ownedPrivate,
            )
          : and(
              eq(ideas.access, "PUBLIC"),
              or(
                eq(ideas.distribution, "LISTED"),
                eq(ideas.distribution, "COLLECTIONS_ONLY"),
              ),
            )
      )!;
    case "OWNER_MANAGEMENT":
      return viewerId ? eq(ideas.authorId, viewerId) : eq(ideas.authorId, "");
    default:
      return eq(ideas.authorId, "");
  }
}

/** Raw FTS queries use positional bindings, never interpolated viewer input. */
export function ideaPolicyFtsSql(
  surface: "GLOBAL_SEARCH" | "OWNER_MANAGEMENT",
  viewerId: string | undefined,
  bind: (value: string) => string,
) {
  if (surface === "OWNER_MANAGEMENT") {
    return viewerId ? `i.author_id = ${bind(viewerId)}` : "0";
  }
  const listed = `(i.access = 'PUBLIC' AND i.distribution = 'LISTED')`;
  return viewerId
    ? `(${listed} OR (i.access = 'PRIVATE' AND i.author_id = ${bind(viewerId)}))`
    : listed;
}

export function legacyVisibility(
  access: IdeaAccess,
  distribution: IdeaDistribution,
) {
  return access === "PRIVATE"
    ? "PRIVATE"
    : distribution === "LISTED"
      ? "PUBLIC"
      : "UNLISTED";
}
