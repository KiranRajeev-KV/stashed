import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DATABASE_NAME = "stashed-db";
const GITHUB_PROVIDER = "github";
const STATUS_VALUES = new Set([
  "DRAFT",
  "ACTIVE",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
]);

const users = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    identityId: "01000000-0000-4000-8000-000000000001",
    providerUserId: "145009677",
    username: "KiranRajeev-KV",
    displayName: "KiranRajeev-KV",
    email: null,
    avatarUrl: "https://avatars.githubusercontent.com/u/145009677?v=4",
    preserveExistingIdentity: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    identityId: "01000000-0000-4000-8000-000000000002",
    providerUserId: "-900000001",
    username: "mira-notes-seed",
    displayName: "Mira Chen",
    email: "mira@seed.stashed.invalid",
    avatarUrl: null,
    preserveExistingIdentity: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    identityId: "01000000-0000-4000-8000-000000000003",
    providerUserId: "-900000002",
    username: "elias-systems-seed",
    displayName: "Elias Porter",
    email: "elias@seed.stashed.invalid",
    avatarUrl: null,
    preserveExistingIdentity: false,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    identityId: "01000000-0000-4000-8000-000000000004",
    providerUserId: "-900000003",
    username: "noor-prototypes-seed",
    displayName: "Noor Rahman",
    email: "noor@seed.stashed.invalid",
    avatarUrl: null,
    preserveExistingIdentity: false,
  },
];

const tags = [
  ["10000000-0000-4000-8000-000000000001", "local-first"],
  ["10000000-0000-4000-8000-000000000002", "developer-tools"],
  ["10000000-0000-4000-8000-000000000003", "writing"],
  ["10000000-0000-4000-8000-000000000004", "cloudflare"],
  ["10000000-0000-4000-8000-000000000005", "observability"],
  ["10000000-0000-4000-8000-000000000006", "search"],
  ["10000000-0000-4000-8000-000000000007", "knowledge-management"],
  ["10000000-0000-4000-8000-000000000008", "automation"],
  ["10000000-0000-4000-8000-000000000009", "maintenance"],
  ["10000000-0000-4000-8000-000000000010", "documentation"],
  ["10000000-0000-4000-8000-000000000011", "cli"],
  ["10000000-0000-4000-8000-000000000012", "prototyping"],
  ["10000000-0000-4000-8000-000000000013", "accessibility"],
  ["10000000-0000-4000-8000-000000000014", "distributed-systems"],
  ["10000000-0000-4000-8000-000000000015", "product-research"],
  ["10000000-0000-4000-8000-000000000016", "performance"],
  ["10000000-0000-4000-8000-000000000017", "design-systems"],
  ["10000000-0000-4000-8000-000000000018", "team-practice"],
];

