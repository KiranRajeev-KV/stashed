import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const databaseName = "stashed-db";
const sessionSecret = "collections-verification-session-secret-0123456789";
const now = Math.floor(Date.now() / 1000);

const users = {
  owner: "10000000-0000-4000-8000-000000000001",
  editor: "10000000-0000-4000-8000-000000000002",
  viewer: "10000000-0000-4000-8000-000000000003",
  stranger: "10000000-0000-4000-8000-000000000004",
};

const collections = {
  public: "30000000-0000-4000-8000-000000000001",
  unlisted: "30000000-0000-4000-8000-000000000002",
  private: "30000000-0000-4000-8000-000000000003",
};

const ideas = {
  public: "20000000-0000-4000-8000-000000000001",
  unlisted: "20000000-0000-4000-8000-000000000002",
  ownerPrivate: "20000000-0000-4000-8000-000000000003",
  strangerPrivate: "20000000-0000-4000-8000-000000000004",
  extraPublic: "20000000-0000-4000-8000-000000000005",
  collectionsOnly: "20000000-0000-4000-8000-000000000006",
};

const hiddenTags = {
  unlisted: {
    id: "50000000-0000-4000-8000-000000000001",
    name: "matrix-secret-unlisted-tag",
    ideaId: ideas.unlisted,
  },
  ownerPrivate: {
    id: "50000000-0000-4000-8000-000000000002",
    name: "matrix-secret-owner-private-tag",
    ideaId: ideas.ownerPrivate,
  },
  strangerPrivate: {
    id: "50000000-0000-4000-8000-000000000003",
    name: "matrix-secret-stranger-private-tag",
    ideaId: ideas.strangerPrivate,
  },
};

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    ...options,
  });
  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
  return result.stdout;
}

