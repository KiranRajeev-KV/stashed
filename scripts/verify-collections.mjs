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
  const membershipRows = Object.values(collections)
    .flatMap((collectionId) =>
      [
        ideas.public,
        ideas.unlisted,
        ideas.ownerPrivate,
        ideas.strangerPrivate,
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

  return `PRAGMA foreign_keys = ON;\n${userRows}\n${collectionRows}\n${ideaRows}\n${membershipRows}\n${collaboratorRows}`;
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

    // The core Collection/Idea visibility matrix.
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`),
      [ideas.public],
      "anonymous public collection contents",
    );
    const anonymousPublic = await request(
      `/api/collections/${collections.public}`,
    );
    assert.equal(
      anonymousPublic.json.collection.visibleIdeaCount,
      1,
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
      [],
      "anonymous public filtering cannot infer unlisted membership",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`, {
        userId: users.owner,
      }),
      [ideas.public, ideas.unlisted, ideas.ownerPrivate],
      "public collection owner sees unlisted and independently owned private ideas",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`, {
        userId: users.editor,
      }),
      [ideas.public, ideas.unlisted],
      "public collection editor sees unlisted but not private ideas",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`, {
        userId: users.viewer,
      }),
      [ideas.public, ideas.unlisted],
      "public collection viewer sees unlisted but not private ideas",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.public}/ideas`, {
        userId: users.stranger,
      }),
      [ideas.public, ideas.unlisted, ideas.strangerPrivate],
      "idea author sees their own restricted ideas without becoming a collaborator",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.unlisted}/ideas`),
      [ideas.public, ideas.unlisted],
      "unlisted collection URL reveals link-accessible ideas only",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.private}/ideas`, {
        userId: users.viewer,
      }),
      [ideas.public, ideas.unlisted],
      "private collection viewer sees public and unlisted ideas only",
    );
    await assertIdeaIds(
      await request(`/api/collections/${collections.private}/ideas`, {
        userId: users.owner,
      }),
      [ideas.public, ideas.unlisted, ideas.ownerPrivate],
      "private collection owner still sees only independently owned private ideas",
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
