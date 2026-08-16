import { asc, countDistinct, desc, eq, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import { ideaTags, tags } from "./schema.js";

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

export async function listUsedTagRecords(
  db: Database,
  input: ListUsedTagRecordsInput,
): Promise<TagDiscoveryRecord[]> {
  const ideaCount = countDistinct(ideaTags.ideaId);
  const prefixFilter = input.q
    ? sql<boolean>`lower(substr(${tags.name}, 1, length(${input.q}))) = lower(${input.q})`
    : undefined;

  return db
    .select({
      id: tags.id,
      name: tags.name,
      ideaCount,
    })
    .from(tags)
    .innerJoin(ideaTags, eq(ideaTags.tagId, tags.id))
    .where(prefixFilter)
    .groupBy(tags.id, tags.name)
    .orderBy(desc(ideaCount), asc(sql`lower(${tags.name})`), asc(tags.name))
    .limit(input.limit)
    .offset(input.offset);
}
