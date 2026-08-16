import { asc, countDistinct, desc, eq, sql } from "drizzle-orm";

import type { Database } from "./client.js";
import { ideaTags, tags } from "./schema.js";

export type TagDiscoveryRecord = {
  id: string;
  name: string;
  ideaCount: number;
};

export async function listUsedTagRecords(
  db: Database,
): Promise<TagDiscoveryRecord[]> {
  const ideaCount = countDistinct(ideaTags.ideaId);

  return db
    .select({
      id: tags.id,
      name: tags.name,
      ideaCount,
    })
    .from(tags)
    .innerJoin(ideaTags, eq(ideaTags.tagId, tags.id))
    .groupBy(tags.id, tags.name)
    .orderBy(desc(ideaCount), asc(sql`lower(${tags.name})`), asc(tags.name));
}
