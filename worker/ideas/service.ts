import { z } from "zod";

import { ApiError } from "../api/errors.js";
import {
  createIdeaRecord,
  deleteIdeaRecord,
  getIdeaAuthorId,
  getIdeaRecord,
  getTagsForIdeas,
  listIdeaRecords,
  searchIdeaRecords,
  updateIdeaRecord,
  type IdeaListRecord,
  type IdeaRecord,
  type IdeaSearchRecord,
  type IdeaTagRecord,
} from "../db/ideas.js";
import type { Database } from "../db/client.js";
import type { IdeaStatus } from "../db/schema.js";
import type { CreateIdeaInput, UpdateIdeaInput } from "./schemas.js";

const cursorSchema = z.object({
  v: z.literal(1),
  rowId: z.number().int().positive(),
});

type ListIdeasInput = {
  status?: IdeaStatus;
  tagId?: string;
  cursor?: string;
  limit: number;
};

function encodeCursor(rowId: number) {
  return btoa(JSON.stringify({ v: 1, rowId }))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decodeCursor(cursor: string): number {
  try {
    const base64 = cursor.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const parsed = cursorSchema.safeParse(JSON.parse(atob(padded)));
    if (parsed.success) {
      return parsed.data.rowId;
    }
  } catch {
    // Invalid cursors use the same public validation response below.
  }
  throw new ApiError(400, "VALIDATION_ERROR", "Invalid cursor");
}

function excerpt(content: string) {
  const compact = content.replace(/\s+/g, " ").trim();
  return compact.length <= 240 ? compact : `${compact.slice(0, 239)}…`;
}

function serializeTag(tag: IdeaTagRecord) {
  return { id: tag.id, name: tag.name };
}

function serializeIdea(idea: IdeaRecord, tags: IdeaTagRecord[]) {
  return {
    id: idea.id,
    title: idea.title,
    content: idea.content,
    status: idea.status,
    author: idea.author,
    tags: tags.map(serializeTag),
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}

function serializeIdeaListItem(idea: IdeaListRecord, tags: IdeaTagRecord[]) {
  return {
    id: idea.id,
    title: idea.title,
    excerpt: excerpt(idea.contentPreview),
    status: idea.status,
    author: idea.author,
    tags: tags.map(serializeTag),
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}

function serializeSearchResult(idea: IdeaSearchRecord, tags: IdeaTagRecord[]) {
  return {
    id: idea.id,
    title: idea.title,
    excerpt: idea.excerpt,
    status: idea.status,
    author: idea.author,
    tags: tags.map(serializeTag),
    createdAt: idea.createdAt.toISOString(),
    updatedAt: idea.updatedAt.toISOString(),
  };
}

async function requireIdeaAuthor(db: Database, ideaId: string, userId: string) {
  const authorId = await getIdeaAuthorId(db, ideaId);
  if (!authorId) {
    throw new ApiError(404, "IDEA_NOT_FOUND", "Idea not found");
  }
  if (authorId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Only the idea author may modify it");
  }
}

export async function listIdeas(db: Database, input: ListIdeasInput) {
  const cursorRowId = input.cursor ? decodeCursor(input.cursor) : undefined;
  const records = await listIdeaRecords(db, {
    status: input.status,
    tagId: input.tagId,
    cursorRowId,
    limit: input.limit + 1,
  });
  const hasMore = records.length > input.limit;
  const page = hasMore ? records.slice(0, input.limit) : records;
  const tagsByIdea = await getTagsForIdeas(
    db,
    page.map((idea) => idea.id),
  );

  return {
    ideas: page.map((idea) =>
      serializeIdeaListItem(idea, tagsByIdea.get(idea.id) ?? []),
    ),
    nextCursor:
      hasMore && page.length > 0
        ? encodeCursor(page[page.length - 1].rowId)
        : null,
  };
}

export async function getIdea(db: Database, ideaId: string) {
  const idea = await getIdeaRecord(db, ideaId);
  if (!idea) {
    throw new ApiError(404, "IDEA_NOT_FOUND", "Idea not found");
  }
  const tagsByIdea = await getTagsForIdeas(db, [ideaId]);
  return { idea: serializeIdea(idea, tagsByIdea.get(ideaId) ?? []) };
}

export async function createIdea(
  db: Database,
  userId: string,
  input: CreateIdeaInput,
) {
  const ideaId = await createIdeaRecord(db, userId, input);
  return getIdea(db, ideaId);
}

export async function updateIdea(
  db: Database,
  ideaId: string,
  userId: string,
  input: UpdateIdeaInput,
) {
  await requireIdeaAuthor(db, ideaId, userId);
  await updateIdeaRecord(db, ideaId, input);
  return getIdea(db, ideaId);
}

export async function deleteIdea(db: Database, ideaId: string, userId: string) {
  await requireIdeaAuthor(db, ideaId, userId);
  if (!(await deleteIdeaRecord(db, ideaId))) {
    throw new ApiError(404, "IDEA_NOT_FOUND", "Idea not found");
  }
}

export async function searchIdeas(
  db: Database,
  query: string,
  limit: number,
  offset: number,
) {
  const records = await searchIdeaRecords(db, query, limit, offset);
  const tagsByIdea = await getTagsForIdeas(
    db,
    records.map((idea) => idea.id),
  );
  return {
    results: records.map((idea) =>
      serializeSearchResult(idea, tagsByIdea.get(idea.id) ?? []),
    ),
    limit,
    offset,
  };
}
