import { readdirSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

function findLocalD1Database(): string {
  const dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
  const file = readdirSync(dir).find(
    (name) => name.endsWith(".sqlite") && name !== "metadata.sqlite",
  );
  if (!file) {
    throw new Error(`No local D1 SQLite file found under ${dir}`);
  }
  return `file:${dir}/${file}`;
}

export default defineConfig({
  schema: "./worker/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: findLocalD1Database(),
  },
});