const ideas = [
  {
    id: "20000000-0000-4000-8000-000000000006",
    author: "145009677",
    title: "An archive for abandoned prototypes and the lessons they earned",
    status: "ARCHIVED",
    createdAt: "2026-06-15T08:30:00.000Z",
    updatedAt: "2026-07-09T11:15:00.000Z",
    tags: ["prototyping", "knowledge-management", "documentation"],
    content: `# Preserve the useful remains of unfinished work

An abandoned prototype usually contains more value than its final screenshot: the constraint it tested, the shortcut that invalidated the result, and the pieces worth reusing elsewhere.

## Archive card

1. Original bet
2. Fastest thing that was built
3. Evidence that changed the direction
4. Reusable code or research
5. Conditions under which the idea becomes interesting again

> Archived should mean intentionally closed, not forgotten in a repository list.

This overlaps with Stashed itself, so a separate product would add more ceremony than value. Keep the archive-card structure as a reusable idea template instead.`,
  },
  {
    id: "21000000-0000-4000-8000-000000000001",
    author: "-900000001",
    title: "A reading queue that asks why an article matters",
    status: "ARCHIVED",
    createdAt: "2026-06-22T14:10:00.000Z",
    updatedAt: "2026-07-12T09:20:00.000Z",
    tags: ["knowledge-management", "product-research", "writing"],
    content: `# Save the reason, not only the URL

Reading lists become graveyards because a bare link preserves no urgency. Capture one sentence when saving an article: **what decision, question, or project could this change?**

## Smallest useful record

- Source URL and title
- The question that made it relevant
- A revisit date or active project
- One extracted claim after reading

The prototype proved the prompt was useful, but a separate queue duplicated the browser and note system. Archive the product and keep the capture question as a reusable pattern.`,
  },
  {
    id: "22000000-0000-4000-8000-000000000001",
    author: "-900000002",
    title: "Incident timelines assembled from structured log clues",
    status: "COMPLETED",
    createdAt: "2026-06-29T06:45:00.000Z",
    updatedAt: "2026-07-23T16:05:00.000Z",
    tags: ["observability", "automation", "distributed-systems"],
    content: `# Turn scattered evidence into a reviewable timeline

During an incident, useful timestamps live in deploy events, queue metrics, application logs, and chat. A small command can normalize those sources into a Markdown timeline without pretending to infer causality.

## Output contract

- Preserve the original timestamp and source link
- Group repeated symptoms without deleting evidence
- Mark clock skew and missing intervals explicitly
- Separate observations from operator interpretation

~~~text
10:41:08  deploy     worker version 9f2a activated
10:43:17  queue      retry rate crossed 8%
10:44:02  api        first upstream timeout
~~~

The experiment worked best as an export step before the retrospective, not as a live incident dashboard.`,
  },
  {
    id: "23000000-0000-4000-8000-000000000001",
    author: "-900000003",
    title: "A keyboard-first checklist for reviewing interactive prototypes",
    status: "ACTIVE",
    createdAt: "2026-07-03T12:00:00.000Z",
    updatedAt: "2026-08-06T10:25:00.000Z",
    tags: ["accessibility", "prototyping", "design-systems"],
    content: `# Review the interaction before polishing the pixels

A prototype can look finished while its focus order, labels, and escape routes remain unclear. Run a short keyboard pass before visual review so interaction problems shape the component rather than becoming cleanup.

## Ten-minute pass

- Reach every interactive control using Tab and Shift+Tab
- Confirm focus is always visible
- Complete the primary task without a pointer
- Close temporary surfaces with Escape
- Return focus to the control that opened a dialog
- Check that errors are announced near the failing field

The checklist should stay short enough to use on every pull request. Link each failure to the component, not to a generic accessibility backlog.`,
  },
  {
    id: "20000000-0000-4000-8000-000000000005",
    author: "145009677",
    title: "Generate release notes from the commits people actually care about",
    status: "COMPLETED",
    createdAt: "2026-07-08T07:40:00.000Z",
    updatedAt: "2026-07-25T18:30:00.000Z",
    tags: ["automation", "cli", "writing"],
    content: `# A small release-note compiler

The experiment grouped commits by user-visible outcome instead of conventional-commit prefix. A short interactive pass allowed noisy internal work to be folded into the change it supported.

## What worked

- Pull-request titles were better summaries than individual commits
- Labels provided a useful first grouping
- Showing the source links preserved trust
- A final human editing pass was faster than writing from scratch

## What did not

Pure automatic summarization produced smooth prose but hid uncertainty. The tool now emits a Markdown draft with explicit source references.

- [x] Parse the comparison range
- [x] Group pull requests by outcome
- [x] Generate a reviewable Markdown draft
- [x] Use it for one real release

The finished prototype is intentionally a script, not a hosted service.`,
  },
  {
    id: "21000000-0000-4000-8000-000000000002",
    author: "-900000001",
    title: "Margin notes that survive a document rewrite",
    status: "PLANNED",
    createdAt: "2026-07-14T13:20:00.000Z",
    updatedAt: "2026-08-02T08:10:00.000Z",
    tags: ["writing", "local-first", "prototyping"],
    content: `# Anchor comments to meaning instead of coordinates

Inline feedback usually attaches to a character range. A substantial rewrite moves or deletes that range even when the underlying idea remains. Explore a local-first annotation format that stores nearby text and a lightweight semantic fingerprint.

## Questions to test

1. How much surrounding text is enough to recover an anchor?
2. When should a note become explicitly orphaned?
3. Can recovery stay deterministic and understandable?
4. What should sync conflicts look like to a writer?

- [ ] Build a plain-text anchor prototype
- [ ] Test it against ten real document revisions
- [ ] Compare exact, fuzzy, and structural matching

The interface must show uncertainty. A confidently misplaced note is worse than an orphaned one.`,
  },
  {
    id: "22000000-0000-4000-8000-000000000002",
    author: "-900000002",
    title: "A failure budget for background jobs",
    status: "IN_PROGRESS",
    createdAt: "2026-07-19T05:55:00.000Z",
    updatedAt: "2026-08-12T15:45:00.000Z",
    tags: ["distributed-systems", "observability", "team-practice"],
    content: `# Make delayed work visible before it becomes an incident

Background jobs rarely have one useful uptime number. A queue can accept work while processing is slow, retries grow, and the oldest item quietly becomes unacceptable.

## Proposed budget

- Maximum age of the oldest ready job
- Percentage completed inside the user-visible expectation
- Retry amplification per successful completion
- Dead-letter volume with an owner and review window

The budget should distinguish **late but recoverable** from **lost or repeatedly failing**. Alerts need an attached first action: inspect capacity, isolate a poison message, or pause producers.

- [x] Define measurements for two existing queues
- [ ] Backtest thresholds against last month's incidents
- [ ] Add a weekly budget review to service ownership notes`,
  },
  {
    id: "20000000-0000-4000-8000-000000000004",
    author: "145009677",
    title: "Dependency upgrade notes that survive the upgrade",
    status: "DRAFT",
    createdAt: "2026-07-22T09:05:00.000Z",
    updatedAt: "2026-07-22T09:05:00.000Z",
    tags: ["maintenance", "documentation", "developer-tools"],
    content: `# Treat upgrades as accumulated engineering knowledge

Package upgrades often repeat the same archaeology: scan release notes, rediscover local assumptions, fix one obscure integration, and then forget why it broke.

The note should sit beside the dependency name and record:

- the last known-good version
- relevant breaking changes
- repository-specific compatibility checks
- commands used to validate the upgrade
- deferred cleanup that should not block shipping

~~~json
{
  "package": "example-package",
  "from": "4.x",
  "to": "5.x",
  "checks": ["typecheck", "build", "smoke"]
}
~~~

Could a future CLI open this context automatically when a lockfile changes?`,
  },
  {
    id: "23000000-0000-4000-8000-000000000002",
    author: "-900000003",
    title: "Design tokens documented as decisions, not inventory",
    status: "COMPLETED",
    createdAt: "2026-07-26T11:35:00.000Z",
    updatedAt: "2026-08-10T07:50:00.000Z",
    tags: ["design-systems", "documentation", "accessibility"],
    content: `# Explain why a token exists

A generated token table answers what values exist but not when to use them. Pair each semantic group with a short decision note and counterexample.

## Example

**Muted foreground** supports secondary prose and metadata on standard surfaces. It must still meet text contrast requirements. It is not a disabled state and should not be used to hide required instructions.

## Documentation shape

- Intent and supported contexts
- Contrast or interaction constraints
- One correct example
- One tempting misuse
- Migration note when semantics change

This made design review faster because disagreements moved from individual hex values to the role a token was supposed to play.`,
  },
  {
    id: "20000000-0000-4000-8000-000000000003",
    author: "145009677",
    title: "A searchable decision log for side projects",
    status: "PLANNED",
    createdAt: "2026-07-29T16:15:00.000Z",
    updatedAt: "2026-08-05T10:40:00.000Z",
    tags: ["search", "knowledge-management", "writing"],
    content: `# Record the decision, not the meeting

Side projects accumulate choices faster than documentation: why SQLite won over Postgres, why a package was removed, or why a seemingly obvious feature was postponed.

Each entry should capture:

- the question being decided
- the constraints that mattered at the time
- alternatives that were seriously considered
- the decision and its confidence level
- a date or signal that should trigger reconsideration

## Retrieval

Searching for database, offline, or a package name should find both the decision and the surrounding reasoning. Results need highlighted excerpts rather than title-only matches.

> A decision log is valuable when it prevents old debates from restarting without new evidence.

- [ ] Import five decisions from an existing project
- [ ] Test whether tags or backlinks are better retrieval cues
- [ ] Review one stale decision after thirty days`,
  },
  {
    id: "21000000-0000-4000-8000-000000000003",
    author: "-900000001",
    title: "A research handoff that records confidence and open edges",
    status: "ACTIVE",
    createdAt: "2026-08-01T10:30:00.000Z",
    updatedAt: "2026-08-14T12:20:00.000Z",
    tags: ["product-research", "documentation", "team-practice"],
    content: `# Make the boundary of the evidence visible

Research summaries often flatten direct observations, interpretation, and recommendation into the same confident voice. A useful handoff should let the next person see where evidence ends.

## Proposed sections

- **Observed:** what participants did or said
- **Inferred:** the explanation that best fits those observations
- **Confidence:** high, medium, or low with a short reason
- **Open edge:** what the study did not answer
- **Next decision:** who can act on this and by when

Quotes remain linked to their source session. Themes include counterexamples instead of reporting only the dominant pattern. The format should fit on one page before supporting notes.`,
  },
  {
    id: "22000000-0000-4000-8000-000000000003",
    author: "-900000002",
    title: "Performance traces that end with a falsifiable next step",
    status: "DRAFT",
    createdAt: "2026-08-04T06:20:00.000Z",
    updatedAt: "2026-08-04T06:20:00.000Z",
    tags: ["performance", "observability", "developer-tools"],
    content: `# A trace is evidence, not a conclusion

Performance investigations stall when a flame graph is saved without the environment, workload, or hypothesis that produced it.

For every trace, record:

1. The user-visible symptom
2. Dataset size and concurrency
3. Build revision and relevant flags
4. The hottest unexpected path
5. One next experiment that could disprove the current explanation

~~~text
hypothesis: serialization dominates request time above 2 MB
disproof: replace payload with pre-encoded bytes and rerun the same load
~~~

The note should compare traces only when their workloads are genuinely equivalent.`,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    author: "145009677",
    title: "A deploy-preview inspector for Cloudflare Workers",
    status: "IN_PROGRESS",
    createdAt: "2026-08-07T08:00:00.000Z",
    updatedAt: "2026-08-15T17:10:00.000Z",
    tags: ["cloudflare", "developer-tools", "observability"],
    content: `# Make preview deployments explain themselves

Build a small page and CLI that turns a preview URL into a compact deployment report. It should answer the questions that currently require jumping between logs, headers, and dashboards.

## Signals to collect

1. Worker version and compatibility date
2. Active bindings without exposing secret values
3. Route and cache behavior for a selected request
4. Recent errors correlated with the preview deployment

~~~sh
stashed-preview inspect https://example-preview.workers.dev/api/health
~~~

Expected output should be useful in a pull-request comment, not only in an interactive terminal.

- [x] Confirm that preview metadata is available without production access
- [ ] Decide which response headers are safe to retain
- [ ] Prototype a read-only Wrangler integration
- [ ] Measure the added latency of the inspection request

The first version should remain deliberately narrow: **inspect and explain**, never mutate a deployment.`,
  },
  {
    id: "23000000-0000-4000-8000-000000000003",
    author: "-900000003",
    title: "A mobile editor test bench for real virtual keyboards",
    status: "PLANNED",
    createdAt: "2026-08-10T15:25:00.000Z",
    updatedAt: "2026-08-13T09:35:00.000Z",
    tags: ["accessibility", "prototyping", "performance"],
    content: `# Test the editor in the viewport users actually get

Responsive screenshots do not reproduce the visual viewport changes caused by mobile keyboards, selection handles, autocorrect, or sticky toolbars.

## Test bench

- A long document with headings, lists, links, and code
- Controls for focusing content near the top and bottom
- Visual viewport dimensions logged without personal input
- A checklist for iOS Safari and Android Chrome
- Slow-device mode for detecting toolbar jank

The first target is not automation. Build a reliable manual fixture, record failures with a short screen capture, and automate only the stable assertions later.`,
  },
  {
    id: "20000000-0000-4000-8000-000000000001",
    author: "145009677",
    title: "A local-first field guide for recurring systems problems",
    status: "ACTIVE",
    createdAt: "2026-08-12T07:15:00.000Z",
    updatedAt: "2026-08-16T06:50:00.000Z",
    tags: ["local-first", "developer-tools", "writing"],
    content: `# A field guide that improves every time the problem returns

The useful part of debugging is rarely the final command. It is the trail of **symptoms, failed assumptions, and decisive evidence** that made the fix possible.

> Keep the practical discoveries that are too specific for a blog post and too valuable to leave buried in chat history.

## A useful note shape

- What changed just before the failure
- The smallest reliable reproduction
- Evidence that ruled out attractive explanations
- The command or observation that unlocked the problem
- What should be checked first next time

## First pass

- [x] Define a compact field-note structure
- [x] Keep every note as portable Markdown
- [ ] Add links between related incidents
- [ ] Surface notes when a similar error appears

~~~ts
type FieldNote = {
  symptom: string;
  evidence: string[];
  nextCheck: string;
};
~~~

The important constraint is **local ownership**. Search and editing should still work without depending on a hosted knowledge service.`,
  },
];

