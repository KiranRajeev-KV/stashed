import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/*
 * Allowed lifecycle states for an idea.
 *
 * Drizzle uses these values for TypeScript inference.
 * SQLite itself does NOT enforce these values because we intentionally
 * chose not to add a CHECK constraint, making future status additions easier.
 */
export const ideaStatusValues = [
  "DRAFT",
  "ACTIVE",
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "ARCHIVED",
] as const;

export type IdeaStatus = (typeof ideaStatusValues)[number];

/*
 * Users inside Stashed.
 *
 * This table contains only Stashed-specific user information.
 * Authentication-provider information such as GitHub IDs, usernames,
 * emails, and avatars belongs in `user_identities`.
 */
export const users = sqliteTable("users", {
  // Public/internal Stashed user identifier.
  // SQLite/D1 stores UUIDs as TEXT.
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  // Name shown inside Stashed.
  displayName: text("display_name").notNull(),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date()),
});

/*
 * External authentication identities associated with Stashed users.
 *
 * Example:
 *
 * provider          = "github"
 * providerUserId    = "145009677"
 * providerUsername  = "KiranRajeev-KV"
 *
 * `provider + providerUserId` identifies the external account.
 * Profile information such as username/email/avatar is cached metadata
 * and may change over time.
 */
export const userIdentities = sqliteTable(
  "user_identities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    // Stashed user that owns this external identity.
    userId: text("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    // Authentication provider, e.g. "github".
    provider: text("provider").notNull(),

    // Stable identifier assigned by the provider.
    // For GitHub, store the numeric GitHub user ID as a string.
    providerUserId: text("provider_user_id").notNull(),

    // Provider-specific username/login.
    providerUsername: text("provider_username"),

    // Provider-reported email, if available.
    providerEmail: text("provider_email"),

    // Provider-reported profile picture, if available.
    providerAvatarUrl: text("provider_avatar_url"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    /*
     * The same external identity cannot be linked to multiple
     * Stashed users.
     */
    uniqueIndex("user_identities_provider_user_id_unique").on(
      table.provider,
      table.providerUserId,
    ),

    // Used to fetch identities belonging to a Stashed user.
    index("user_identities_user_id_idx").on(table.userId),
  ],
);

/*
 * Ideas stored in Stashed.
 *
 * `row_id` is the SQLite-native integer primary key used internally,
 * especially for the FTS5 relationship.
 *
 * `id` is the UUID exposed by the application/API and should be used
 * everywhere outside the database's internal FTS implementation.
 */
export const ideas = sqliteTable(
  "ideas",
  {
    /*
     * Internal SQLite identity.
     *
     * FTS5 requires an integer row ID when using an external-content table.
     * This value does not need to be exposed by the API.
     */
    rowId: integer("row_id").primaryKey(),

    /*
     * Public idea identifier.
     *
     * URLs/API responses should use this UUID rather than row_id.
     */
    id: text("id")
      .notNull()
      .unique()
      .$defaultFn(() => crypto.randomUUID()),

    // Short human-readable title.
    title: text("title").notNull(),

    // Main idea body. This can contain Markdown at the application layer.
    content: text("content").notNull(),

    /*
     * Lifecycle state.
     *
     * Drizzle gives this column the TypeScript union:
     *
     * DRAFT | ACTIVE | PLANNED | IN_PROGRESS | COMPLETED | ARCHIVED
     *
     * New ideas default to DRAFT.
     */
    status: text("status", {
      enum: ideaStatusValues,
    })
      .notNull()
      .default("DRAFT"),

    // Stashed user who created the idea.
    authorId: text("author_id")
      .notNull()
      .references(() => users.id),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Used for queries such as "all ideas created by this user".
    index("ideas_author_id_idx").on(table.authorId),
  ],
);

/*
 * Reusable tags.
 *
 * Examples:
 *   backend
 *   minecraft
 *   infrastructure
 */
export const tags = sqliteTable(
  "tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    name: text("name").notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`)
      .$onUpdate(() => new Date()),
  },
  (table) => [
    /*
     * Case-insensitive uniqueness.
     *
     * These should all represent the same tag:
     *
     * backend
     * Backend
     * BACKEND
     */
    uniqueIndex("tags_name_lower_unique").on(sql`lower(${table.name})`),
  ],
);

/*
 * Many-to-many relationship between ideas and tags.
 *
 * One idea can have many tags.
 * One tag can belong to many ideas.
 *
 * A separate UUID is unnecessary because `(idea_id, tag_id)` uniquely
 * identifies the relationship.
 */
export const ideaTags = sqliteTable(
  "idea_tags",
  {
    /*
     * References the public UUID rather than ideas.row_id.
     *
     * row_id is deliberately kept as an internal SQLite/FTS implementation
     * detail.
     */
    ideaId: text("idea_id")
      .notNull()
      .references(() => ideas.id, {
        onDelete: "cascade",
      }),

    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, {
        onDelete: "cascade",
      }),

    // When this tag was attached to this idea.
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    // Prevent attaching the same tag to the same idea more than once.
    primaryKey({
      columns: [table.ideaId, table.tagId],
    }),

    // Supports the inverse query: "find every idea with this tag".
    index("idea_tags_tag_id_idx").on(table.tagId),
  ],
);
