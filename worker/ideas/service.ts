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
import type { IdeaStatus, IdeaVisibility } from "../db/schema.js";
import type {
  CreateIdeaInput,
  IdeaSort,
  SearchIdeaSort,
  UpdateIdeaInput,
} from "./schemas.js";
import { excerptFromPlainText } from "./markdown.js";

const cursorSchema = z.discriminatedUnion("v", [
  z.object({
    v: z.literal(2),
    sort: z.enum(["UPDATED_DESC", "CREATED_DESC", "CREATED_ASC"]),
    timestamp: z.number().int().nonnegative(),
    rowId: z.number().int().positive(),
  }),
  z.object({
    v: z.literal(3),
    sort: z.enum(["NAME_ASC", "NAME_DESC"]),
    name: z.string().max(200),
    rowId: z.number().int().positive(),
  }),
]);

type ListIdeasInput = {
  status?: IdeaStatus;
  visibility?: IdeaVisibility;
  tagId?: string[];
  sort?: IdeaSort;
  cursor?: string;
  limit: number;
};

function encodeCursor(sort: IdeaSort, idea: IdeaListRecord) {
  const cursor = sort.startsWith("NAME")
    ? { v: 3 as const, sort, name: idea.title, rowId: idea.rowId }
    : {
        v: 2 as const,
        sort,
        timestamp:
          idea[
            sort.startsWith("UPDATED") ? "updatedAt" : "createdAt"
          ].getTime(),
        rowId: idea.rowId,
      };
  return btoa(JSON.stringify(cursor))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decodeCursor(cursor: string, sort: IdeaSort) {
  try {
    const base64 = cursor.replaceAll("-", "+").replaceAll("_", "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const parsed = cursorSchema.safeParse(JSON.parse(atob(padded)));
    if (
      parsed.success &&
      parsed.data.sort === sort &&
      (sort.startsWith("NAME") ? parsed.data.v === 3 : parsed.data.v === 2)
    ) {
      return parsed.data;
    }
  } catch {
    // Invalid cursors use the same public validation response below.
  }
  throw new ApiError(400, "VALIDATION_ERROR", "Invalid cursor");
}

function isEmptyEditorContent(content: string) {
  return /^\s*(?:&#x20;)?\s*$/i.test(content);
}

function normalizeEditorContent(content: string) {
  return isEmptyEditorContent(content) ? "" : content;
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
    visibility: idea.visibility,
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
    excerpt: excerptFromPlainText(idea.contentPlain),
    status: idea.status,
    visibility: idea.visibility,
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
    excerpt: excerptFromPlainText(idea.excerpt),
    status: idea.status,
    visibility: idea.visibility,
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

export async function listIdeas(
  db: Database,
  input: ListIdeasInput,
  viewerId?: string,
) {
  const sort = input.sort ?? "UPDATED_DESC";
  const cursor = input.cursor ? decodeCursor(input.cursor, sort) : undefined;
  const records = await listIdeaRecords(db, {
    status: input.status,
    visibility: input.visibility,
    tagIds: input.tagId,
    viewerId,
    sort,
    cursor,
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
        ? encodeCursor(sort, page[page.length - 1])
        : null,
  };
}

export async function getIdea(db: Database, ideaId: string, viewerId?: string) {
  const idea = await getIdeaRecord(db, ideaId, viewerId);
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
  const ideaId = await createIdeaRecord(db, userId, {
    ...input,
    content: normalizeEditorContent(input.content),
  });
  return getIdea(db, ideaId, userId);
}

export async function updateIdea(
  db: Database,
  ideaId: string,
  userId: string,
  input: UpdateIdeaInput,
) {
  await requireIdeaAuthor(db, ideaId, userId);
  await updateIdeaRecord(db, ideaId, {
    ...input,
    ...(input.content === undefined
      ? {}
      : { content: normalizeEditorContent(input.content) }),
  });
  return getIdea(db, ideaId, userId);
}

export async function deleteIdea(db: Database, ideaId: string, userId: string) {
  await requireIdeaAuthor(db, ideaId, userId);
  if (!(await deleteIdeaRecord(db, ideaId))) {
    throw new ApiError(404, "IDEA_NOT_FOUND", "Idea not found");
  }
}

export async function searchIdeas(
  db: Database,
  input: {
    q: string;
    status?: IdeaStatus;
    visibility?: IdeaVisibility;
    sort?: SearchIdeaSort;
    tagId?: string[];
    limit: number;
    offset: number;
  },
  viewerId?: string,
) {
  const records = await searchIdeaRecords(db, {
    query: input.q,
    status: input.status,
    visibility: input.visibility,
    sort: input.sort,
    tagIds: input.tagId,
    viewerId,
    limit: input.limit,
    offset: input.offset,
  });
  const tagsByIdea = await getTagsForIdeas(
    db,
    records.map((idea) => idea.id),
  );
  return {
    results: records.map((idea) =>
      serializeSearchResult(idea, tagsByIdea.get(idea.id) ?? []),
    ),
    limit: input.limit,
    offset: input.offset,
  };
}