function quote(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function nullable(value) {
  return value === null ? "NULL" : quote(value);
}

function timestamp(value) {
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) {
    throw new Error(`Invalid seed timestamp: ${value}`);
  }
  return milliseconds;
}

function assertUnique(values, description) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`Duplicate ${description}: ${value}`);
    seen.add(value);
  }
}

function validateFixtures() {
  assertUnique(
    users.map((user) => user.id),
    "user ID",
  );
  assertUnique(
    users.map((user) => user.identityId),
    "identity ID",
  );
  assertUnique(
    users.map((user) => user.providerUserId),
    "provider user ID",
  );
  assertUnique(
    tags.map(([id]) => id),
    "tag ID",
  );
  assertUnique(
    tags.map(([, name]) => name.toLowerCase()),
    "tag name",
  );
  assertUnique(
    ideas.map((idea) => idea.id),
    "idea ID",
  );

  const authors = new Set(users.map((user) => user.providerUserId));
  const tagNames = new Set(tags.map(([, name]) => name));

  for (const idea of ideas) {
    if (!authors.has(idea.author)) {
      throw new Error(`Idea ${idea.id} references an unknown author`);
    }
    if (!STATUS_VALUES.has(idea.status)) {
      throw new Error(`Idea ${idea.id} has an invalid status: ${idea.status}`);
    }
    if (!idea.title.trim() || !idea.content.trim()) {
      throw new Error(`Idea ${idea.id} must have a title and content`);
    }
    if (idea.title.length > 200) {
      throw new Error(`Idea ${idea.id} title exceeds 200 characters`);
    }
    if (new Set(idea.tags).size !== idea.tags.length) {
      throw new Error(`Idea ${idea.id} contains duplicate tags`);
    }
    if (idea.tags.length > 20) {
      throw new Error(`Idea ${idea.id} exceeds the 20-tag API limit`);
    }
    for (const tag of idea.tags) {
      if (!tagNames.has(tag)) {
        throw new Error(`Idea ${idea.id} references an unknown tag: ${tag}`);
      }
    }
    if (timestamp(idea.updatedAt) < timestamp(idea.createdAt)) {
      throw new Error(`Idea ${idea.id} is updated before it was created`);
    }
  }
}