function runWrangler(args) {
  return run("pnpm", ["exec", "wrangler", ...args]);
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function fixtureSql() {
  const timestamp = Date.now();
  const userRows = Object.entries(users)
    .map(
      ([name, id], index) => `
        INSERT INTO users (id, display_name, created_at, updated_at)
        VALUES (${sqlLiteral(id)}, ${sqlLiteral(name)}, ${timestamp}, ${timestamp});
        INSERT INTO user_identities (
          id, user_id, provider, provider_user_id, provider_username,
          created_at, updated_at
        ) VALUES (
          ${sqlLiteral(`11000000-0000-4000-8000-00000000000${index + 1}`)},
          ${sqlLiteral(id)}, 'github', ${sqlLiteral(`verification-${name}`)},
          ${sqlLiteral(name)}, ${timestamp}, ${timestamp}
        );`,
    )
    .join("\n");
  const collectionRows = [
    [collections.public, "Matrix public collection", "PUBLIC"],
    [collections.unlisted, "Matrix unlisted collection", "UNLISTED"],
    [collections.private, "Matrix private collection", "PRIVATE"],
  ]
    .map(
      ([id, name, visibility], index) => `
        INSERT INTO collections (
          row_id, id, name, description, icon, visibility, owner_id, created_at, updated_at
        ) VALUES (
          ${index + 1}, ${sqlLiteral(id)}, ${sqlLiteral(name)},
          'Synthetic verification fixture', 'folder', ${sqlLiteral(visibility)},
          ${sqlLiteral(users.owner)}, ${timestamp}, ${timestamp}
        );`,
    )
    .join("\n");
  const ideaRows = [
    [ideas.public, "Matrix public idea", "PUBLIC", users.stranger],
    [ideas.unlisted, "Matrix unlisted idea", "UNLISTED", users.stranger],
    [ideas.ownerPrivate, "Matrix owner private idea", "PRIVATE", users.owner],
    [
      ideas.strangerPrivate,
      "Matrix stranger private idea",
      "PRIVATE",
      users.stranger,
    ],
    [ideas.extraPublic, "Matrix extra public idea", "PUBLIC", users.stranger],
    [
      ideas.collectionsOnly,
      "Matrix collections-only idea",
      "UNLISTED",
      users.stranger,
    ],
  ]
    .map(
      ([id, title, visibility, authorId], index) => `
        INSERT INTO ideas (
          row_id, id, title, content, content_plain, status, visibility, author_id,
          created_at, updated_at
        ) VALUES (
          ${index + 1}, ${sqlLiteral(id)}, ${sqlLiteral(title)},
          ${sqlLiteral(`${title} content`)}, ${sqlLiteral(`${title} content`)},
          'ACTIVE', ${sqlLiteral(visibility)}, ${sqlLiteral(authorId)}, ${timestamp}, ${timestamp}
        );`,
    )
    .join("\n");
  const collectionsOnlyUpdate = `UPDATE ideas SET access = 'PUBLIC', distribution = 'COLLECTIONS_ONLY', visibility = 'UNLISTED' WHERE id = ${sqlLiteral(ideas.collectionsOnly)};`;
  const hiddenTagRows = Object.values(hiddenTags)
    .map(
      (tag) => `
        INSERT INTO tags (id, name, name_key) VALUES (
          ${sqlLiteral(tag.id)}, ${sqlLiteral(tag.name)}, ${sqlLiteral(tag.name)}
        );
        INSERT INTO idea_tags (idea_id, tag_id) VALUES (
          ${sqlLiteral(tag.ideaId)}, ${sqlLiteral(tag.id)}
        );`,
    )
    .join("\n");
  const membershipRows = Object.values(collections)
    .flatMap((collectionId) =>
      [
        ideas.public,
        ideas.unlisted,
        ideas.ownerPrivate,
        ideas.strangerPrivate,
        ideas.collectionsOnly,
      ].map(
        (ideaId) => `
          INSERT INTO collection_ideas (collection_id, idea_id, added_by_user_id, created_at)
          VALUES (
            ${sqlLiteral(collectionId)}, ${sqlLiteral(ideaId)},
            ${sqlLiteral(users.owner)}, ${timestamp}
          );`,
      ),
    )
    .join("\n");
  const collaboratorRows = Object.values(collections)
    .flatMap((collectionId) => [
      `INSERT INTO collection_collaborators (collection_id, user_id, role, created_at, updated_at)
       VALUES (${sqlLiteral(collectionId)}, ${sqlLiteral(users.editor)}, 'EDITOR', ${timestamp}, ${timestamp});`,
      `INSERT INTO collection_collaborators (collection_id, user_id, role, created_at, updated_at)
       VALUES (${sqlLiteral(collectionId)}, ${sqlLiteral(users.viewer)}, 'VIEWER', ${timestamp}, ${timestamp});`,
    ])
    .join("\n");

  return `PRAGMA foreign_keys = ON;\n${userRows}\n${collectionRows}\n${ideaRows}\n${collectionsOnlyUpdate}\n${hiddenTagRows}\n${membershipRows}\n${collaboratorRows}`;
}

function plannerFixtureSql() {
  // Added after API assertions so pagination tests keep a small exact fixture.
  // Mix all three discovery classes to give EXPLAIN realistic selectivity.
  return `
    INSERT INTO ideas (
      row_id, id, title, content, content_plain, status,
      visibility, access, distribution, author_id, created_at, updated_at
    )
    WITH RECURSIVE sequence(n) AS (
      VALUES(1) UNION ALL SELECT n + 1 FROM sequence WHERE n < 900
    )
    SELECT
      1000 + n,
      printf('60000000-0000-4000-8000-%012d', n),
      printf('Planner idea %04d', n),
      'planner body', 'planner body', 'ACTIVE',
      CASE WHEN n % 3 = 0 THEN 'PUBLIC' WHEN n % 3 = 1 THEN 'UNLISTED' ELSE 'PRIVATE' END,
      CASE WHEN n % 3 = 2 THEN 'PRIVATE' ELSE 'PUBLIC' END,
      CASE WHEN n % 3 = 0 THEN 'LISTED' WHEN n % 3 = 1 THEN 'COLLECTIONS_ONLY' ELSE 'LISTED' END,
      ${sqlLiteral(users.stranger)},
      ${Date.now()} + n,
      ${Date.now()} + n
    FROM sequence;
    INSERT INTO collection_ideas (collection_id, idea_id, added_by_user_id)
    SELECT ${sqlLiteral(collections.public)}, id, ${sqlLiteral(users.owner)}
    FROM ideas WHERE row_id BETWEEN 1001 AND 1900;
    ANALYZE;
  `;
}

/** Existing application data used to prove migration 0005 is additive. */
function legacyFixtureSql() {
  const timestamp = Date.now();
  const userRows = Object.entries(users)
    .map(
      ([name, id], index) => `
        INSERT INTO users (id, display_name, created_at, updated_at)
        VALUES (${sqlLiteral(id)}, ${sqlLiteral(name)}, ${timestamp}, ${timestamp});
        INSERT INTO user_identities (
          id, user_id, provider, provider_user_id, provider_username,
          created_at, updated_at
        ) VALUES (
          ${sqlLiteral(`12000000-0000-4000-8000-00000000000${index + 1}`)},
          ${sqlLiteral(id)}, 'github', ${sqlLiteral(`legacy-${name}`)},
          ${sqlLiteral(name)}, ${timestamp}, ${timestamp}
        );`,
    )
    .join("\n");
  const ideaRows = [
    [ideas.public, "Legacy public idea", "PUBLIC", users.stranger],
    [ideas.unlisted, "Legacy unlisted idea", "UNLISTED", users.stranger],
    [ideas.ownerPrivate, "Legacy private idea", "PRIVATE", users.owner],
  ]
    .map(
      ([id, title, visibility, authorId], index) => `
        INSERT INTO ideas (
          row_id, id, title, content, content_plain, status, visibility, author_id,
          created_at, updated_at
        ) VALUES (
          ${index + 100}, ${sqlLiteral(id)}, ${sqlLiteral(title)},
          ${sqlLiteral(`${title} content`)}, ${sqlLiteral(`${title} content`)},
          'ACTIVE', ${sqlLiteral(visibility)}, ${sqlLiteral(authorId)}, ${timestamp}, ${timestamp}
        );`,
    )
    .join("\n");
  return `PRAGMA foreign_keys = ON;\n${userRows}\n${ideaRows}`;
}

function jsonFromWrangler(output) {
  const start = output.indexOf("[");
  if (start === -1) throw new Error(`Expected JSON from Wrangler:\n${output}`);
  return JSON.parse(output.slice(start));
}

function query(stateDirectory, command) {
  const output = runWrangler([
    "d1",
    "execute",
    databaseName,
    "--local",
    "--persist-to",
    stateDirectory,
    "--command",
    command,
    "--json",
  ]);
  return jsonFromWrangler(output)[0].results;
}

function executeFile(stateDirectory, file) {
  runWrangler([
    "d1",
    "execute",
    databaseName,
    "--local",
    "--persist-to",
    stateDirectory,
    "--file",
    file,
    "--yes",
  ]);
}

function verifyMigrationUpgrade(stateDirectory, fixturePath) {
  const migrationDirectory = join(root, "drizzle", "migrations");
  for (const migration of [
    "0000_married_payback.sql",
    "0001_ideas_fts.sql",
    "0002_puzzling_justice.sql",
    "0003_spicy_proemial_gods.sql",
    "0004_small_blazing_skull.sql",
  ]) {
    executeFile(stateDirectory, join(migrationDirectory, migration));
  }
  writeFileSync(fixturePath, legacyFixtureSql());
  executeFile(stateDirectory, fixturePath);
  executeFile(
    stateDirectory,
    join(migrationDirectory, "0005_keen_frightful_four.sql"),
  );

  for (const migration of [
    "0006_luxuriant_boomer.sql",
    "0007_messy_ghost_rider.sql",
    "0008_youthful_liz_osborn.sql",
  ]) {
    executeFile(stateDirectory, join(migrationDirectory, migration));
  }

  assert.deepEqual(
    query(
      stateDirectory,
      "SELECT visibility, access, distribution FROM ideas ORDER BY id",
    ).map((row) => [row.visibility, row.access, row.distribution]),
    [
      ["PUBLIC", "PUBLIC", "LISTED"],
      ["UNLISTED", "PUBLIC", "UNLISTED"],
      ["PRIVATE", "PRIVATE", "LISTED"],
    ],
    "migration 0007 maps every legacy visibility value",
  );
  assert.equal(
    query(stateDirectory, "SELECT count(*) AS count FROM ideas")[0].count,
    3,
    "migration 0005 preserves existing ideas",
  );
  assert.equal(
    query(stateDirectory, "PRAGMA foreign_key_check").length,
    0,
    "migration 0005 keeps existing data foreign-key clean",
  );
  query(
    stateDirectory,
    "INSERT INTO collections_fts(collections_fts, rank) VALUES ('integrity-check', 1)",
  );
}

async function getPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address && typeof address !== "string");
  const { port } = address;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

