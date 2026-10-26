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
