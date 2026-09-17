import { ApiError } from "../api/errors.js";
import {
  addCollectionIdeaRecords,
  addCollectionIdeaRecord,
  countVisibleCollectionIdeas,
  createCollectionRecord,
  deleteCollectionRecord,
  getCollectionRecord,
  getCollectionRole,
  listCollaboratorRecords,
  listCollectionIdeaRecords,
  listCollectionIdeaCandidateRecords,
  listCollectionIdeaTargetRecords,
  listCollectionMemberIdeaIds,
  listCollectionRecords,
  removeCollaboratorRecord,
  removeCollectionIdeaRecord,
  removeCollectionIdeaRecords,
  setCollaboratorRecord,
  updateCollectionRecord,
  type CollectionRecord,
} from "../db/collections.js";
import type { Database } from "../db/client.js";
import { getIdeaRecord, getTagsForIdeas } from "../db/ideas.js";
import { getUserById } from "../db/users.js";
import { excerptFromPlainText } from "../ideas/markdown.js";
import {
  canViewCollection,
  capabilitiesForRole,
  type CollectionRole,
} from "./policy.js";
import type {
  CollectionIdeaCandidatesInput,
  CollectionIdeaTargetsInput,
  CollectionIdeasInput,
  CreateCollectionInput,
  ListCollectionsInput,
  UpdateCollectionInput,
} from "./schemas.js";

async function requireVisibleCollection(
  db: Database,
  id: string,
  viewerId?: string,
) {
  const collection = await getCollectionRecord(db, id);
  if (!collection)
    throw new ApiError(404, "COLLECTION_NOT_FOUND", "Collection not found");
  const role = await getCollectionRole(db, collection, viewerId);
  if (!canViewCollection(collection.visibility, role)) {
    throw new ApiError(404, "COLLECTION_NOT_FOUND", "Collection not found");
  }
  return { collection, role };
}

function requireRole(
  role: CollectionRole,
  allowed: CollectionRole[],
  message: string,
) {
  if (!allowed.includes(role)) throw new ApiError(403, "FORBIDDEN", message);
}

function serializeUser(user: {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
}) {
  return user;
}

async function serializeCollection(
  db: Database,
  collection: CollectionRecord,
  role: CollectionRole,
  viewerId?: string,
) {
  const [collaborators, visibleIdeaCount] = await Promise.all([
    listCollaboratorRecords(db, collection.id),
    countVisibleCollectionIdeas(db, collection, role, viewerId),
  ]);
  return {
    id: collection.id,
    name: collection.name,
    description: collection.description,
    icon: collection.icon,
    visibility: collection.visibility,
    owner: serializeUser(collection.owner),
    editors: collaborators
      .filter((person) => person.role === "EDITOR")
      .map(serializeUser),
    visibleIdeaCount,
    role,
    capabilities: capabilitiesForRole(role),
    createdAt: collection.createdAt.toISOString(),
    updatedAt: collection.updatedAt.toISOString(),
  };
}

export async function listCollections(
  db: Database,
  input: ListCollectionsInput,
  viewerId?: string,
) {
  if (input.scope !== "DISCOVER" && !viewerId) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
  }
  const records = await listCollectionRecords(db, input, viewerId);
  const serialized = await Promise.all(
    records.map(async (collection) => {
      const role = await getCollectionRole(db, collection, viewerId);
      return serializeCollection(db, collection, role, viewerId);
    }),
  );
  return {
    collections: serialized,
    limit: input.limit,
    offset: input.offset,
    nextOffset:
      records.length === input.limit ? input.offset + input.limit : null,
  };
}

export async function getCollection(
  db: Database,
  id: string,
  viewerId?: string,
) {
  const { collection, role } = await requireVisibleCollection(db, id, viewerId);
  return {
    collection: await serializeCollection(db, collection, role, viewerId),
  };
}

export async function createCollection(
  db: Database,
  userId: string,
  input: CreateCollectionInput,
) {
  const id = await createCollectionRecord(db, userId, input);
  return getCollection(db, id, userId);
}

export async function updateCollection(
  db: Database,
  id: string,
  userId: string,
  input: UpdateCollectionInput,
) {
  const { role } = await requireVisibleCollection(db, id, userId);
  requireRole(
    role,
    ["OWNER", "EDITOR"],
    "Only collection owners and editors may edit metadata",
  );
  if (input.visibility !== undefined && role !== "OWNER") {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Only the collection owner may change visibility",
    );
  }
  await updateCollectionRecord(db, id, input);
  return getCollection(db, id, userId);
}

export async function deleteCollection(
  db: Database,
  id: string,
  userId: string,
) {
  const { role } = await requireVisibleCollection(db, id, userId);
  requireRole(role, ["OWNER"], "Only the collection owner may delete it");
  await deleteCollectionRecord(db, id);
}

export async function listCollectionIdeas(
  db: Database,
  id: string,
  input: CollectionIdeasInput,
  viewerId?: string,
) {
  const { collection, role } = await requireVisibleCollection(db, id, viewerId);
  const [records, visibleIdeaCount] = await Promise.all([
    listCollectionIdeaRecords(db, collection, role, input, viewerId),
    countVisibleCollectionIdeas(db, collection, role, viewerId),
  ]);
  const tagsByIdea = await getTagsForIdeas(
    db,
    records.map((idea) => idea.id),
  );
  return {
    ideas: records.map((idea) => ({
      ...idea,
      excerpt: excerptFromPlainText(idea.excerpt),
      tags: tagsByIdea.get(idea.id) ?? [],
      createdAt: idea.createdAt.toISOString(),
      updatedAt: idea.updatedAt.toISOString(),
    })),
    visibleIdeaCount,
    limit: input.limit,
    offset: input.offset,
    nextOffset:
      records.length === input.limit ? input.offset + input.limit : null,
  };
}