async function sessionCookie(userId) {
  const value = base64Url(
    JSON.stringify({
      v: 1,
      type: "session",
      userId,
      issuedAt: now,
      expiresAt: now + 60 * 60,
    }),
  );
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`${sessionSecret}:session`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = Buffer.from(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)),
  ).toString("base64");
  return `stashed_session=${encodeURIComponent(`${value}.${signature}`)}`;
}

async function waitForWorker(baseUrl, worker) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (worker.exitCode !== null) {
      throw new Error(
        `Local Worker exited early:\n${readFileSync(workerLog, "utf8")}`,
      );
    }
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {
      // The Worker is still compiling or starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(
    `Timed out starting local Worker:\n${readFileSync(workerLog, "utf8")}`,
  );
}

function assertStatus(response, expected, label) {
  assert.equal(response.status, expected, `${label}: ${response.body}`);
}

function assertIdeaIds(response, expectedIds, label) {
  assertStatus(response, 200, label);
  assert.deepEqual(
    response.json.ideas.map((idea) => idea.id).sort(),
    [...expectedIds].sort(),
    label,
  );
}

function assertNoHiddenIdeaMetadata(response, hiddenIdeaIds, label) {
  const privateDetails = {
    [ideas.unlisted]: ["Matrix unlisted idea", hiddenTags.unlisted],
    [ideas.ownerPrivate]: [
      "Matrix owner private idea",
      hiddenTags.ownerPrivate,
    ],
    [ideas.strangerPrivate]: [
      "Matrix stranger private idea",
      hiddenTags.strangerPrivate,
    ],
  };
  for (const ideaId of hiddenIdeaIds) {
    const details = privateDetails[ideaId];
    const forbidden = [ideaId];
    if (details) {
      forbidden.push(details[0], details[1].id, details[1].name);
    }
    for (const value of forbidden) {
      assert.equal(
        response.body.includes(value),
        false,
        `${label} exposed hidden metadata: ${value}`,
      );
    }
  }
}

let workerLog = "";

