import type {
  CollectionCollaboratorRole,
  CollectionVisibility,
} from "../db/schema.js";

export type CollectionRole = "OWNER" | CollectionCollaboratorRole | null;

export type CollectionCapabilities = {
  editMetadata: boolean;
  manageIdeas: boolean;
  changeVisibility: boolean;
  manageCollaborators: boolean;
  deleteCollection: boolean;
};

export function capabilitiesForRole(
  role: CollectionRole,
): CollectionCapabilities {
  const edits = role === "OWNER" || role === "EDITOR";
  const owns = role === "OWNER";
  return {
    editMetadata: edits,
    manageIdeas: edits,
    changeVisibility: owns,
    manageCollaborators: owns,
    deleteCollection: owns,
  };
}

export function canViewCollection(
  visibility: CollectionVisibility,
  role: CollectionRole,
) {
  return visibility !== "PRIVATE" || role !== null;
}

/**
 * Unlisted ideas are link-accessible. A public collection may only surface
 * them to an explicit participant or their author; non-public collection URLs
 * already supply the required link context. Private ideas remain author-only.
 */
export function collectionIdeaVisibilitySql(options: {
  collectionVisibility: CollectionVisibility;
  isParticipant: boolean;
  viewerId?: string;
}) {
  const { collectionVisibility, isParticipant, viewerId } = options;
  const publicCollectionAllowsUnlisted = isParticipant;
  const allowsUnlisted =
    collectionVisibility !== "PUBLIC" || publicCollectionAllowsUnlisted;

  return {
    allowsUnlisted,
    viewerId,
  };
}
