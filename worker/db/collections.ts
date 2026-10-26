import {
  and,
  asc,
  desc,
  eq,
  exists,
  inArray,
  like,
  or,
  sql,
} from "drizzle-orm";

import type {
  CollectionIdeaCandidatesInput,
  CollectionIdeasInput,
  CollectionIdeaTargetsInput,
  CreateCollectionInput,
  ListCollectionsInput,
  UpdateCollectionInput,
} from "../collections/schemas.js";
import type { CollectionRole } from "../collections/policy.js";
import { ideaPolicySql } from "../ideas/policy.js";
import type { Database } from "./client.js";
import {
  collectionCollaborators,
  collectionIdeas,
  collections,
  ideas,
  userIdentities,
  users,
  type CollectionCollaboratorRole,
  type CollectionVisibility,
} from "./schema.js";

const GITHUB_PROVIDER = "github";

type PublicUserRecord = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};

export type CollectionRecord = {
  rowId: number;
  id: string;
  name: string;
  description: string;
  icon: string;
  visibility: CollectionVisibility;
  owner: PublicUserRecord;
  createdAt: Date;
  updatedAt: Date;
};

function collectionSelection() {
  return {
    rowId: collections.rowId,
    id: collections.id,
    name: collections.name,
    description: collections.description,
    icon: collections.icon,
    visibility: collections.visibility,
    ownerId: users.id,
    ownerDisplayName: users.displayName,
    ownerUsername: userIdentities.providerUsername,
    ownerAvatarUrl: userIdentities.providerAvatarUrl,
    createdAt: collections.createdAt,
    updatedAt: collections.updatedAt,
  };
}