async function main() {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "stashed-collections-"),
  );
  const stateDirectory = join(temporaryDirectory, "state");
  const upgradeStateDirectory = join(temporaryDirectory, "upgrade-state");
  const fixturePath = join(temporaryDirectory, "fixtures.sql");
  const legacyFixturePath = join(temporaryDirectory, "legacy-fixtures.sql");
  const environmentPath = join(temporaryDirectory, ".dev.vars");
  workerLog = join(temporaryDirectory, "worker.log");
  let worker;

  try {
    writeFileSync(fixturePath, fixtureSql());
    writeFileSync(
      environmentPath,
      `SESSION_SECRET=${sessionSecret}\nGITHUB_CLIENT_ID=verification\nGITHUB_CLIENT_SECRET=verification\n`,
    );
    verifyMigrationUpgrade(upgradeStateDirectory, legacyFixturePath);
    runWrangler([
      "d1",
      "migrations",
      "apply",
      databaseName,
      "--local",
      "--persist-to",
      stateDirectory,
    ]);
    runWrangler([
      "d1",
      "execute",
      databaseName,
      "--local",
      "--persist-to",
      stateDirectory,
      "--file",
      fixturePath,
      "--yes",
    ]);

    const port = await getPort();
    const baseUrl = `http://127.0.0.1:${port}`;
    const logHandle = await import("node:fs").then(({ openSync }) =>
      openSync(workerLog, "w"),
    );
    worker = spawn(
      "pnpm",
      [
        "exec",
        "wrangler",
        "dev",
        "--local",
        "--persist-to",
        stateDirectory,
        "--port",
        String(port),
        "--env-file",
        environmentPath,
        "--log-level",
        "error",
      ],
      { cwd: root, stdio: ["ignore", logHandle, logHandle] },
    );
    await waitForWorker(baseUrl, worker);

    async function request(path, options = {}) {
      const { userId, method = "GET", body } = options;
      const headers = new Headers({
        Origin: baseUrl,
        "Sec-Fetch-Site": "same-origin",
      });
      if (userId) headers.set("Cookie", await sessionCookie(userId));
      if (body !== undefined) headers.set("Content-Type", "application/json");
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const responseBody = await response.text();
      return {
        status: response.status,
        body: responseBody,
        json: responseBody ? JSON.parse(responseBody) : undefined,
      };
    }

    // Discovery and direct Collection access.
    const anonymousDiscovery = await request("/api/collections?scope=DISCOVER");
    assertStatus(anonymousDiscovery, 200, "anonymous discovery");
    assert.deepEqual(
      anonymousDiscovery.json.collections.map((collection) => collection.id),
      [collections.public],
      "discovery only exposes public collections",
    );
    assertStatus(
      await request(`/api/collections/${collections.unlisted}`),
      200,
      "unlisted collection is link-accessible",
    );
    assertStatus(
      await request(`/api/collections/${collections.private}`),
      404,
      "anonymous private collection is undiscoverable",
    );
    assertStatus(
      await request(`/api/collections/${collections.private}`, {
        userId: users.stranger,
      }),
      404,
      "unrelated user cannot infer private collection",
    );
    const ownedCollections = await request("/api/collections?scope=OWNED", {
      userId: users.owner,
    });
    assertStatus(ownedCollections, 200, "owner navigation");
    assert.deepEqual(
      ownedCollections.json.collections
        .map((collection) => collection.id)
        .sort(),
      Object.values(collections).sort(),
      "owned navigation includes every visibility",
    );
    const sharedCollections = await request(
      "/api/collections?scope=COLLABORATING",
      { userId: users.editor },
    );
    assertStatus(sharedCollections, 200, "shared navigation");
    assert.deepEqual(
      sharedCollections.json.collections
        .map((collection) => collection.id)
        .sort(),
      Object.values(collections).sort(),
      "shared navigation includes explicit collaboration only",
    );

    // The core Collection/Idea access and distribution matrix.
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`),
      [ideas.public, ideas.collectionsOnly],
      "anonymous public collection contents",
    );
    const anonymousPublic = await request(
      `/api/collections/${collections.public}`,
    );
    assert.equal(
      anonymousPublic.json.collection.visibleIdeaCount,
      2,
      "anonymous public count excludes restricted memberships",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas?q=unlisted`),
      [],
      "anonymous public search cannot infer unlisted membership",
    );
    await assertIdeaIds(
      await request(
        `/api/collections/${collections.public}/ideas?visibility=UNLISTED`,
      ),
      [ideas.collectionsOnly],
      "legacy unlisted filter maps to collections-only membership",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`, {
        userId: users.owner,
      }),
      [ideas.public, ideas.collectionsOnly, ideas.ownerPrivate],
      "public collection owner sees unlisted and independently owned private ideas",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`, {
        userId: users.editor,
      }),
      [ideas.public, ideas.collectionsOnly],
      "public collection editor sees unlisted but not private ideas",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`, {
        userId: users.viewer,
      }),
      [ideas.public, ideas.collectionsOnly],
      "public collection viewer sees unlisted but not private ideas",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`, {
        userId: users.stranger,
      }),
      [ideas.public, ideas.collectionsOnly, ideas.strangerPrivate],
      "idea author sees their own restricted ideas without becoming a collaborator",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.unlisted}/ideas`),
      [ideas.public, ideas.collectionsOnly],
      "unlisted collection URL reveals link-accessible ideas only",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.private}/ideas`, {
        userId: users.viewer,
      }),
      [ideas.public, ideas.collectionsOnly],
      "private collection viewer sees public and unlisted ideas only",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.private}/ideas`, {
        userId: users.owner,
      }),
      [ideas.public, ideas.collectionsOnly, ideas.ownerPrivate],
      "private collection owner still sees only independently owned private ideas",
    );

    const members = [
      ideas.public,
      ideas.unlisted,
      ideas.ownerPrivate,
      ideas.strangerPrivate,
      ideas.collectionsOnly,
    ];
    const actors = [
      ["anonymous", undefined],
      ["owner and idea author", users.owner],
      ["editor", users.editor],
      ["viewer", users.viewer],
      ["unrelated member and idea author", users.stranger],
    ];
    for (const [collectionName, collectionId] of Object.entries(collections)) {
      for (const [actorName, userId] of actors) {
        const label = `${collectionName} collection, ${actorName}`;
        const canOpen =
          collectionName !== "private" ||
          [users.owner, users.editor, users.viewer].includes(userId);
        const path = `/api/collections/${collectionId}/ideas`;
        const result = await request(`${path}?limit=50`, { userId });
        if (!canOpen) {
          assertStatus(result, 404, label);
          assert.equal(
            result.body.includes("Matrix private collection"),
            false,
            `${label} exposed the collection name`,
          );
          continue;
        }
        const expected = [ideas.public, ideas.collectionsOnly];
        if (userId === users.owner) expected.push(ideas.ownerPrivate);
        if (userId === users.stranger) expected.push(ideas.strangerPrivate);
        const hidden = members.filter((id) => !expected.includes(id));
        assertIdeaIds(result, expected, label);
        assertNoHiddenIdeaMetadata(result, hidden, label);
        assert.equal(
          result.json.visibleIdeaCount,
          expected.length,
          `${label} list count`,
        );
        const detail = await request(`/api/collections/${collectionId}`, {
          userId,
        });
        assertStatus(detail, 200, `${label} detail`);
        assert.equal(
          detail.json.collection.visibleIdeaCount,
          expected.length,
          `${label} visible count`,
        );
        assertNoHiddenIdeaMetadata(detail, hidden, `${label} detail`);
        const nestedSearch = await request(`${path}?q=Matrix&limit=50`, {
          userId,
        });
        assertIdeaIds(nestedSearch, expected, `${label} local search`);
        assertNoHiddenIdeaMetadata(
          nestedSearch,
          hidden,
          `${label} local search`,
        );
        const pageIds = [];
        for (let offset = 0; offset < expected.length; offset++) {
          const page = await request(`${path}?limit=1&offset=${offset}`, {
            userId,
          });
          assertStatus(page, 200, `${label} page ${offset}`);
          pageIds.push(...page.json.ideas.map((idea) => idea.id));
          assertNoHiddenIdeaMetadata(page, hidden, `${label} page ${offset}`);
          assert.equal(
            page.json.nextOffset,
            offset + 1,
            `${label} next offset follows visible rows`,
          );
        }
        assert.deepEqual(
          pageIds,
          result.json.ideas.map((idea) => idea.id),
          `${label} paginates after policy filtering`,
        );
        const emptyPage = await request(
          `${path}?limit=1&offset=${expected.length}`,
          { userId },
        );
        assertIdeaIds(emptyPage, [], `${label} exhausted page`);
        assert.equal(
          emptyPage.json.nextOffset,
          null,
          `${label} page terminates`,
        );
      }
    }

    // Direct reads, archive, FTS, candidates, and hidden membership writes.
    assertStatus(
      await request(`/api/ideas/${ideas.unlisted}`),
      200,
      "public link-only direct read",
    );
    assertStatus(
      await request(`/api/ideas/${ideas.collectionsOnly}`),
      200,
      "collections-only direct read",
    );
    const anonymousPrivateDetail = await request(
      `/api/ideas/${ideas.ownerPrivate}`,
    );
    assertStatus(anonymousPrivateDetail, 404, "anonymous private direct read");
    assertNoHiddenIdeaMetadata(
      anonymousPrivateDetail,
      [ideas.ownerPrivate],
      "anonymous private direct read",
    );
    assertStatus(
      await request(`/api/ideas/${ideas.ownerPrivate}`, {
        userId: users.owner,
      }),
      200,
      "author private direct read",
    );
    const publicArchive = await request("/api/ideas?limit=50");
    await assertIdeaIds(
      publicArchive,
      [ideas.public, ideas.extraPublic],
      "archive only lists public listed",
    );
    assertNoHiddenIdeaMetadata(
      publicArchive,
      [
        ideas.unlisted,
        ideas.ownerPrivate,
        ideas.strangerPrivate,
        ideas.collectionsOnly,
      ],
      "public archive",
    );
    await assertIdeaIds(
      await request("/api/ideas?scope=MINE&limit=50", {
        userId: users.stranger,
      }),
      [
        ideas.public,
        ideas.unlisted,
        ideas.strangerPrivate,
        ideas.extraPublic,
        ideas.collectionsOnly,
      ],
      "personal view includes author's hidden ideas",
    );
    for (const [visibility, expected] of [
      ["PRIVATE", [ideas.strangerPrivate]],
      ["UNLISTED", [ideas.unlisted]],
    ]) {
      await assertIdeaIds(
        await request(`/api/ideas?visibility=${visibility}&limit=50`, {
          userId: users.stranger,
        }),
        expected,
        `legacy ${visibility} archive uses personal scope when omitted`,
      );
      const legacySearch = await request(
        `/api/search?q=Matrix&visibility=${visibility}&limit=50`,
        { userId: users.stranger },
      );
      assertStatus(legacySearch, 200, `legacy ${visibility} search`);
      assert.deepEqual(
        legacySearch.json.results.map((idea) => idea.id).sort(),
        expected,
        `legacy ${visibility} search uses personal scope when omitted`,
      );
      for (const path of [
        `/api/ideas?visibility=${visibility}`,
        `/api/search?q=Matrix&visibility=${visibility}`,
      ]) {
        assertStatus(
          await request(path),
          401,
          "legacy personal scope requires authentication",
        );
      }
    }
    for (const path of ["/api/ideas", "/api/search?q=Matrix"]) {
      const separator = path.includes("?") ? "&" : "?";
      assertStatus(
        await request(`${path}${separator}scope=MINE`),
        401,
        "explicit personal scope requires authentication",
      );
      for (const scope of ["DISCOVER", "OBSOLETE"]) {
        const result = await request(
          `${path}${separator}scope=${scope}&limit=50`,
          { userId: users.stranger },
        );
        assertStatus(result, 200, `${scope} scope remains global`);
        assertNoHiddenIdeaMetadata(
          result,
          [ideas.unlisted, ideas.collectionsOnly, ideas.ownerPrivate],
          `${scope} scope does not expose hidden public ideas`,
        );
      }
    }
    await assertIdeaIds(
      await request("/api/ideas?visibility=UNLISTED&scope=DISCOVER&limit=50", {
        userId: users.stranger,
      }),
      [],
      "explicit discovery scope overrides legacy personal fallback",
    );
    await assertIdeaIds(
      await request("/api/ideas?visibility=OBSOLETE&limit=50"),
      [ideas.public, ideas.extraPublic],
      "obsolete visibility query falls back to public discovery",
    );
    const anonymousSearch = await request("/api/search?q=Matrix&limit=50");
    assertStatus(anonymousSearch, 200, "anonymous global search");
    assert.deepEqual(
      anonymousSearch.json.results.map((idea) => idea.id).sort(),
      [ideas.public, ideas.extraPublic].sort(),
      "global search only lists public listed",
    );
    assertNoHiddenIdeaMetadata(
      anonymousSearch,
      [
        ideas.unlisted,
        ideas.ownerPrivate,
        ideas.strangerPrivate,
        ideas.collectionsOnly,
      ],
      "anonymous global search",
    );
    const ownerSearch = await request("/api/search?q=Matrix&limit=50", {
      userId: users.owner,
    });
    assert.deepEqual(
      ownerSearch.json.results.map((idea) => idea.id).sort(),
      [ideas.public, ideas.extraPublic, ideas.ownerPrivate].sort(),
      "global search includes requester private but excludes public hidden",
    );
    assertNoHiddenIdeaMetadata(
      ownerSearch,
      [ideas.unlisted, ideas.strangerPrivate, ideas.collectionsOnly],
      "owner global search",
    );
    const candidateList = await request(
      `/api/collections/${collections.public}/ideas/candidates?limit=50`,
      { userId: users.owner },
    );
    assertStatus(candidateList, 200, "owner candidate picker");
    assert.deepEqual(
      candidateList.json.ideas.map((idea) => idea.id).sort(),
      [
        ideas.public,
        ideas.extraPublic,
        ideas.collectionsOnly,
        ideas.ownerPrivate,
      ].sort(),
      "candidate picker excludes link-only and another author's private idea",
    );
    assertNoHiddenIdeaMetadata(
      candidateList,
      [ideas.unlisted, ideas.strangerPrivate],
      "owner candidate picker",
    );
    const editorCandidates = await request(
      `/api/collections/${collections.public}/ideas/candidates?limit=50`,
      { userId: users.editor },
    );
    assertStatus(editorCandidates, 200, "editor candidate picker");
    assert.deepEqual(
      editorCandidates.json.ideas.map((idea) => idea.id).sort(),
      [ideas.public, ideas.extraPublic, ideas.collectionsOnly].sort(),
    );
    assertNoHiddenIdeaMetadata(
      editorCandidates,
      [ideas.unlisted, ideas.ownerPrivate, ideas.strangerPrivate],
      "editor candidate picker",
    );
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas/candidates`, {
        userId: users.viewer,
      }),
      403,
      "viewer cannot list mutation candidates",
    );
    const eligibleTargets = await request(
      `/api/collections/idea-targets?ideaId=${ideas.collectionsOnly}`,
      { userId: users.owner },
    );
    assertStatus(eligibleTargets, 200, "collections-only targets");
    assert.deepEqual(
      eligibleTargets.json.collections
        .map((collection) => collection.id)
        .sort(),
      Object.values(collections).sort(),
      "collections-only idea can target every editable collection",
    );
    assert.ok(
      eligibleTargets.json.collections.every(
        (collection) => collection.isMember,
      ),
      "eligible target membership is reported",
    );
    const hiddenTargets = await request(
      `/api/collections/idea-targets?ideaId=${ideas.unlisted}`,
      { userId: users.owner },
    );
    assertStatus(hiddenTargets, 404, "link-only idea has no targets");
    assertNoHiddenIdeaMetadata(
      hiddenTargets,
      [ideas.unlisted],
      "link-only targets",
    );
    assertStatus(
      await request(
        `/api/collections/${collections.public}/ideas/${ideas.unlisted}`,
        { method: "DELETE", userId: users.editor },
      ),
      404,
      "editor cannot remove a hidden membership by ID",
    );
    const hiddenBatchRemove = await request(
      `/api/collections/${collections.public}/ideas/batch`,
      {
        method: "DELETE",
        userId: users.editor,
        body: { ideaIds: [ideas.unlisted, ideas.ownerPrivate] },
      },
    );
    assertStatus(hiddenBatchRemove, 200, "hidden batch removal");
    assert.deepEqual(
      hiddenBatchRemove.json.removedIdeaIds,
      [],
      "batch removal does not disclose hidden membership IDs",
    );
    assertNoHiddenIdeaMetadata(
      hiddenBatchRemove,
      [ideas.unlisted, ideas.ownerPrivate],
      "hidden batch removal",
    );
    const mixedBatchRemove = await request(
      `/api/collections/${collections.public}/ideas/batch`,
      {
        method: "DELETE",
        userId: users.editor,
        body: { ideaIds: [ideas.collectionsOnly, ideas.unlisted] },
      },
    );
    assertStatus(mixedBatchRemove, 200, "mixed batch removal");
    assert.deepEqual(mixedBatchRemove.json.removedIdeaIds, [
      ideas.collectionsOnly,
    ]);
    assert.equal(
      query(
        stateDirectory,
        `SELECT count(*) AS count FROM collection_ideas WHERE collection_id = ${sqlLiteral(collections.public)} AND idea_id = ${sqlLiteral(ideas.unlisted)}`,
      )[0].count,
      1,
      "hidden membership remains stored",
    );
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas`, {
        method: "POST",
        userId: users.editor,
        body: { ideaId: ideas.collectionsOnly },
      }),
      204,
      "editor restores eligible membership",
    );
    const idempotentBatch = await request(
      `/api/collections/${collections.public}/ideas/batch`,
      {
        method: "POST",
        userId: users.owner,
        body: { ideaIds: [ideas.public, ideas.collectionsOnly] },
      },
    );
    assertStatus(idempotentBatch, 200, "idempotent batch add");
    assert.deepEqual(idempotentBatch.json.addedIdeaIds, []);
    assert.deepEqual(
      idempotentBatch.json.alreadyMemberIdeaIds.sort(),
      [ideas.public, ideas.collectionsOnly].sort(),
    );
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas`, {
        method: "POST",
        userId: users.owner,
        body: { ideaId: ideas.unlisted },
      }),
      404,
      "link-only membership add is denied",
    );
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas`, {
        method: "POST",
        userId: users.owner,
        body: { ideaId: ideas.strangerPrivate },
      }),
      404,
      "another author's private membership add is denied",
    );
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas/batch`, {
        method: "POST",
        userId: users.owner,
        body: { ideaIds: [ideas.public, ideas.unlisted] },
      }),
      404,
      "batch add denies a hidden idea",
    );

    const orphan = await request("/api/ideas", {
      method: "POST",
      userId: users.owner,
      body: {
        title: "Orphan collections-only fixture",
        content: "orphan-only-token",
        access: "PUBLIC",
        distribution: "COLLECTIONS_ONLY",
      },
    });
    assertStatus(
      orphan,
      201,
      "create collections-only idea without membership",
    );
    const orphanId = orphan.json.idea.id;
    assertStatus(
      await request(`/api/ideas/${orphanId}`),
      200,
      "orphan direct link",
    );
    assert.equal(
      (await request("/api/ideas?limit=50")).json.ideas.some(
        (idea) => idea.id === orphanId,
      ),
      false,
      "orphan is absent from archive",
    );
    for (const collectionId of Object.values(collections)) {
      const nested = await request(`/api/collections/${collectionId}/ideas`, {
        userId: users.owner,
      });
      assert.equal(
        nested.json.ideas.some((idea) => idea.id === orphanId),
        false,
        "zero membership never creates collection discovery",
      );
    }
    const orphanTargets = await request(
      `/api/collections/idea-targets?ideaId=${orphanId}`,
      { userId: users.owner },
    );
    assertStatus(orphanTargets, 200, "orphan targets");
    assert.ok(
      orphanTargets.json.collections.every(
        (collection) => !collection.isMember,
      ),
      "orphan targets report no memberships",
    );
    const skippedInsertTrigger = join(temporaryDirectory, "skip-add.sql");
    writeFileSync(
      skippedInsertTrigger,
      `CREATE TRIGGER skip_single_add BEFORE INSERT ON collection_ideas WHEN NEW.idea_id = ${sqlLiteral(orphanId)} BEGIN SELECT RAISE(IGNORE); END;`,
    );
    executeFile(stateDirectory, skippedInsertTrigger);
    const skippedAdd = await request(
      `/api/collections/${collections.public}/ideas`,
      { method: "POST", userId: users.owner, body: { ideaId: orphanId } },
    );
    assertStatus(skippedAdd, 404, "skipped insert cannot report success");
    assert.equal(
      skippedAdd.body.includes("Orphan collections-only fixture"),
      false,
      "skipped insert error has no idea title",
    );
    query(stateDirectory, "DROP TRIGGER skip_single_add");
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas`, {
        method: "POST",
        userId: users.owner,
        body: { ideaId: orphanId },
      }),
      204,
      "single add succeeds after skip condition clears",
    );
    assertStatus(
      await request(`/api/ideas/${orphanId}`, {
        method: "DELETE",
        userId: users.owner,
      }),
      204,
      "delete orphan fixture",
    );

    // All six stored states, including private distribution preservation.
    const transition = await request("/api/ideas", {
      method: "POST",
      userId: users.owner,
      body: {
        title: "Policy transition fixture",
        content: "transitiontoken",
        tags: ["transitiontag"],
      },
    });
    assertStatus(transition, 201, "create listed transition fixture");
    const transitionId = transition.json.idea.id;
    assert.equal(transition.json.idea.access, "PUBLIC");
    assert.equal(transition.json.idea.distribution, "LISTED");
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas`, {
        method: "POST",
        userId: users.owner,
        body: { ideaId: transitionId },
      }),
      204,
      "listed membership add",
    );
    async function transitionState(
      access,
      distribution,
      archive,
      global,
      anonymousCollection,
      ownerCollection,
      publicTagCount,
    ) {
      const changed = await request(`/api/ideas/${transitionId}`, {
        method: "PATCH",
        userId: users.owner,
        body: { access, distribution },
      });
      assertStatus(changed, 200, "transition patch");
      assert.equal(changed.json.idea.access, access);
      assert.equal(changed.json.idea.distribution, distribution);
      const archiveIds = (await request("/api/ideas?limit=50")).json.ideas.map(
        (idea) => idea.id,
      );
      assert.equal(
        archiveIds.includes(transitionId),
        archive,
        "archive transition",
      );
      const globalIds = (
        await request("/api/search?q=transitiontoken&limit=50")
      ).json.results.map((idea) => idea.id);
      assert.equal(
        globalIds.includes(transitionId),
        global,
        "anonymous global search transition",
      );
      const authorSearchIds = (
        await request("/api/search?q=transitiontoken&limit=50", {
          userId: users.owner,
        })
      ).json.results.map((idea) => idea.id);
      assert.equal(
        authorSearchIds.includes(transitionId),
        global || access === "PRIVATE",
        "author global search transition",
      );
      const anonymousIds = (
        await request(`/api/collections/${collections.public}/ideas?limit=50`)
      ).json.ideas.map((idea) => idea.id);
      assert.equal(
        anonymousIds.includes(transitionId),
        anonymousCollection,
        "anonymous collection transition",
      );
      const ownerIds = (
        await request(`/api/collections/${collections.public}/ideas?limit=50`, {
          userId: users.owner,
        })
      ).json.ideas.map((idea) => idea.id);
      assert.equal(
        ownerIds.includes(transitionId),
        ownerCollection,
        "author collection transition",
      );
      const tags = await request("/api/tags?q=transitiontag");
      assertStatus(tags, 200, "public tag discovery transition");
      assert.equal(
        tags.json.tags.find((tag) => tag.name === "transitiontag")?.ideaCount ??
          0,
        publicTagCount,
        "public tag count transition",
      );
    }
    await transitionState("PUBLIC", "LISTED", true, true, true, true, 1);
    await transitionState(
      "PUBLIC",
      "COLLECTIONS_ONLY",
      false,
      false,
      true,
      true,
      0,
    );
    await transitionState(
      "PRIVATE",
      "COLLECTIONS_ONLY",
      false,
      false,
      false,
      true,
      0,
    );
    await transitionState("PRIVATE", "UNLISTED", false, false, false, true, 0);
    await transitionState("PRIVATE", "LISTED", false, false, false, true, 0);
    await transitionState("PUBLIC", "UNLISTED", false, false, false, false, 0);
    await transitionState("PUBLIC", "LISTED", true, true, true, true, 1);
    assertStatus(
      await request(`/api/ideas/${transitionId}`, {
        method: "DELETE",
        userId: users.owner,
      }),
      204,
      "delete transition fixture",
    );

    // Capabilities and mutation boundaries.
    const editorDetail = await request(
      `/api/collections/${collections.public}`,
      {
        userId: users.editor,
      },
    );
    assert.deepEqual(editorDetail.json.collection.capabilities, {
      editMetadata: true,
      manageIdeas: true,
      changeVisibility: false,
      manageCollaborators: false,
      deleteCollection: false,
    });
    assertStatus(
      await request(`/api/collections/${collections.private}`, {
        method: "PATCH",
        userId: users.viewer,
        body: { name: "Viewer must not edit" },
      }),
      403,
      "viewer cannot edit metadata",
    );
    assertStatus(
      await request(`/api/collections/${collections.private}/ideas`, {
        method: "POST",
        userId: users.viewer,
        body: { ideaId: ideas.extraPublic },
      }),
      403,
      "viewer cannot add ideas",
    );
    assertStatus(
      await request(`/api/collections/${collections.public}`, {
        method: "PATCH",
        userId: users.editor,
        body: { description: "Editor metadata update" },
      }),
      200,
      "editor can update permitted metadata",
    );
    assertStatus(
      await request(`/api/collections/${collections.public}`, {
        method: "PATCH",
        userId: users.editor,
        body: { visibility: "PRIVATE" },
      }),
      403,
      "editor cannot change visibility",
    );
    assertStatus(
      await request(`/api/collections/${collections.public}/collaborators`, {
        userId: users.editor,
      }),
      403,
      "editor cannot inspect access settings",
    );
    assertStatus(
      await request(`/api/ideas/${ideas.public}`, {
        method: "PATCH",
        userId: users.editor,
        body: { title: "Editor must not edit another user's idea" },
      }),
      403,
      "collection editor receives no idea edit rights",
    );

    // Membership is idempotent, unordered, and independent from Idea lifetime.
    const concurrentAdds = await Promise.all(
      Array.from({ length: 2 }, () =>
        request(`/api/collections/${collections.public}/ideas`, {
          method: "POST",
          userId: users.editor,
          body: { ideaId: ideas.extraPublic },
        }),
      ),
    );
    concurrentAdds.forEach((response) =>
      assertStatus(response, 204, "concurrent membership add"),
    );
    assert.equal(
      query(
        stateDirectory,
        `SELECT count(*) AS count FROM collection_ideas WHERE collection_id = ${sqlLiteral(collections.public)} AND idea_id = ${sqlLiteral(ideas.extraPublic)}`,
      )[0].count,
      1,
      "membership uniqueness survives concurrent requests",
    );
    assertStatus(
      await request(
        `/api/collections/${collections.public}/ideas/${ideas.extraPublic}`,
        {
          method: "DELETE",
          userId: users.editor,
        },
      ),
      204,
      "editor can remove a membership",
    );
    assertStatus(
      await request(`/api/ideas/${ideas.extraPublic}`),
      200,
      "removing membership leaves the idea unchanged",
    );
    const cascadeIdea = await request("/api/ideas", {
      method: "POST",
      userId: users.owner,
      body: {
        title: "Matrix cascade idea",
        content: "This synthetic idea verifies membership cascade behavior.",
        visibility: "PUBLIC",
      },
    });
    assertStatus(cascadeIdea, 201, "owner creates cascade fixture idea");
    const cascadeIdeaId = cascadeIdea.json.idea.id;
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas`, {
        method: "POST",
        userId: users.owner,
        body: { ideaId: cascadeIdeaId },
      }),
      204,
      "owner adds cascade fixture membership",
    );
    assertStatus(
      await request(`/api/ideas/${cascadeIdeaId}`, {
        method: "DELETE",
        userId: users.owner,
      }),
      204,
      "idea owner deletes cascade fixture idea",
    );
    assert.equal(
      query(
        stateDirectory,
        `SELECT count(*) AS count FROM collection_ideas WHERE collection_id = ${sqlLiteral(collections.public)} AND idea_id = ${sqlLiteral(cascadeIdeaId)}`,
      )[0].count,
      0,
      "deleting an idea cascades its membership only",
    );

    // Default visibility, owner-only access management, revocation, and deletion.
    const created = await request("/api/collections", {
      method: "POST",
      userId: users.owner,
      body: { name: "Verification disposable collection" },
    });
    assertStatus(created, 201, "authenticated user creates collection");
    assert.equal(
      created.json.collection.visibility,
      "PUBLIC",
      "default visibility is public",
    );
    const disposableId = created.json.collection.id;
    const createdSearch = await request(
      "/api/collections?scope=DISCOVER&q=disposable",
    );
    assert.deepEqual(
      createdSearch.json.collections.map((collection) => collection.id),
      [disposableId],
      "Collection FTS indexes a newly created collection",
    );
    assertStatus(
      await request(
        `/api/collections/${collections.public}/collaborators/${users.stranger}`,
        {
          method: "PUT",
          userId: users.owner,
          body: { role: "VIEWER" },
        },
      ),
      200,
      "owner can manage collaborators",
    );
    assertStatus(
      await request(
        `/api/collections/${collections.public}/collaborators/${users.owner}`,
        {
          method: "PUT",
          userId: users.owner,
          body: { role: "VIEWER" },
        },
      ),
      400,
      "owner cannot become a collaborator row",
    );
    assertStatus(
      await request(
        `/api/collections/${collections.public}/collaborators/${users.editor}`,
        {
          method: "DELETE",
          userId: users.owner,
        },
      ),
      204,
      "owner revokes editor access",
    );
    assertStatus(
      await request(`/api/collections/${collections.public}/ideas`, {
        method: "POST",
        userId: users.editor,
        body: { ideaId: ideas.extraPublic },
      }),
      403,
      "revoked editor cannot perform a later mutation",
    );
    assertStatus(
      await request(`/api/collections/${disposableId}`, {
        method: "DELETE",
        userId: users.owner,
      }),
      204,
      "owner can delete a collection",
    );
    assertStatus(
      await request(`/api/collections/${disposableId}`, {
        userId: users.owner,
      }),
      404,
      "deleted collection no longer exists",
    );
    const deletedSearch = await request(
      "/api/collections?scope=DISCOVER&q=disposable",
    );
    assert.deepEqual(
      deletedSearch.json.collections,
      [],
      "Collection FTS removes a deleted collection",
    );
    const updatedSearch = await request(
      "/api/collections?scope=DISCOVER&q=metadata",
    );
    assert.deepEqual(
      updatedSearch.json.collections.map((collection) => collection.id),
      [collections.public],
      "Collection FTS updates changed metadata",
    );

    // Migration-level checks required by the Collection migration guide.
    assert.equal(
      query(stateDirectory, "PRAGMA foreign_key_check").length,
      0,
      "foreign keys are internally consistent",
    );
    assert.deepEqual(
      query(
        stateDirectory,
        "SELECT name FROM sqlite_master WHERE name = 'collections_fts'",
      ).map((row) => row.name),
      ["collections_fts"],
      "collections FTS table exists",
    );
    assert.equal(
      query(
        stateDirectory,
        "SELECT name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'collections_fts_%'",
      ).length,
      3,
      "collections FTS triggers exist",
    );
    query(
      stateDirectory,
      "INSERT INTO collections_fts(collections_fts, rank) VALUES ('integrity-check', 1)",
    );
    const plan = query(
      stateDirectory,
      "EXPLAIN QUERY PLAN SELECT id FROM collections WHERE visibility = 'PUBLIC' ORDER BY updated_at DESC, row_id DESC LIMIT 20",
    );
    assert.match(
      plan.map((row) => row.detail).join("\n"),
      /collections_visibility_updated_row_id_idx/,
      "public discovery uses its visibility/sort index",
    );

    const plannerFixturePath = join(temporaryDirectory, "planner-fixture.sql");
    writeFileSync(plannerFixturePath, plannerFixtureSql());
    executeFile(stateDirectory, plannerFixturePath);
    assert.equal(
      query(
        stateDirectory,
        "SELECT count(*) AS count FROM ideas WHERE row_id BETWEEN 1001 AND 1900",
      )[0].count,
      900,
      "planner fixture contains 900 ideas",
    );

    const archivePlan = query(
      stateDirectory,
      "EXPLAIN QUERY PLAN SELECT id FROM ideas WHERE access = 'PUBLIC' AND distribution = 'LISTED' ORDER BY updated_at DESC, row_id DESC LIMIT 20",
    );
    assert.match(
      archivePlan.map((row) => row.detail).join("\n"),
      /ideas_access_distribution_updated_row_id_idx/,
      "archive uses policy/sort index",
    );
    const ftsPlan = query(
      stateDirectory,
      "EXPLAIN QUERY PLAN SELECT i.id FROM ideas_fts JOIN ideas i ON i.row_id = ideas_fts.rowid WHERE ideas_fts MATCH 'Matrix' AND i.access = 'PUBLIC' AND i.distribution = 'LISTED' LIMIT 20",
    );
    assert.match(
      ftsPlan.map((row) => row.detail).join("\n"),
      /VIRTUAL TABLE INDEX/,
      "FTS uses its virtual index",
    );
    const nestedPlan = query(
      stateDirectory,
      `EXPLAIN QUERY PLAN SELECT i.id FROM collection_ideas ci JOIN ideas i ON i.id = ci.idea_id WHERE ci.collection_id = ${sqlLiteral(collections.public)} AND i.access = 'PUBLIC' AND i.distribution IN ('LISTED', 'COLLECTIONS_ONLY') ORDER BY i.updated_at DESC, i.row_id DESC LIMIT 20`,
    );
    assert.match(
      nestedPlan.map((row) => row.detail).join("\n"),
      /sqlite_autoindex_collection_ideas_1/,
      "nested listing uses the membership index",
    );
    const countPlan = query(
      stateDirectory,
      `EXPLAIN QUERY PLAN SELECT count(*) FROM collection_ideas ci JOIN ideas i ON i.id = ci.idea_id WHERE ci.collection_id = ${sqlLiteral(collections.public)} AND i.access = 'PUBLIC' AND i.distribution IN ('LISTED', 'COLLECTIONS_ONLY')`,
    );
    assert.match(
      countPlan.map((row) => row.detail).join("\n"),
      /sqlite_autoindex_collection_ideas_1/,
      "collection count uses membership index",
    );

    console.log(
      "Collections verification passed (authorization, mutations, and local D1 checks).",
    );
  } finally {
    if (worker && worker.exitCode === null) worker.kill("SIGTERM");
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
