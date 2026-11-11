import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getTableName, isTable } from "drizzle-orm";
import * as schema from "../worker/db/schema.ts";
import { markdownToPlainText } from "../worker/ideas/markdown.ts";
import { createFixtures } from "./seed/fixtures.mjs";
import { executeFile, localD1 } from "./seed/local-d1.mjs";
import { buildSeedSql, quote, validateFixtures } from "./seed/sql.mjs";

const directory = mkdtempSync(join(tmpdir(), "stashed-seed-verification-"));
const options = { persistTo: join(directory, "state") };
const fixtures = createFixtures();
const primaryIdea = fixtures.ideas.find(
  (idea) => idea.author === fixtures.users[0].providerUserId,
);
const file = join(directory, "queries.sql");
const externalUser = "90000000-0000-4000-8000-000000000001";
const externalIdea = "90000000-0000-4000-8000-000000000002";
const externalTag = "90000000-0000-4000-8000-000000000003";
const externalCollection = "90000000-0000-4000-8000-000000000004";
const externalAttempt = "90000000-0000-4000-8000-000000000005";

function query(sql) {
  writeFileSync(file, sql);
  return JSON.parse(executeFile(file, options));
}
function seed(extra = []) {
  const result = spawnSync(
    process.execPath,
    [
      "--experimental-strip-types",
      "scripts/seed.mjs",
      "--persist-to",
      options.persistTo,
      ...extra,
    ],
    { encoding: "utf8", timeout: 120_000 },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
}
const appTables = Object.values(schema)
  .filter(isTable)
  .map(getTableName)
  .sort();
function snapshot() {
  return query(
    appTables
      .map(
        (table) =>
          `SELECT * FROM ${table} ORDER BY ${table === "tag_suggestion_control" ? "id" : "rowid"};`,
      )
      .join("\n"),
  ).map((result) => result.results);
}

try {
  console.log("Checking fixture validation and deterministic SQL…");
  assert.equal(buildSeedSql(fixtures), buildSeedSql(createFixtures()));
  const invalid = structuredClone(fixtures);
  invalid.collections[0].collaborators[0].user = "unknown";
  assert.throws(() => validateFixtures(invalid));
  const inaccessible = structuredClone(fixtures);
  const privateIdea = fixtures.ideas.find(
    (idea) => idea.visibility === "PRIVATE",
  );
  inaccessible.collections[0].ideas.push({
    ideaId: privateIdea.id,
    addedBy: fixtures.users[0].providerUserId,
  });
  assert.throws(() => validateFixtures(inaccessible), /Only the author/);
  const portfolioIds = new Set(
    fixtures.collections[0].ideas.map((member) => member.ideaId),
  );
  assert(
    fixtures.ideas
      .filter((idea) => portfolioIds.has(idea.id))
      .every((idea) => idea.visibility === "PUBLIC"),
  );
  assert.equal(
    new Set(fixtures.ideas.map((idea) => idea.title)).size,
    fixtures.ideas.length,
  );
  const remote = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "scripts/seed.mjs", "--remote"],
    { encoding: "utf8" },
  );
  assert.notEqual(
    remote.status,
    0,
    "remote targets must be rejected before any writes",
  );

  console.log("Seeding a fresh isolated D1 database, including migrations…");
  seed();
  const actualTables = query(
    "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;",
  )[0]
    .results.map((row) => row.name)
    .filter(
      (name) =>
        !name.startsWith("_") &&
        !name.startsWith("sqlite_") &&
        name !== "d1_migrations" &&
        !name.includes("_fts"),
    );
  assert.deepEqual(
    actualTables,
    appTables,
    "verification must cover every schema table",
  );
  const firstSnapshot = snapshot();
  for (let index = 0; index < appTables.length; index++)
    assert(
      firstSnapshot[index].length > 0,
      `${appTables[index]} must be seeded`,
    );
  const storedIdeas = query("SELECT id, content, content_plain FROM ideas;")[0]
    .results;
  for (const idea of storedIdeas)
    assert.equal(idea.content_plain, markdownToPlainText(idea.content));
  const searches =
    query(`SELECT count(*) AS n FROM ideas_fts WHERE ideas_fts MATCH 'counterexample';
    SELECT count(*) AS n FROM collections_fts WHERE collections_fts MATCH 'coordinating';
    SELECT count(DISTINCT status || ':' || visibility) AS n FROM ideas;
    SELECT count(*) AS n FROM ideas WHERE visibility='PUBLIC';
    SELECT count(*) AS n FROM collections WHERE visibility='PUBLIC';`);
  assert.equal(
    searches[0].results[0].n,
    1,
    "body-only search uses derived plain text",
  );
  assert.equal(
    searches[1].results[0].n,
    1,
    "description-only collection search",
  );
  assert.equal(
    searches[2].results[0].n,
    schema.ideaStatusValues.length * schema.ideaVisibilityValues.length,
  );
  assert(
    searches[3].results[0].n > 20 && fixtures.collections[0].ideas.length > 20,
    "public Ideas and portfolio membership must exercise pagination",
  );
  console.log("Checking exact rerun stability, including usage counters…");
  seed();
  assert.deepEqual(
    snapshot(),
    firstSnapshot,
    "a rerun must not change fixture state or consume extra quota",
  );

  console.log(
    "Checking existing identities, shared tags, user data and quota settings…",
  );
  const writingTag = fixtures.tags.find(([, name]) => name === "writing")[0];
  query(`INSERT INTO users VALUES (${quote(externalUser)}, 'Existing profile', 1, 1);
    INSERT INTO user_identities (id,user_id,provider,provider_user_id,provider_username,created_at,updated_at)
      VALUES ('90000000-0000-4000-8000-000000000006',${quote(externalUser)},'github','12345','existing-login',1,1);
    DELETE FROM tags WHERE id=${quote(writingTag)};
    INSERT INTO tags (id,name,name_key,created_at,updated_at) VALUES (${quote(externalTag)},'Writing','writing',1,1);
    INSERT INTO ideas (id,title,content,content_plain,status,visibility,author_id,created_at,updated_at)
      VALUES (${quote(externalIdea)},'User-created idea','Keep my notes','Keep my notes','ACTIVE','PUBLIC',${quote(externalUser)},1,1);
    INSERT INTO idea_tags VALUES (${quote(externalIdea)},${quote(externalTag)},1);
    INSERT INTO collections (id,name,owner_id,created_at,updated_at) VALUES (${quote(externalCollection)},'User collection',${quote(externalUser)},1,1);
    INSERT INTO collection_ideas VALUES (${quote(externalCollection)},${quote(primaryIdea.id)},${quote(externalUser)},1);
    UPDATE tag_suggestion_control SET enabled=1;
    INSERT INTO tag_suggestion_attempts (id,user_id,utc_day,utc_month,created_at)
      VALUES (${quote(externalAttempt)},${quote(externalUser)},'2026-06-10','2026-06',1781085600000);
    UPDATE tag_suggestion_attempts SET input_tokens=55,provider_status=200 WHERE id=${quote(externalAttempt)};
    UPDATE tag_suggestion_control SET enabled=0,user_daily_limit=1,global_monthly_limit=2;
    INSERT INTO tags (id,name,name_key,created_at,updated_at) VALUES ('10000000-0000-4000-8000-000000000019','private-notes','private-notes',1,1);
    INSERT INTO idea_tags VALUES (${quote(primaryIdea.id)},'10000000-0000-4000-8000-000000000019',1);
    UPDATE collections SET name='Legacy demo collection' WHERE id=${quote(fixtures.collections[0].id)};
    UPDATE ideas SET title='Edited demo title',content_plain='Edited demo text',visibility='PRIVATE' WHERE id=${quote(primaryIdea.id)};`);
  seed(["--owner-github-id", "12345", "--owner-username", "new-name"]);
  const refreshed =
    query(`SELECT name FROM collections WHERE id=${quote(fixtures.collections[0].id)};
    SELECT count(*) AS n FROM tags WHERE id='10000000-0000-4000-8000-000000000019';`);
  assert.equal(refreshed[0].results[0].name, fixtures.collections[0].name);
  assert.equal(
    refreshed[1].results[0].n,
    0,
    "obsolete fixture tags should be removed after old links are replaced",
  );
  const preserved = query(`SELECT * FROM users WHERE id=${quote(externalUser)};
    SELECT * FROM user_identities WHERE provider_user_id='12345';
    SELECT * FROM ideas WHERE id=${quote(externalIdea)};
    SELECT * FROM tags WHERE id=${quote(externalTag)};
    SELECT * FROM collection_ideas WHERE collection_id=${quote(externalCollection)};
    SELECT * FROM tag_suggestion_control;
    SELECT author_id,title FROM ideas WHERE id=${quote(primaryIdea.id)};
    SELECT input_tokens,provider_status FROM tag_suggestion_attempts WHERE id=${quote(externalAttempt)};`);
  assert.equal(preserved[0].results[0].display_name, "Existing profile");
  assert.equal(preserved[1].results[0].provider_username, "existing-login");
  assert.equal(preserved[2].results[0].content, "Keep my notes");
  assert.equal(preserved[3].results[0].name, "Writing");
  assert.equal(preserved[4].results.length, 1);
  assert.deepEqual(preserved[5].results[0], {
    id: 1,
    enabled: 0,
    user_daily_limit: 1,
    global_monthly_limit: 2,
  });
  assert.equal(preserved[6].results[0].author_id, externalUser);
  assert.equal(preserved[6].results[0].title, primaryIdea.title);
  assert.deepEqual(preserved[7].results[0], {
    input_tokens: 55,
    provider_status: 200,
  });

  console.log(
    "Checking atomic rollback after fixture writes and control changes…",
  );
  const beforeFailure = snapshot();
  const failingSql = buildSeedSql(
    createFixtures({ ownerGithubId: "12345" }),
  ).replace(
    "DROP TABLE _stashed_seed_control_snapshot;",
    "UPDATE tag_suggestion_control SET enabled=1;\nCREATE TABLE _stashed_seed_failure (value INTEGER CHECK(value=0));\nINSERT INTO _stashed_seed_failure VALUES(1);\nDROP TABLE _stashed_seed_control_snapshot;",
  );
  assert.throws(() => query(failingSql));
  assert.deepEqual(
    snapshot(),
    beforeFailure,
    "failed batches must restore data, counters and settings",
  );
  assert.equal(
    query(
      "SELECT count(*) AS n FROM sqlite_master WHERE name LIKE '_stashed_seed_%';",
    )[0].results[0].n,
    0,
  );
  assert.equal(
    localD1(
      ["execute", "--command", "PRAGMA foreign_key_check", "--json"],
      options,
    ).includes('"results": []'),
    true,
  );
  console.log(
    `Seed verification passed: all ${appTables.length} application tables, migrations, reruns, existing data, FTS, counters and rollback.`,
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