function toCollectionRecord(
  row: ReturnType<typeof collectionSelection> extends infer _T
    ? {
        rowId: number;
        id: string;
        name: string;
        description: string;
        icon: string;
        visibility: CollectionVisibility;
        ownerId: string;
        ownerDisplayName: string;
        ownerUsername: string | null;
        ownerAvatarUrl: string | null;
        createdAt: Date;
        updatedAt: Date;
      }
    : never,
): CollectionRecord {
  return {
    rowId: row.rowId,
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    visibility: row.visibility,
    owner: {
      id: row.ownerId,
      displayName: row.ownerDisplayName,
      username: row.ownerUsername,
      avatarUrl: row.ownerAvatarUrl,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function withOwner(db: Database) {
  return db
    .select(collectionSelection())
    .from(collections)
    .innerJoin(users, eq(users.id, collections.ownerId))
    .innerJoin(
      userIdentities,
      and(
        eq(userIdentities.userId, users.id),
        eq(userIdentities.provider, GITHUB_PROVIDER),
      ),
    );
}

export async function getCollectionRecord(db: Database, id: string) {
  const row = await withOwner(db).where(eq(collections.id, id)).get();
  return row ? toCollectionRecord(row) : undefined;
}

export async function getCollectionRole(
  db: Database,
  collection: CollectionRecord,
  viewerId?: string,
): Promise<CollectionRole> {
  if (!viewerId) return null;
  if (collection.owner.id === viewerId) return "OWNER";
  return (
    (
      await db
        .select({ role: collectionCollaborators.role })
        .from(collectionCollaborators)
        .where(
          and(
            eq(collectionCollaborators.collectionId, collection.id),
            eq(collectionCollaborators.userId, viewerId),
          ),
        )
        .get()
    )?.role ?? null
  );
}

export async function listCollectionRecords(
  db: Database,
  input: ListCollectionsInput,
  viewerId?: string,
) {
  const filters = [];
  if (input.scope === "DISCOVER") {
    filters.push(eq(collections.visibility, "PUBLIC"));
  } else if (input.scope === "OWNED") {
    if (!viewerId) return [];
    filters.push(eq(collections.ownerId, viewerId));
  } else {
    if (!viewerId) return [];
    filters.push(
      exists(
        db
          .select({ value: sql`1` })
          .from(collectionCollaborators)
          .where(
            and(
              eq(collectionCollaborators.collectionId, collections.id),
              eq(collectionCollaborators.userId, viewerId),
            ),
          ),
      ),
    );
  }
  if (input.ownerId) filters.push(eq(collections.ownerId, input.ownerId));
  if (input.q) {
    const ftsQuery = input.q
      .trim()
      .split(/\s+/)
      .map((term) => `"${term.replaceAll('"', '""')}"*`)
      .join(" ");
    filters.push(sql`EXISTS (
      SELECT 1 FROM collections_fts
      WHERE collections_fts.rowid = ${collections.rowId}
        AND collections_fts MATCH ${ftsQuery}
    )`);
  }

  const order = {
    UPDATED_DESC: [desc(collections.updatedAt), desc(collections.rowId)],
    CREATED_DESC: [desc(collections.createdAt), desc(collections.rowId)],
    CREATED_ASC: [asc(collections.createdAt), asc(collections.rowId)],
    NAME_ASC: [asc(collections.name), asc(collections.rowId)],
    NAME_DESC: [desc(collections.name), desc(collections.rowId)],
  }[input.sort];

  const rows = await withOwner(db)
    .where(and(...filters))
    .orderBy(...order)
    .limit(input.limit)
    .offset(input.offset);
  return rows.map(toCollectionRecord);
}

/**
 * Lists only collections where the viewer has Owner or Editor membership,
 * while also returning whether a particular Idea is already associated.
 */
export async function listCollectionIdeaTargetRecords(
  db: Database,
  input: CollectionIdeaTargetsInput,
  viewerId: string,
) {
  const filters = [
    or(
      eq(collections.ownerId, viewerId),
      exists(
        db
          .select({ value: sql`1` })
          .from(collectionCollaborators)
          .where(
            and(
              eq(collectionCollaborators.collectionId, collections.id),
              eq(collectionCollaborators.userId, viewerId),
              eq(collectionCollaborators.role, "EDITOR"),
            ),
          ),
      ),
    ),
  ];
  if (input.q) {
    const ftsQuery = input.q
      .trim()
      .split(/\s+/)
      .map((term) => `"${term.replaceAll('"', '""')}"*`)
      .join(" ");
    filters.push(sql`EXISTS (
      SELECT 1 FROM collections_fts
      WHERE collections_fts.rowid = ${collections.rowId}
        AND collections_fts MATCH ${ftsQuery}
    )`);
  }

  const rows = await db
    .select({
      ...collectionSelection(),
      isMember: sql<number>`CASE WHEN ${collectionIdeas.ideaId} IS NULL THEN 0 ELSE 1 END`,
    })
    .from(collections)
    .innerJoin(users, eq(users.id, collections.ownerId))
    .innerJoin(
      userIdentities,
      and(
        eq(userIdentities.userId, users.id),
        eq(userIdentities.provider, GITHUB_PROVIDER),
      ),
    )
    .leftJoin(
      collectionIdeas,
      and(
        eq(collectionIdeas.collectionId, collections.id),
        eq(collectionIdeas.ideaId, input.ideaId),
      ),
    )
    .where(and(...filters))
    .orderBy(asc(collections.name), asc(collections.rowId))
    .limit(input.limit)
    .offset(input.offset);

  return rows.map((row) => ({
    collection: toCollectionRecord(row),
    isMember: Boolean(row.isMember),
  }));
}

export async function createCollectionRecord(
  db: Database,
  ownerId: string,
  input: CreateCollectionInput,
) {
  const id = crypto.randomUUID();
  const now = new Date();
  await db.insert(collections).values({
    id,
    ownerId,
    name: input.name,
    description: input.description ?? "",
    icon: input.icon ?? "folder",
    visibility: input.visibility ?? "PUBLIC",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateCollectionRecord(
  db: Database,
  id: string,
  input: UpdateCollectionInput,
) {
  await db
    .update(collections)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(collections.id, id));
}

export async function deleteCollectionRecord(db: Database, id: string) {
  await db.delete(collections).where(eq(collections.id, id));
}

export async function listCollaboratorRecords(
  db: Database,
  collectionId: string,
) {
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      username: userIdentities.providerUsername,
      avatarUrl: userIdentities.providerAvatarUrl,
      role: collectionCollaborators.role,
    })
    .from(collectionCollaborators)
    .innerJoin(users, eq(users.id, collectionCollaborators.userId))
    .innerJoin(
      userIdentities,
      and(
        eq(userIdentities.userId, users.id),
        eq(userIdentities.provider, GITHUB_PROVIDER),
      ),
    )
    .where(eq(collectionCollaborators.collectionId, collectionId))
    .orderBy(asc(users.displayName));
}

export async function setCollaboratorRecord(
  db: Database,
  collectionId: string,
  userId: string,
  role: CollectionCollaboratorRole,
) {
  const now = new Date();
  await db.batch([
    db
      .insert(collectionCollaborators)
      .values({ collectionId, userId, role, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: [
          collectionCollaborators.collectionId,
          collectionCollaborators.userId,
        ],
        set: { role, updatedAt: now },
      }),
    db
      .update(collections)
      .set({ updatedAt: now })
      .where(eq(collections.id, collectionId)),
  ]);
}

export async function removeCollaboratorRecord(
  db: Database,
  collectionId: string,
  userId: string,
) {
  const now = new Date();
  await db.batch([
    db
      .delete(collectionCollaborators)
      .where(
        and(
          eq(collectionCollaborators.collectionId, collectionId),
          eq(collectionCollaborators.userId, userId),
        ),
      ),
    db
      .update(collections)
      .set({ updatedAt: now })
      .where(eq(collections.id, collectionId)),
  ]);
}

function nestedIdeaVisibility(viewerId?: string) {
  return ideaPolicySql("COLLECTION", viewerId);
}

function nestedIdeaFilters(
  collection: CollectionRecord,
  _role: CollectionRole,
  input: CollectionIdeasInput,
  viewerId?: string,
) {
  const filters = [
    eq(collectionIdeas.collectionId, collection.id),
    nestedIdeaVisibility(viewerId),
  ];
  if (input.status) filters.push(eq(ideas.status, input.status));
  if (input.access) filters.push(eq(ideas.access, input.access));
  if (input.distribution)
    filters.push(eq(ideas.distribution, input.distribution));
  if (input.visibility === "PRIVATE") filters.push(eq(ideas.access, "PRIVATE"));
  if (input.visibility === "PUBLIC")
    filters.push(
      and(eq(ideas.access, "PUBLIC"), eq(ideas.distribution, "LISTED"))!,
    );
  if (input.visibility === "UNLISTED")
    filters.push(
      and(
        eq(ideas.access, "PUBLIC"),
        eq(ideas.distribution, "COLLECTIONS_ONLY"),
      )!,
    );
  if (input.q) {
    const pattern = `%${input.q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    filters.push(
      or(like(ideas.title, pattern), like(ideas.contentPlain, pattern))!,
    );
  }
  return and(...filters);
}

export async function listCollectionIdeaRecords(
  db: Database,
  collection: CollectionRecord,
  role: CollectionRole,
  input: CollectionIdeasInput,
  viewerId?: string,
) {
  const sortByName = input.sort.startsWith("NAME");
  const sortByUpdated = input.sort.startsWith("UPDATED");
  const ascending = input.sort.endsWith("ASC");
  const sortColumn = sortByName
    ? ideas.title
    : sortByUpdated
      ? ideas.updatedAt
      : ideas.createdAt;
  const rows = await db
    .select({
      id: ideas.id,
      title: ideas.title,
      excerpt: ideas.contentPlain,
      status: ideas.status,
      visibility: ideas.visibility,
      access: ideas.access,
      distribution: ideas.distribution,
      authorId: users.id,
      authorDisplayName: users.displayName,
      authorUsername: userIdentities.providerUsername,
      authorAvatarUrl: userIdentities.providerAvatarUrl,
      createdAt: ideas.createdAt,
      updatedAt: ideas.updatedAt,
    })
    .from(collectionIdeas)
    .innerJoin(ideas, eq(ideas.id, collectionIdeas.ideaId))
    .innerJoin(users, eq(users.id, ideas.authorId))
    .innerJoin(
      userIdentities,
      and(
        eq(userIdentities.userId, users.id),
        eq(userIdentities.provider, GITHUB_PROVIDER),
      ),
    )
    .where(nestedIdeaFilters(collection, role, input, viewerId))
    .orderBy(
      ascending ? asc(sortColumn) : desc(sortColumn),
      ascending ? asc(ideas.rowId) : desc(ideas.rowId),
    )
    .limit(input.limit)
    .offset(input.offset);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    status: row.status,
    visibility: row.visibility,
    access: row.access,
    distribution: row.distribution,
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
}

export async function countVisibleCollectionIdeas(
  db: Database,
  collection: CollectionRecord,
  _role: CollectionRole,
  viewerId?: string,
) {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(collectionIdeas)
    .innerJoin(ideas, eq(ideas.id, collectionIdeas.ideaId))
    .where(
      and(
        eq(collectionIdeas.collectionId, collection.id),
        nestedIdeaVisibility(viewerId),
      ),
    )
    .get();
  return result?.count ?? 0;
}

/**
 * Candidate search follows normal discovery: public Ideas and the editor's own
 * Ideas. An unlisted Idea remains addable through its URL/ID, but must not be
 * surfaced to others by this picker. Collection membership itself never makes
 * a restricted Idea selectable.
 */
export async function listCollectionIdeaCandidateRecords(
  db: Database,
  collectionId: string,
  input: CollectionIdeaCandidatesInput,
  viewerId: string,
) {
  const filters = [ideaPolicySql("COLLECTION", viewerId)];
  if (input.q) {
    const pattern = `%${input.q.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    filters.push(
      or(like(ideas.title, pattern), like(ideas.contentPlain, pattern))!,
    );
  }

  const rows = await db
    .select({
      id: ideas.id,
      title: ideas.title,
      visibility: ideas.visibility,
      access: ideas.access,
      distribution: ideas.distribution,
      authorId: users.id,
      authorDisplayName: users.displayName,
      authorUsername: userIdentities.providerUsername,
      authorAvatarUrl: userIdentities.providerAvatarUrl,
      isMember: sql<number>`CASE WHEN ${collectionIdeas.ideaId} IS NULL THEN 0 ELSE 1 END`,
    })
    .from(ideas)
    .innerJoin(users, eq(users.id, ideas.authorId))
    .innerJoin(
      userIdentities,
      and(
        eq(userIdentities.userId, users.id),
        eq(userIdentities.provider, GITHUB_PROVIDER),
      ),
    )
    .leftJoin(
      collectionIdeas,
      and(
        eq(collectionIdeas.collectionId, collectionId),
        eq(collectionIdeas.ideaId, ideas.id),
      ),
    )
    .where(and(...filters))
    .orderBy(desc(ideas.updatedAt), desc(ideas.rowId))
    .limit(input.limit)
    .offset(input.offset);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    visibility: row.visibility,
    access: row.access,
    distribution: row.distribution,
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl,
    },
    isMember: Boolean(row.isMember),
  }));
}

