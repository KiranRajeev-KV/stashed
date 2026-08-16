import type { Database } from "../db/client.js";
import { listUsedTagRecords } from "../db/tags.js";
import type { ListTagsQuery } from "./schemas.js";

export async function listTags(db: Database, input: ListTagsQuery) {
  const records = await listUsedTagRecords(db, {
    q: input.q,
    limit: input.limit + 1,
    offset: input.offset,
  });
  const hasMore = records.length > input.limit;

  return {
    tags: hasMore ? records.slice(0, input.limit) : records,
    limit: input.limit,
    offset: input.offset,
    hasMore,
  };
}
