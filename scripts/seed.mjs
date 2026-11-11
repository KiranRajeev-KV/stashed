import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { createFixtures } from "./seed/fixtures.mjs";
import { executeFile, localD1 } from "./seed/local-d1.mjs";
import { buildSeedSql } from "./seed/sql.mjs";

function run() {
  const { values } = parseArgs({
    options: {
      "persist-to": { type: "string" },
      "owner-github-id": { type: "string" },
      "owner-username": { type: "string" },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help) {
    console.log(`Usage: pnpm db:seed [options]

Applies local migrations, restores deterministic demo records, and verifies
foreign keys, tag/quota counters, and both search indexes in an atomic batch.
Records outside the fixture IDs are preserved. No remote mode exists.

  --persist-to <path>       Use isolated Wrangler local state
  --owner-github-id <id>    Attach the primary persona to your GitHub numeric ID
  --owner-username <name>   Display name for a newly created owner (with ID above)
  --dry-run                Print SQL without migrating or writing to D1
  -h, --help               Show this help

Default personas are synthetic. Existing login profiles are reused unchanged.
Seed-owned Ideas, Collections and their links are restored on every run.`);
    return;
  }
  if (
    values["owner-github-id"] &&
    !/^[1-9]\d{0,19}$/.test(values["owner-github-id"])
  )
    throw new Error("--owner-github-id must be a positive numeric GitHub ID.");
  if (
    values["owner-username"] &&
    (!values["owner-github-id"] ||
      !/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}$/.test(values["owner-username"]))
  )
    throw new Error(
      "--owner-username requires --owner-github-id and a valid GitHub username.",
    );
  const fixtures = createFixtures({
    ownerGithubId: values["owner-github-id"],
    ownerUsername: values["owner-username"],
  });
  const sql = buildSeedSql(fixtures);
  if (values["dry-run"]) {
    process.stdout.write(sql + "\n");
    return;
  }
  const options = { persistTo: values["persist-to"] };
  console.log("Applying migrations to local stashed-db…");
  localD1(["migrations", "apply"], options);
  const directory = mkdtempSync(join(tmpdir(), "stashed-seed-"));
  try {
    const file = join(directory, "seed.sql");
    writeFileSync(file, sql);
    console.log(
      "Seeding all application tables and checking database invariants…",
    );
    const results = JSON.parse(executeFile(file, options));
    const summary = results.at(-1)?.results?.[0];
    if (!summary) throw new Error("Wrangler did not return a seed summary.");
    console.log(JSON.stringify(summary, null, 2));
    console.log(
      "Local seed complete. Search indexes and counters verified; suggestion controls preserved.",
    );
    console.log(
      `${fixtures.collections[0].name}: /collections/${fixtures.collections[0].id}`,
    );
    console.log(
      "Use --owner-github-id with your numeric GitHub ID to manage the primary persona’s records after signing in.",
    );
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
