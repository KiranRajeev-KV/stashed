import { drizzle } from "drizzle-orm/d1";

import * as schema from "./schema.js";

export function createDb(binding: D1Database) {
  return drizzle(binding, { schema });
}

export type Database = ReturnType<typeof createDb>;