export async function addCollectionIdea(
  db: Database,
  id: string,
  ideaId: string,
  userId: string,
) {
  const { role } = await requireVisibleCollection(db, id, userId);
  requireRole(
    role,
    ["OWNER", "EDITOR"],
    "Only collection owners and editors may add ideas",
  );
  if (!(await getIdeaRecord(db, ideaId, userId))) {
    throw new ApiError(404, "IDEA_NOT_FOUND", "Idea not found");
  }
  await addCollectionIdeaRecord(db, id, ideaId, userId);
}

export async function listCollectionIdeaCandidates(
  db: Database,
  id: string,
  input: CollectionIdeaCandidatesInput,
  userId: string,
) {
  const { role } = await requireVisibleCollection(db, id, userId);
  requireRole(
    role,
    ["OWNER", "EDITOR"],
    "Only collection owners and editors may add ideas",
  );
  const records = await listCollectionIdeaCandidateRecords(
    db,
    id,
    input,
    userId,
  );
  return {
    ideas: records,
    limit: input.limit,
    offset: input.offset,
    nextOffset:
      records.length === input.limit ? input.offset + input.limit : null,
  };
}

/**
 * A contextual picker must not rely on client-side role filtering. This
 * endpoint returns the collections the viewer can actually modify for an Idea
 * they can independently access.
 */
export async function listCollectionIdeaTargets(
  db: Database,
  input: CollectionIdeaTargetsInput,
  userId: string,
) {
  if (!(await getIdeaRecord(db, input.ideaId, userId))) {
    throw new ApiError(404, "IDEA_NOT_FOUND", "Idea not found");
  }
  const records = await listCollectionIdeaTargetRecords(db, input, userId);
  return {
    collections: await Promise.all(
      records.map(async ({ collection, isMember }) => {
        const role = await getCollectionRole(db, collection, userId);
        return {
          ...(await serializeCollection(db, collection, role, userId)),
          isMember,
        };
      }),
    ),
    limit: input.limit,
    offset: input.offset,
    nextOffset:
      records.length === input.limit ? input.offset + input.limit : null,
  };
}

export async function addCollectionIdeas(
  db: Database,
  id: string,
  ideaIds: string[],
  userId: string,
) {
  const { role } = await requireVisibleCollection(db, id, userId);
  requireRole(
    role,
    ["OWNER", "EDITOR"],
    "Only collection owners and editors may add ideas",
  );

  const accessibleIdeas = await Promise.all(
    ideaIds.map((ideaId) => getIdeaRecord(db, ideaId, userId)),
  );
  if (accessibleIdeas.some((idea) => !idea)) {
    throw new ApiError(
      404,
      "IDEA_NOT_FOUND",
      "One or more Ideas were not found",
    );
  }

  const existingIdeaIds = await listCollectionMemberIdeaIds(db, id, ideaIds);
  await addCollectionIdeaRecords(db, id, ideaIds, userId);
  const existing = new Set(existingIdeaIds);
  return {
    addedIdeaIds: ideaIds.filter((ideaId) => !existing.has(ideaId)),
    alreadyMemberIdeaIds: existingIdeaIds,
  };
}

export async function removeCollectionIdea(
  db: Database,
  id: string,
  ideaId: string,
  userId: string,
) {
  const { role } = await requireVisibleCollection(db, id, userId);
  requireRole(
    role,
    ["OWNER", "EDITOR"],
    "Only collection owners and editors may remove ideas",
  );
  await removeCollectionIdeaRecord(db, id, ideaId);
}

/** Remove up to fifty memberships without touching the underlying Ideas. */
export async function removeCollectionIdeas(
  db: Database,
  id: string,
  ideaIds: string[],
  userId: string,
) {
  const { role } = await requireVisibleCollection(db, id, userId);
  requireRole(
    role,
    ["OWNER", "EDITOR"],
    "Only collection owners and editors may remove ideas",
  );
  const memberIdeaIds = await listCollectionMemberIdeaIds(db, id, ideaIds);
  await removeCollectionIdeaRecords(db, id, memberIdeaIds);
  return { removedIdeaIds: memberIdeaIds };
}

export async function getCollaborators(
  db: Database,
  id: string,
  viewerId?: string,
) {
  const { role } = await requireVisibleCollection(db, id, viewerId);
  requireRole(
    role,
    ["OWNER"],
    "Only the collection owner may view access settings",
  );
  return { collaborators: await listCollaboratorRecords(db, id) };
}

export async function setCollaborator(
  db: Database,
  id: string,
  targetUserId: string,
  roleValue: "EDITOR" | "VIEWER",
  userId: string,
) {
  const { collection, role } = await requireVisibleCollection(db, id, userId);
  requireRole(
    role,
    ["OWNER"],
    "Only the collection owner may manage collaborators",
  );
  if (targetUserId === collection.owner.id) {
    throw new ApiError(
      400,
      "VALIDATION_ERROR",
      "The owner cannot also be a collaborator",
    );
  }
  if (!(await getUserById(db, targetUserId))) {
    throw new ApiError(404, "USER_NOT_FOUND", "User not found");
  }
  await setCollaboratorRecord(db, id, targetUserId, roleValue);
  return getCollaborators(db, id, userId);
}

export async function removeCollaborator(
  db: Database,
  id: string,
  targetUserId: string,
  userId: string,
) {
  const { role } = await requireVisibleCollection(db, id, userId);
  requireRole(
    role,
    ["OWNER"],
    "Only the collection owner may manage collaborators",
  );
  await removeCollaboratorRecord(db, id, targetUserId);
}
