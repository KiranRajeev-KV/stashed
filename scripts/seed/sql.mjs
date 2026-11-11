import assert from "node:assert/strict";
import { z } from "zod";
import {
  ideaStatusValues,
  ideaVisibilityValues,
  collectionVisibilityValues,
  collectionCollaboratorRoleValues,
} from "../../worker/db/schema.ts";
import { markdownToPlainText } from "../../worker/ideas/markdown.ts";

export const quote = (value) => `'${String(value).replaceAll("'", "''")}'`;
const timestamp = (value) => z.number().finite().parse(Date.parse(value));
const userId = (providerId) =>
  `(SELECT user_id FROM user_identities WHERE provider = 'github' AND provider_user_id = ${quote(providerId)})`;
const inList = (values) => values.map(quote).join(", ");
const unique = (values) =>
  assert.equal(
    new Set(values).size,
    values.length,
    "Fixture keys must be unique",
  );

export function validateFixtures(fixtures) {
  const { users, tags, ideas, collections, attempts } = fixtures;
  for (const ids of [
    users.map((u) => u.id),
    users.map((u) => u.identityId),
    tags.map(([id]) => id),
    ideas.map((i) => i.id),
    collections.map((c) => c.id),
    attempts.map((a) => a.id),
  ]) {
    unique(ids);
    ids.forEach((id) => z.uuid().parse(id));
  }
  unique(users.map((u) => u.providerUserId));
  unique(tags.map(([, name]) => name.toLocaleLowerCase("en-US")));
  const providers = new Set(users.map((u) => u.providerUserId));
  const ideaIds = new Set(ideas.map((i) => i.id));
  const tagNames = new Set(tags.map(([, name]) => name));
  tags.forEach(([, name]) => z.string().trim().min(1).max(50).parse(name));
  for (const idea of ideas) {
    z.enum(ideaStatusValues).parse(idea.status);
    z.enum(ideaVisibilityValues).parse(idea.visibility);
    z.string().trim().min(1).max(200).parse(idea.title);
    z.string().max(200_000).parse(idea.content);
    assert(providers.has(idea.author));
    assert(idea.tags.length <= 20);
    unique(idea.tags);
    idea.tags.forEach((name) => assert(tagNames.has(name)));
    assert(timestamp(idea.updatedAt) >= timestamp(idea.createdAt));
  }
  for (const collection of collections) {
    z.enum(collectionVisibilityValues).parse(collection.visibility);
    z.string().trim().min(1).max(200).parse(collection.name);
    z.string().max(2000).parse(collection.description);
    assert(providers.has(collection.owner));
    assert(timestamp(collection.updatedAt) >= timestamp(collection.createdAt));
    unique(collection.ideas.map((i) => i.ideaId));
    unique(collection.collaborators.map((c) => c.user));
    for (const member of collection.ideas) {
      assert(ideaIds.has(member.ideaId));
      const idea = ideas.find((candidate) => candidate.id === member.ideaId);
      assert(
        idea.visibility !== "PRIVATE" || member.addedBy === idea.author,
        "Only the author can access a private Idea to add it to a Collection",
      );
      assert(
        timestamp(collection.updatedAt) >= timestamp(idea.createdAt),
        "Membership cannot predate its Idea",
      );
      assert(
        [
          collection.owner,
          ...collection.collaborators
            .filter((c) => c.role === "EDITOR")
            .map((c) => c.user),
        ].includes(member.addedBy),
      );
    }
    for (const collaborator of collection.collaborators) {
      assert(providers.has(collaborator.user));
      assert.notEqual(collaborator.user, collection.owner);
      z.enum(collectionCollaboratorRoleValues).parse(collaborator.role);
    }
  }
  for (const attempt of attempts) {
    assert(providers.has(attempt.user));
    timestamp(attempt.at);
    z.number().int().nonnegative().nullable().parse(attempt.tokens);
    z.number().int().min(100).max(599).nullable().parse(attempt.status);
  }
}

