import { and, asc, desc, gt, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import { tags } from "./schema.js";

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
      ideaCount: tags.ideaCount,
    })
    .from(tags)
    .where(and(gt(tags.ideaCount, 0), prefixFilter))
    .orderBy(desc(tags.ideaCount), asc(tags.nameKey), asc(tags.name))
    .limit(input.limit)
    .offset(input.offset);
}
