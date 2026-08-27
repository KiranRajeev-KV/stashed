import {
  and,
  asc,
  desc,
  eq,
  exists,
  gt,
  inArray,
  lt,
  or,
  sql,
} from "drizzle-orm";

import type {
  CreateIdeaInput,
  IdeaSort,
  SearchIdeaSort,
  UpdateIdeaInput,
} from "../ideas/schemas.js";
import { markdownToPlainText } from "../ideas/markdown.js";
import type { Database } from "./client.js";
import type { IdeaStatus, IdeaVisibility } from "./schema.js";
import { ideaTags, ideas, tags, userIdentities, users } from "./schema.js";

const GITHUB_PROVIDER = "github";

export type IdeaAuthorRecord = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string | null;
};

export type IdeaTagRecord = {
  id: string;
  name: string;
};

export type IdeaRecord = {
  rowId: number;
  id: string;
  title: string;
  content: string;
  status: IdeaStatus;
  visibility: IdeaVisibility;
  author: IdeaAuthorRecord;
  createdAt: Date;
  updatedAt: Date;
};

export type IdeaListRecord = Omit<IdeaRecord, "content"> & {
  contentPlain: string;
};

export type IdeaSearchRecord = Omit<IdeaRecord, "content" | "rowId"> & {
  excerpt: string;
};

type ListIdeasInput = {
  status?: IdeaStatus;
  tagIds?: string[];
  viewerId?: string;
  sort: IdeaSort;
  cursor?: { timestamp: number; rowId: number };
  limit: number;
};

type SearchRow = {
  id: string;
  title: string;
  status: IdeaStatus;
  visibility: IdeaVisibility;
  authorId: string;
  authorDisplayName: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  createdAt: number;
  updatedAt: number;
  excerpt: string;
};

function ideaBaseSelection() {
  return {
    rowId: ideas.rowId,
    id: ideas.id,
    title: ideas.title,
    status: ideas.status,
    visibility: ideas.visibility,
    authorId: users.id,
    authorDisplayName: users.displayName,
    authorUsername: userIdentities.providerUsername,
    authorAvatarUrl: userIdentities.providerAvatarUrl,
    createdAt: ideas.createdAt,
    updatedAt: ideas.updatedAt,
  };
}

function ideaSelection() {
  return {
    ...ideaBaseSelection(),
    content: ideas.content,
  };
}

function ideaListSelection() {
  return {
    ...ideaBaseSelection(),
    contentPlain: ideas.contentPlain,
  };
}

function tagNameKey(name: string) {
  return name.toLocaleLowerCase("en-US");
}

function compareTagNames(left: IdeaTagRecord, right: IdeaTagRecord) {
  return (
    tagNameKey(left.name).localeCompare(tagNameKey(right.name), "en-US") ||
    left.name.localeCompare(right.name, "en-US")
  );
}