export function buildSeedSql(fixtures) {
  validateFixtures(fixtures);
  const { users, tags, ideas, collections, attempts } = fixtures;
  const seedAt = timestamp("2026-06-01T00:00:00.000Z");
  const ideaIds = inList(ideas.map((i) => i.id));
  const collectionIds = inList(collections.map((c) => c.id));
  const statements = [
    "-- Local development fixtures. Executed atomically by Wrangler's local D1 batch.",
  ];
  for (const user of users) {
    // Reuse an existing login without overwriting its profile or creating an orphan.
    statements.push(`INSERT INTO users (id, display_name, created_at, updated_at)
      SELECT ${quote(user.id)}, ${quote(user.displayName)}, ${seedAt}, ${seedAt}
      WHERE NOT EXISTS (SELECT 1 FROM user_identities WHERE provider = 'github' AND provider_user_id = ${quote(user.providerUserId)})
      ON CONFLICT(id) DO NOTHING;`);
    statements.push(`INSERT INTO user_identities (id, user_id, provider, provider_user_id, provider_username, provider_email, provider_avatar_url, created_at, updated_at)
      VALUES (${quote(user.identityId)}, COALESCE(${userId(user.providerUserId)}, ${quote(user.id)}), 'github', ${quote(user.providerUserId)}, ${quote(user.username)}, ${user.email === null ? "NULL" : quote(user.email)}, NULL, ${seedAt}, ${seedAt})
      ON CONFLICT(provider, provider_user_id) DO NOTHING;`);
  }
  for (const [id, name] of tags) {
    statements.push(`INSERT INTO tags (id, name, name_key, created_at, updated_at)
      SELECT ${quote(id)}, ${quote(name)}, ${quote(name.toLocaleLowerCase("en-US"))}, ${seedAt}, ${seedAt}
      WHERE NOT EXISTS (SELECT 1 FROM tags WHERE lower(name) = lower(${quote(name)}))
      ON CONFLICT(id) DO NOTHING;`);
  }
  for (const idea of ideas) {
    statements.push(`INSERT INTO ideas (id, title, content, content_plain, status, visibility, author_id, created_at, updated_at)
      VALUES (${quote(idea.id)}, ${quote(idea.title)}, ${quote(idea.content)}, ${quote(markdownToPlainText(idea.content))}, ${quote(idea.status)}, ${quote(idea.visibility)}, ${userId(idea.author)}, ${timestamp(idea.createdAt)}, ${timestamp(idea.updatedAt)})
      ON CONFLICT(id) DO UPDATE SET title=excluded.title, content=excluded.content, content_plain=excluded.content_plain, status=excluded.status, visibility=excluded.visibility, author_id=excluded.author_id, created_at=excluded.created_at, updated_at=excluded.updated_at;`);
  }
  statements.push(`DELETE FROM idea_tags WHERE idea_id IN (${ideaIds});`);
  for (const [id, name] of fixtures.retiredTags ?? []) {
    // Remove only obsolete fixture tags that no longer have any links.
    statements.push(`DELETE FROM tags WHERE id=${quote(id)} AND name=${quote(name)}
      AND NOT EXISTS (SELECT 1 FROM idea_tags WHERE tag_id=${quote(id)});`);
  }
  for (const idea of ideas) {
    for (const tag of idea.tags) {
      statements.push(
        `INSERT INTO idea_tags (idea_id, tag_id, created_at) SELECT ${quote(idea.id)}, id, ${timestamp(idea.createdAt)} FROM tags WHERE lower(name) = lower(${quote(tag)});`,
      );
    }
  }
  for (const collection of collections) {
    statements.push(`INSERT INTO collections (id, name, description, icon, visibility, owner_id, created_at, updated_at)
      VALUES (${quote(collection.id)}, ${quote(collection.name)}, ${quote(collection.description)}, ${quote(collection.icon)}, ${quote(collection.visibility)}, ${userId(collection.owner)}, ${timestamp(collection.createdAt)}, ${timestamp(collection.updatedAt)})
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, description=excluded.description, icon=excluded.icon, visibility=excluded.visibility, owner_id=excluded.owner_id, created_at=excluded.created_at, updated_at=excluded.updated_at;`);
  }
  statements.push(
    `DELETE FROM collection_ideas WHERE collection_id IN (${collectionIds});`,
  );
  statements.push(
    `DELETE FROM collection_collaborators WHERE collection_id IN (${collectionIds});`,
  );
  for (const collection of collections) {
    for (const collaborator of collection.collaborators) {
      statements.push(`INSERT INTO collection_collaborators (collection_id, user_id, role, created_at, updated_at)
        VALUES (${quote(collection.id)}, ${userId(collaborator.user)}, ${quote(collaborator.role)}, ${timestamp(collection.createdAt)}, ${timestamp(collection.createdAt)});`);
    }
    for (const member of collection.ideas) {
      statements.push(`INSERT INTO collection_ideas (collection_id, idea_id, added_by_user_id, created_at)
        VALUES (${quote(collection.id)}, ${quote(member.ideaId)}, ${userId(member.addedBy)}, ${timestamp(collection.updatedAt)});`);
    }
  }
  // Triggers own quota counters and token totals. Never seed counters separately:
  // BEFORE INSERT triggers also run for ON CONFLICT DO NOTHING, so exclude
  // existing attempt IDs in the SELECT before the trigger can execute.
  statements.push(
    `CREATE TABLE _stashed_seed_control_snapshot AS SELECT * FROM tag_suggestion_control WHERE id = 1;`,
  );
  statements.push(
    `UPDATE tag_suggestion_control SET enabled = 1, user_daily_limit = 2147483647, global_monthly_limit = 2147483647 WHERE id = 1;`,
  );
  for (const attempt of attempts) {
    statements.push(`INSERT INTO tag_suggestion_attempts (id, user_id, utc_day, utc_month, created_at)
      SELECT ${quote(attempt.id)}, ${userId(attempt.user)}, ${quote(attempt.at.slice(0, 10))}, ${quote(attempt.at.slice(0, 7))}, ${timestamp(attempt.at)}
      WHERE NOT EXISTS (SELECT 1 FROM tag_suggestion_attempts WHERE id = ${quote(attempt.id)});`);
    if (attempt.tokens !== null || attempt.status !== null) {
      statements.push(`UPDATE tag_suggestion_attempts SET provider_status = ${attempt.status ?? "NULL"}, input_tokens = ${attempt.tokens ?? "NULL"}
        WHERE id = ${quote(attempt.id)} AND input_tokens IS NULL AND provider_status IS NULL;`);
    }
  }
  statements.push(`UPDATE tag_suggestion_control SET
    enabled = (SELECT enabled FROM _stashed_seed_control_snapshot),
    user_daily_limit = (SELECT user_daily_limit FROM _stashed_seed_control_snapshot),
    global_monthly_limit = (SELECT global_monthly_limit FROM _stashed_seed_control_snapshot)
    WHERE id = 1;`);
  statements.push("DROP TABLE _stashed_seed_control_snapshot;");
  // CHECK guards live inside the same batch, so a verification failure rolls
  // back every fixture write, including the temporary kill-switch change.
  statements.push(
    "CREATE TABLE _stashed_seed_assertions (problem TEXT, violations INTEGER NOT NULL CHECK(violations = 0));",
  );
  const check = (label, query) =>
    statements.push(
      `INSERT INTO _stashed_seed_assertions VALUES (${quote(label)}, (${query}));`,
    );
  const expectedCounts = [
    [
      "users",
      `SELECT count(*) FROM user_identities WHERE provider='github' AND provider_user_id IN (${inList(users.map((u) => u.providerUserId))})`,
      users.length,
    ],
    [
      "tags",
      `SELECT count(*) FROM tags WHERE lower(name) IN (${inList(tags.map(([, name]) => name.toLowerCase()))})`,
      tags.length,
    ],
    [
      "ideas",
      `SELECT count(*) FROM ideas WHERE id IN (${ideaIds})`,
      ideas.length,
    ],
    [
      "idea_tags",
      `SELECT count(*) FROM idea_tags WHERE idea_id IN (${ideaIds})`,
      ideas.reduce((n, i) => n + i.tags.length, 0),
    ],
    [
      "collections",
      `SELECT count(*) FROM collections WHERE id IN (${collectionIds})`,
      collections.length,
    ],
    [
      "collaborators",
      `SELECT count(*) FROM collection_collaborators WHERE collection_id IN (${collectionIds})`,
      collections.reduce((n, c) => n + c.collaborators.length, 0),
    ],
    [
      "memberships",
      `SELECT count(*) FROM collection_ideas WHERE collection_id IN (${collectionIds})`,
      collections.reduce((n, c) => n + c.ideas.length, 0),
    ],
    [
      "attempts",
      `SELECT count(*) FROM tag_suggestion_attempts WHERE id IN (${inList(attempts.map((a) => a.id))})`,
      attempts.length,
    ],
  ];
  for (const [label, query, expected] of expectedCounts)
    check(label, `SELECT abs((${query}) - ${expected})`);
  check("foreign keys", "SELECT count(*) FROM pragma_foreign_key_check");
  check(
    "tag counters",
    `SELECT count(*) FROM tags t WHERE t.idea_count != (SELECT count(*) FROM idea_tags WHERE tag_id=t.id)
    OR t.public_idea_count != (SELECT count(*) FROM idea_tags it JOIN ideas i ON i.id=it.idea_id WHERE it.tag_id=t.id AND i.visibility='PUBLIC')`,
  );
  check(
    "user quota counters",
    `SELECT count(*) FROM tag_suggestion_user_usage u WHERE u.attempts != (SELECT count(*) FROM tag_suggestion_attempts a WHERE a.user_id=u.user_id AND a.utc_day=u.utc_day)`,
  );
  check(
    "global quota counters",
    `SELECT count(*) FROM tag_suggestion_global_usage u WHERE u.attempts != (SELECT count(*) FROM tag_suggestion_attempts a WHERE a.utc_month=u.utc_month)
    OR u.input_tokens != (SELECT COALESCE(sum(input_tokens), 0) FROM tag_suggestion_attempts a WHERE a.utc_month=u.utc_month)`,
  );
  statements.push("DROP TABLE _stashed_seed_assertions;");
  statements.push(
    "INSERT INTO ideas_fts(ideas_fts, rank) VALUES ('integrity-check', 1);",
  );
  statements.push(
    "INSERT INTO collections_fts(collections_fts, rank) VALUES ('integrity-check', 1);",
  );
  statements.push(
    `SELECT ${expectedCounts.map(([label, query]) => `(${query}) AS ${label}`).join(", ")};`,
  );
  return statements.join("\n\n");
}