export async function listCollectionMemberIdeaIds(
  db: Database,
  collectionId: string,
  ideaIds: string[],
  viewerId: string,
) {
  if (ideaIds.length === 0) return [];
  const rows = await db
    .select({ ideaId: collectionIdeas.ideaId })
    .from(collectionIdeas)
    .innerJoin(ideas, eq(ideas.id, collectionIdeas.ideaId))
    .where(
      and(
        eq(collectionIdeas.collectionId, collectionId),
        inArray(collectionIdeas.ideaId, ideaIds),
        ideaPolicySql("COLLECTION", viewerId),
      ),
    );
  return rows.map((row) => row.ideaId);
}

export async function addCollectionIdeaRecord(
  db: Database,
  collectionId: string,
  ideaId: string,
  userId: string,
) {
  return addCollectionIdeaRecords(db, collectionId, [ideaId], userId);
}

export async function addCollectionIdeaRecords(
  db: Database,
  collectionId: string,
  ideaIds: string[],
  userId: string,
) {
  const now = new Date();
  // Recheck the idea policy in the insert itself so a stale picker or a
  // concurrent access edit cannot add a hidden membership.
  const [inserted] = await db.batch([
    db
      .insert(collectionIdeas)
      .select(
        db
          .select({
            collectionId: sql<string>`${collectionId}`.as("collection_id"),
            ideaId: ideas.id,
            addedByUserId: sql<string>`${userId}`.as("added_by_user_id"),
            createdAt: sql<Date>`${now.getTime()}`.as("created_at"),
          })
          .from(ideas)
          .where(
            and(
              inArray(ideas.id, ideaIds),
              ideaPolicySql("COLLECTION", userId),
            ),
          ),
      )
      .onConflictDoNothing()
      .returning({ ideaId: collectionIdeas.ideaId }),
    db
      .update(collections)
      .set({ updatedAt: now })
      .where(eq(collections.id, collectionId)),
  ]);
  return inserted.map((row) => row.ideaId);
}

export async function removeCollectionIdeaRecord(
  db: Database,
  collectionId: string,
  ideaId: string,
  userId: string,
) {
  await removeCollectionIdeaRecords(db, collectionId, [ideaId], userId);
}

export async function removeCollectionIdeaRecords(
  db: Database,
  collectionId: string,
  ideaIds: string[],
  userId: string,
) {
  if (ideaIds.length === 0) return [];
  const now = new Date();
  const [removed] = await db.batch([
    db
      .delete(collectionIdeas)
      .where(
        and(
          eq(collectionIdeas.collectionId, collectionId),
          inArray(collectionIdeas.ideaId, ideaIds),
          exists(
            db
              .select({ value: sql`1` })
              .from(ideas)
              .where(
                and(
                  eq(ideas.id, collectionIdeas.ideaId),
                  ideaPolicySql("COLLECTION", userId),
                ),
              ),
          ),
        ),
      )
      .returning({ ideaId: collectionIdeas.ideaId }),
    db
      .update(collections)
      .set({ updatedAt: now })
      .where(eq(collections.id, collectionId)),
  ]);
  return removed.map((row) => row.ideaId);
}