function toIdeaRecord(row: {
  rowId: number;
  id: string;
  title: string;
  content: string;
  status: IdeaStatus;
  visibility: IdeaVisibility;
  authorId: string;
  authorDisplayName: string;
  authorUsername: string | null;
  authorAvatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}): IdeaRecord {
  return {
    rowId: row.rowId,
    id: row.id,
    title: row.title,
    content: row.content,
    status: row.status,
    visibility: row.visibility,
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl,
    },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function withAuthor(db: Database) {
  return db
    .select(ideaSelection())
    .from(ideas)
    .innerJoin(users, eq(users.id, ideas.authorId))
    .innerJoin(
      userIdentities,
      and(
        eq(userIdentities.userId, users.id),
        eq(userIdentities.provider, GITHUB_PROVIDER),
      ),
    );
}

function withListAuthor(db: Database) {
  return db
    .select(ideaListSelection())
    .from(ideas)
    .innerJoin(users, eq(users.id, ideas.authorId))
    .innerJoin(
      userIdentities,
      and(
        eq(userIdentities.userId, users.id),
        eq(userIdentities.provider, GITHUB_PROVIDER),
      ),
    );
}

function listVisibilityFilter(viewerId?: string) {
  return viewerId
    ? or(eq(ideas.visibility, "PUBLIC"), eq(ideas.authorId, viewerId))
    : eq(ideas.visibility, "PUBLIC");
}

function detailVisibilityFilter(viewerId?: string) {
  return viewerId
    ? or(
        inArray(ideas.visibility, ["PUBLIC", "UNLISTED"]),
        eq(ideas.authorId, viewerId),
      )
    : inArray(ideas.visibility, ["PUBLIC", "UNLISTED"]);
}

export async function listIdeaRecords(
  db: Database,
  input: ListIdeasInput,
): Promise<IdeaListRecord[]> {
  const filters = [];

  filters.push(listVisibilityFilter(input.viewerId));

  if (input.status) {
    filters.push(eq(ideas.status, input.status));
  }
  const sortByUpdatedAt = input.sort.startsWith("UPDATED");
  const ascending = input.sort.endsWith("ASC");
  const sortColumn = sortByUpdatedAt ? ideas.updatedAt : ideas.createdAt;

  if (input.cursor) {
    const cursorTimestamp = new Date(input.cursor.timestamp);
    const isAfterCursor = ascending
      ? gt(sortColumn, cursorTimestamp)
      : lt(sortColumn, cursorTimestamp);
    const isSameTimestampAfterCursor = ascending
      ? gt(ideas.rowId, input.cursor.rowId)
      : lt(ideas.rowId, input.cursor.rowId);
    filters.push(
      or(
        isAfterCursor,
        and(eq(sortColumn, cursorTimestamp), isSameTimestampAfterCursor),
      ),
    );
  }
  for (const tagId of input.tagIds ?? []) {
    filters.push(
      exists(
        db
          .select({ value: sql`1` })
          .from(ideaTags)
          .where(and(eq(ideaTags.ideaId, ideas.id), eq(ideaTags.tagId, tagId))),
      ),
    );
  }

  const rows = await withListAuthor(db)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(
      ascending ? asc(sortColumn) : desc(sortColumn),
      ascending ? asc(ideas.rowId) : desc(ideas.rowId),
    )
    .limit(input.limit);

  return rows.map((row) => ({
    rowId: row.rowId,
    id: row.id,
    title: row.title,
    contentPlain: row.contentPlain,
    status: row.status,
    visibility: row.visibility,
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

export async function getIdeaRecord(
  db: Database,
  ideaId: string,
  viewerId?: string,
): Promise<IdeaRecord | undefined> {
  const row = await withAuthor(db)
    .where(and(eq(ideas.id, ideaId), detailVisibilityFilter(viewerId)))
    .get();
  return row ? toIdeaRecord(row) : undefined;
}

export async function getIdeaAuthorId(
  db: Database,
  ideaId: string,
): Promise<string | undefined> {
  return (
    await db
      .select({ authorId: ideas.authorId })
      .from(ideas)
      .where(eq(ideas.id, ideaId))
      .get()
  )?.authorId;
}

export async function getTagsForIdeas(
  db: Database,
  ideaIds: string[],
): Promise<Map<string, IdeaTagRecord[]>> {
  const tagsByIdea = new Map<string, IdeaTagRecord[]>();
  if (ideaIds.length === 0) {
    return tagsByIdea;
  }

  const rows = await db
    .select({ ideaId: ideaTags.ideaId, id: tags.id, name: tags.name })
    .from(ideaTags)
    .innerJoin(tags, eq(tags.id, ideaTags.tagId))
    .where(inArray(ideaTags.ideaId, ideaIds));

  for (const row of rows) {
    const ideaTagList = tagsByIdea.get(row.ideaId) ?? [];
    ideaTagList.push({ id: row.id, name: row.name });
    tagsByIdea.set(row.ideaId, ideaTagList);
  }

  for (const ideaTagList of tagsByIdea.values()) {
    ideaTagList.sort(compareTagNames);
  }

  return tagsByIdea;
}

function normalizeTagNames(tagNames: string[]): string[] {
  const unique = new Map<string, string>();
  for (const name of tagNames) {
    const normalized = name.trim();
    const key = normalized.toLocaleLowerCase("en-US");
    if (!unique.has(key)) {
      unique.set(key, normalized);
    }
  }
  return [...unique.values()];
}

function insertTags(db: Database, tagNames: string[], now: Date) {
  return db
    .insert(tags)
    .values(
      tagNames.map((name) => ({
        id: crypto.randomUUID(),
        name,
        nameKey: tagNameKey(name),
        createdAt: now,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing();
}

function insertIdeaTags(
  db: Database,
  ideaId: string,
  tagNames: string[],
  now: Date,
) {
  const tagNameKeys = tagNames.map(tagNameKey);

  return db.insert(ideaTags).select(
    db
      .select({
        ideaId: sql<string>`${ideaId}`.as("idea_id"),
        tagId: tags.id,
        createdAt: sql<Date>`${now.getTime()}`.as("created_at"),
      })
      .from(tags)
      .where(inArray(tags.nameKey, tagNameKeys)),
  );
}

export async function createIdeaRecord(
  db: Database,
  authorId: string,
  input: CreateIdeaInput,
): Promise<string> {
  const ideaId = crypto.randomUUID();
  const tagNames = normalizeTagNames(input.tags ?? []);
  const now = new Date();
  const insertIdea = db.insert(ideas).values({
    id: ideaId,
    title: input.title,
    content: input.content,
    contentPlain: markdownToPlainText(input.content),
    status: input.status ?? "DRAFT",
    visibility: input.visibility ?? "PUBLIC",
    authorId,
    createdAt: now,
    updatedAt: now,
  });

  if (tagNames.length === 0) {
    await insertIdea;
    return ideaId;
  }

  await db.batch([
    insertIdea,
    insertTags(db, tagNames, now),
    insertIdeaTags(db, ideaId, tagNames, now),
  ]);
  return ideaId;
}

export async function updateIdeaRecord(
  db: Database,
  ideaId: string,
  input: UpdateIdeaInput,
): Promise<void> {
  const now = new Date();
  const values: {
    title?: string;
    content?: string;
    contentPlain?: string;
    status?: IdeaStatus;
    visibility?: IdeaVisibility;
    updatedAt: Date;
  } = { updatedAt: now };

  if (input.title !== undefined) values.title = input.title;
  if (input.content !== undefined) {
    values.content = input.content;
    values.contentPlain = markdownToPlainText(input.content);
  }
  if (input.status !== undefined) values.status = input.status;
  if (input.visibility !== undefined) values.visibility = input.visibility;

  const updateIdea = db.update(ideas).set(values).where(eq(ideas.id, ideaId));

  if (input.tags === undefined) {
    await updateIdea;
    return;
  }

  const tagNames = normalizeTagNames(input.tags);
  const deleteIdeaTags = db.delete(ideaTags).where(eq(ideaTags.ideaId, ideaId));

  if (tagNames.length === 0) {
    await db.batch([updateIdea, deleteIdeaTags]);
    return;
  }

  await db.batch([
    updateIdea,
    insertTags(db, tagNames, now),
    deleteIdeaTags,
    insertIdeaTags(db, ideaId, tagNames, now),
  ]);
}

export async function deleteIdeaRecord(db: Database, ideaId: string) {
  const deleted = await db
    .delete(ideas)
    .where(eq(ideas.id, ideaId))
    .returning({ id: ideas.id });
  return deleted.length > 0;
}

function toSafeFtsQuery(query: string) {
  // Keep user input literal while leaving FTS5's prefix operator outside the
  // quotes so a term such as `arch` matches `archive`.
  return query
    .trim()
    .split(/\s+/)
    .map((term) => `"${term.replaceAll('"', '""')}"*`)
    .join(" ");
}

export async function searchIdeaRecords(
  db: Database,
  input: {
    query: string;
    status?: IdeaStatus;
    sort?: SearchIdeaSort;
    tagIds?: string[];
    viewerId?: string;
    limit: number;
    offset: number;
  },
): Promise<IdeaSearchRecord[]> {
  const bindings: (number | string)[] = [toSafeFtsQuery(input.query)];
  const nextPlaceholder = () => `?${bindings.length + 1}`;
  const filters = ["ideas_fts MATCH ?1"];

  if (input.viewerId) {
    const publicPlaceholder = nextPlaceholder();
    bindings.push("PUBLIC");
    const authorPlaceholder = nextPlaceholder();
    bindings.push(input.viewerId);
    filters.push(
      `(i.visibility = ${publicPlaceholder} OR i.author_id = ${authorPlaceholder})`,
    );
  } else {
    const publicPlaceholder = nextPlaceholder();
    bindings.push("PUBLIC");
    filters.push(`i.visibility = ${publicPlaceholder}`);
  }

  if (input.status) {
    filters.push(`i.status = ${nextPlaceholder()}`);
    bindings.push(input.status);
  }
  for (const tagId of input.tagIds ?? []) {
    filters.push(`EXISTS (
      SELECT 1 FROM idea_tags AS it
      WHERE it.idea_id = i.id AND it.tag_id = ${nextPlaceholder()}
    )`);
    bindings.push(tagId);
  }

  const orderBy = {
    BEST_MATCH: "bm25(ideas_fts, 5.0, 1.0), i.row_id DESC",
    UPDATED_DESC: "i.updated_at DESC, i.row_id DESC",
    CREATED_DESC: "i.created_at DESC, i.row_id DESC",
    UPDATED_ASC: "i.updated_at ASC, i.row_id ASC",
    CREATED_ASC: "i.created_at ASC, i.row_id ASC",
  }[input.sort ?? "UPDATED_DESC"];
  const limitPlaceholder = nextPlaceholder();
  bindings.push(input.limit);
  const offsetPlaceholder = nextPlaceholder();
  bindings.push(input.offset);

  const result = await db.$client
    .prepare(
      `SELECT
        i.id AS id,
        i.title AS title,
        i.status AS status,
        i.visibility AS visibility,
        u.id AS authorId,
        u.display_name AS authorDisplayName,
        ui.provider_username AS authorUsername,
        ui.provider_avatar_url AS authorAvatarUrl,
        i.created_at AS createdAt,
        i.updated_at AS updatedAt,
        snippet(
          ideas_fts,
          1,
          '',
          '',
          '…',
          32
        ) AS excerpt
      FROM ideas_fts
      INNER JOIN ideas AS i ON i.row_id = ideas_fts.rowid
      INNER JOIN users AS u ON u.id = i.author_id
      INNER JOIN user_identities AS ui
        ON ui.user_id = u.id AND ui.provider = 'github'
      WHERE ${filters.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
    )
    .bind(...bindings)
    .all<SearchRow>();

  return result.results.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    visibility: row.visibility,
    author: {
      id: row.authorId,
      displayName: row.authorDisplayName,
      username: row.authorUsername,
      avatarUrl: row.authorAvatarUrl,
    },
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    excerpt: row.excerpt,
  }));
}
