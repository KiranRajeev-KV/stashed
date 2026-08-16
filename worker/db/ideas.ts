import { and, asc, desc, eq, exists, inArray, lt, or, sql } from "drizzle-orm";

import type { CreateIdeaInput, UpdateIdeaInput } from "../ideas/schemas.js";
import type { Database } from "./client.js";
import type { IdeaStatus } from "./schema.js";
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
  author: IdeaAuthorRecord;
  createdAt: Date;
  updatedAt: Date;
};

export type IdeaListRecord = Omit<IdeaRecord, "content"> & {
  contentPreview: string;
};

export type IdeaSearchRecord = Omit<IdeaRecord, "content" | "rowId"> & {
  highlightedTitle: string;
  excerpt: string;
};

type ListIdeasInput = {
  status?: IdeaStatus;
  tagIds?: string[];
  cursorRowId?: number;
  limit: number;
};

type SearchRow = {
  id: string;
  title: string;
  highlightedTitle: string;
  status: IdeaStatus;
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
    contentPreview: sql<string>`substr(${ideas.content}, 1, 500)`,
  };
}

function toIdeaRecord(row: {
  rowId: number;
  id: string;
  title: string;
  content: string;
  status: IdeaStatus;
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

export async function listIdeaRecords(
  db: Database,
  input: ListIdeasInput,
): Promise<IdeaListRecord[]> {
  const filters = [];

  if (input.status) {
    filters.push(eq(ideas.status, input.status));
  }
  if (input.cursorRowId !== undefined) {
    filters.push(lt(ideas.rowId, input.cursorRowId));
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
    .orderBy(desc(ideas.rowId))
    .limit(input.limit);

  return rows.map((row) => ({
    rowId: row.rowId,
    id: row.id,
    title: row.title,
    contentPreview: row.contentPreview,
    status: row.status,
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
): Promise<IdeaRecord | undefined> {
  const row = await withAuthor(db).where(eq(ideas.id, ideaId)).get();
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
    .where(inArray(ideaTags.ideaId, ideaIds))
    .orderBy(asc(sql`lower(${tags.name})`), asc(tags.name));

  for (const row of rows) {
    const ideaTagList = tagsByIdea.get(row.ideaId) ?? [];
    ideaTagList.push({ id: row.id, name: row.name });
    tagsByIdea.set(row.ideaId, ideaTagList);
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
  const matches = tagNames.map((name) =>
    eq(sql`lower(${tags.name})`, sql`lower(${name})`),
  );

  return db.insert(ideaTags).select(
    db
      .select({
        ideaId: sql<string>`${ideaId}`.as("idea_id"),
        tagId: tags.id,
        createdAt: sql<Date>`${now.getTime()}`.as("created_at"),
      })
      .from(tags)
      .where(or(...matches)),
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
    status: input.status ?? "DRAFT",
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
    status?: IdeaStatus;
    updatedAt: Date;
  } = { updatedAt: now };

  if (input.title !== undefined) values.title = input.title;
  if (input.content !== undefined) values.content = input.content;
  if (input.status !== undefined) values.status = input.status;

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
  query: string,
  limit: number,
  offset: number,
): Promise<IdeaSearchRecord[]> {
  const result = await db.$client
    .prepare(
      `SELECT
        i.id AS id,
        i.title AS title,
        highlight(
          ideas_fts,
          0,
          '[[[HIGHLIGHT_START]]]',
          '[[[HIGHLIGHT_END]]]'
        ) AS highlightedTitle,
        i.status AS status,
        u.id AS authorId,
        u.display_name AS authorDisplayName,
        ui.provider_username AS authorUsername,
        ui.provider_avatar_url AS authorAvatarUrl,
        i.created_at AS createdAt,
        i.updated_at AS updatedAt,
        snippet(
          ideas_fts,
          1,
          '[[[HIGHLIGHT_START]]]',
          '[[[HIGHLIGHT_END]]]',
          '…',
          32
        ) AS excerpt
      FROM ideas_fts
      INNER JOIN ideas AS i ON i.row_id = ideas_fts.rowid
      INNER JOIN users AS u ON u.id = i.author_id
      INNER JOIN user_identities AS ui
        ON ui.user_id = u.id AND ui.provider = 'github'
      WHERE ideas_fts MATCH ?1
      ORDER BY bm25(ideas_fts, 5.0, 1.0), i.row_id DESC
      LIMIT ?2 OFFSET ?3`,
    )
    .bind(toSafeFtsQuery(query), limit, offset)
    .all<SearchRow>();

  return result.results.map((row) => ({
    id: row.id,
    title: row.title,
    highlightedTitle: row.highlightedTitle,
    status: row.status,
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
