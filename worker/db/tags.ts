import { and, asc, desc, eq, gt, or, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import { ideas, ideaTags, tags } from "./schema.js";

export type TagDiscoveryRecord = {
  id: string;
  name: string;
  ideaCount: number;
};

type ListUsedTagRecordsInput = {
  q?: string;
  limit: number;
  offset: number;
};

function tagNameKey(name: string) {
  return name.toLocaleLowerCase("en-US");
}

function escapeLike(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_");
}

export async function listUsedTagRecords(
  db: Database,
  input: ListUsedTagRecordsInput,
): Promise<TagDiscoveryRecord[]> {
  const prefixFilter = input.q
    ? sql<boolean>`${tags.nameKey} LIKE ${`${escapeLike(tagNameKey(input.q))}%`} ESCAPE '\\'`
    : undefined;

  return db
    .select({
      id: tags.id,
      name: tags.name,
      ideaCount: tags.publicIdeaCount,
    })
    .from(tags)
    .where(and(gt(tags.publicIdeaCount, 0), prefixFilter))
    .orderBy(desc(tags.publicIdeaCount), asc(tags.nameKey), asc(tags.name))
    .limit(input.limit)
    .offset(input.offset);
}

/** Only public links and the requester's own links are eligible. */
export async function listRecentSuggestionCandidates(
  db: Database,
  userId: string,
) {
  return db
    .select({ id: tags.id, name: tags.name, nameKey: tags.nameKey })
    .from(ideaTags)
    .innerJoin(ideas, eq(ideas.id, ideaTags.ideaId))
    .innerJoin(tags, eq(tags.id, ideaTags.tagId))
    .where(or(eq(ideas.visibility, "PUBLIC"), eq(ideas.authorId, userId)))
    .groupBy(tags.id, tags.name, tags.nameKey)
    .orderBy(
      desc(sql`max(${ideaTags.createdAt})`),
      asc(tags.nameKey),
      asc(tags.id),
    )
    .limit(100);
}