function parseSummary(output) {
  const match = output.match(
    /"seeded_users":\s*(\d+)[\s\S]*?"seeded_ideas":\s*(\d+)[\s\S]*?"seeded_tags":\s*(\d+)[\s\S]*?"seeded_idea_tags":\s*(\d+)/,
  );

  if (!match) throw new Error("Wrangler did not return a seed summary");

  return {
    users: Number(match[1]),
    ideas: Number(match[2]),
    tags: Number(match[3]),
    ideaTags: Number(match[4]),
  };
}

function userStatements(user, createdAt) {
  const identityExists = `EXISTS (
    SELECT 1 FROM user_identities
    WHERE provider = ${quote(GITHUB_PROVIDER)}
      AND provider_user_id = ${quote(user.providerUserId)}
  )`;

  const insertUser = user.preserveExistingIdentity
    ? `INSERT OR IGNORE INTO users (id, display_name, created_at, updated_at)
SELECT ${quote(user.id)}, ${quote(user.displayName)}, ${createdAt}, ${createdAt}
WHERE NOT ${identityExists};`
    : `INSERT INTO users (id, display_name, created_at, updated_at)
VALUES (${quote(user.id)}, ${quote(user.displayName)}, ${createdAt}, ${createdAt})
ON CONFLICT(id) DO UPDATE SET
  display_name = excluded.display_name,
  updated_at = excluded.updated_at;`;

  const identityConflict = user.preserveExistingIdentity
    ? "DO NOTHING"
    : `DO UPDATE SET
  user_id = excluded.user_id,
  provider_username = excluded.provider_username,
  provider_email = excluded.provider_email,
  provider_avatar_url = excluded.provider_avatar_url,
  updated_at = excluded.updated_at`;

  return `${insertUser}

INSERT INTO user_identities (
  id, user_id, provider, provider_user_id, provider_username,
  provider_email, provider_avatar_url, created_at, updated_at
)
SELECT
  ${quote(user.identityId)}, users.id, ${quote(GITHUB_PROVIDER)},
  ${quote(user.providerUserId)}, ${quote(user.username)}, ${nullable(user.email)},
  ${nullable(user.avatarUrl)}, ${createdAt}, ${createdAt}
FROM users
WHERE users.id = COALESCE(
  (
    SELECT user_id FROM user_identities
    WHERE provider = ${quote(GITHUB_PROVIDER)}
      AND provider_user_id = ${quote(user.providerUserId)}
  ),
  ${quote(user.id)}
)
ON CONFLICT(provider, provider_user_id) ${identityConflict};`;
}

