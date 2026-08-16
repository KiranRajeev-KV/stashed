import type { Database } from "../db/client.js";
import { listUsedTagRecords } from "../db/tags.js";

export async function listTags(db: Database) {
  return { data: await listUsedTagRecords(db) };
}