function ideaStatement(idea) {
  return `INSERT INTO ideas (
  id, title, content, status, author_id, created_at, updated_at
)
SELECT
  ${quote(idea.id)}, ${quote(idea.title)}, ${quote(idea.content)},
  ${quote(idea.status)}, identity.user_id, ${timestamp(idea.createdAt)},
  ${timestamp(idea.updatedAt)}
FROM user_identities AS identity
WHERE identity.provider = ${quote(GITHUB_PROVIDER)}
  AND identity.provider_user_id = ${quote(idea.author)}
ON CONFLICT(id) DO UPDATE SET
  title = excluded.title,
  content = excluded.content,
  status = excluded.status,
  author_id = excluded.author_id,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;`;
}

function buildSql() {
  const seedCreatedAt = timestamp("2026-06-01T00:00:00.000Z");
  const ideaIds = ideas.map((idea) => quote(idea.id)).join(", ");
  const providerIds = users
    .map((user) => quote(user.providerUserId))
    .join(", ");
  const tagNames = tags.map(([, name]) => quote(name)).join(", ");
  const relationships = ideas.flatMap((idea) =>
    idea.tags.map(
      (tag) => `INSERT OR IGNORE INTO idea_tags (idea_id, tag_id, created_at)
SELECT ${quote(idea.id)}, tags.id, ${timestamp(idea.createdAt)}
FROM tags WHERE lower(tags.name) = lower(${quote(tag)});`,
    ),
  );

  return `-- Generated by scripts/seed.mjs. Local development data only.

${users.map((user) => userStatements(user, seedCreatedAt)).join("\n\n")}

${tags
  .map(
    ([id, name]) => `INSERT INTO tags (id, name, created_at, updated_at)
VALUES (${quote(id)}, ${quote(name)}, ${seedCreatedAt}, ${seedCreatedAt})
ON CONFLICT DO NOTHING;`,
  )
  .join("\n\n")}

${ideas.map(ideaStatement).join("\n\n")}

-- Keep relationships for the curated ideas exactly aligned with this fixture.
DELETE FROM idea_tags WHERE idea_id IN (${ideaIds});

${relationships.join("\n\n")}

-- A compact verification summary is printed by Wrangler after the seed runs.
SELECT
  (
    SELECT count(*) FROM user_identities
    WHERE provider = ${quote(GITHUB_PROVIDER)}
      AND provider_user_id IN (${providerIds})
  ) AS seeded_users,
  (SELECT count(*) FROM ideas WHERE id IN (${ideaIds})) AS seeded_ideas,
  (SELECT count(*) FROM tags WHERE name IN (${tagNames})) AS seeded_tags,
  (
    SELECT count(*) FROM idea_tags WHERE idea_id IN (${ideaIds})
  ) AS seeded_idea_tags;
`;
}

function run() {
  if (process.argv.length > 2) {
    throw new Error(
      "The seed command accepts no arguments and always targets local D1 state.",
    );
  }

  validateFixtures();

  const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "stashed-seed-"));
  const sqlFile = join(temporaryDirectory, "seed.sql");
  const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

  try {
    writeFileSync(sqlFile, buildSql(), "utf8");
    console.log(
      `Seeding local ${DATABASE_NAME} with ${users.length} users, ${ideas.length} ideas, and ${tags.length} tags…`,
    );

    const result = spawnSync(
      pnpm,
      [
        "exec",
        "wrangler",
        "d1",
        "execute",
        DATABASE_NAME,
        "--local",
        `--file=${sqlFile}`,
      ],
      {
        cwd: projectRoot,
        encoding: "utf8",
        env: process.env,
        maxBuffer: 10 * 1024 * 1024,
      },
    );

    if (result.error) throw result.error;
    if (result.status !== 0) {
      process.stdout.write(result.stdout ?? "");
      process.stderr.write(result.stderr ?? "");
      throw new Error(
        `Wrangler exited with status ${result.status ?? "unknown"}`,
      );
    }

    const summary = parseSummary(result.stdout ?? "");
    const expectedIdeaTags = ideas.reduce(
      (total, idea) => total + idea.tags.length,
      0,
    );
    const expected = {
      users: users.length,
      ideas: ideas.length,
      tags: tags.length,
      ideaTags: expectedIdeaTags,
    };

    for (const key of Object.keys(expected)) {
      if (summary[key] !== expected[key]) {
        throw new Error(
          `Seed verification failed for ${key}: expected ${expected[key]}, received ${summary[key]}`,
        );
      }
    }

    console.log(
      `Verified ${summary.users} users, ${summary.ideas} ideas, ${summary.tags} tags, and ${summary.ideaTags} idea-tag links.`,
    );
    console.log("Local seed complete. Rerunning this command is safe.");
  } finally {
    rmSync(temporaryDirectory, { force: true, recursive: true });
  }
}

try {
  run();
} catch (error) {
  console.error(
    "Could not seed local D1. Apply local migrations first with `pnpm db:local`.",
  );
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
