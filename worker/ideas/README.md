# Ideas API

The Ideas API is an authenticated Hono API backed by Cloudflare D1 and
Drizzle ORM. All authenticated users can read ideas, while only an idea's
author can update or delete it.

## Structure

- `routes.ts` defines the Hono routes and applies session and Zod validation.
- `schemas.ts` contains request parameter, query, and JSON body schemas.
- `service.ts` contains idea-domain rules and response serialization.
- `../db/ideas.ts` contains Drizzle queries, transactional writes, pagination,
  tag resolution, and the raw parameterized FTS5 search query.

The routes use the request-scoped Drizzle instance placed in Hono context by
the database middleware. They do not create global database state.

## Endpoints

| Method   | Endpoint         | Description                                    |
| -------- | ---------------- | ---------------------------------------------- |
| `GET`    | `/api/ideas`     | List ideas with cursor pagination              |
| `GET`    | `/api/ideas/:id` | Get one idea with its full content             |
| `POST`   | `/api/ideas`     | Create an idea for the authenticated user      |
| `PATCH`  | `/api/ideas/:id` | Update an idea owned by the authenticated user |
| `DELETE` | `/api/ideas/:id` | Permanently delete an idea owned by the user   |
| `GET`    | `/api/search`    | Search and filter ideas through the FTS5 index |

Every endpoint requires a valid Stashed session cookie.

## List ideas

`GET /api/ideas` accepts these query parameters:

| Parameter | Behavior                                         |
| --------- | ------------------------------------------------ |
| `status`  | Filter by one of the configured idea statuses    |
| `sort`    | Order results; defaults to `UPDATED_DESC`        |
| `tagId`   | Filter by one or more tag UUIDs (repeat the key) |
| `cursor`  | Continue after an opaque pagination cursor       |
| `limit`   | Page size; defaults to `20` and is at most `50`  |

Multiple `tagId` values use AND matching: an idea is included only when it has
every selected tag. A single `tagId` remains supported for backwards
compatibility.

Sort accepts `UPDATED_DESC` (default), `CREATED_DESC`, `UPDATED_ASC`, or
`CREATED_ASC`. The cursor is tied to its sort order and does not expose
`ideas.row_id` or full idea content:

```json
{
  "ideas": [
    {
      "id": "7bc599f8-6fd3-4784-8c8b-b45ef1ab12c9",
      "title": "Build a search page",
      "excerpt": "Add filters and keyboard navigation…",
      "status": "DRAFT",
      "author": {
        "id": "c856838e-9e07-460e-ac93-ef2279082e97",
        "displayName": "KiranRajeev-KV",
        "username": "KiranRajeev-KV",
        "avatarUrl": "https://avatars.githubusercontent.com/u/145009677?v=4"
      },
      "tags": [
        { "id": "5df04a60-4b71-44b7-b98d-b8c9fddd62bb", "name": "frontend" }
      ],
      "createdAt": "2026-08-16T09:30:00.000Z",
      "updatedAt": "2026-08-16T09:30:00.000Z"
    }
  ],
  "nextCursor": null
}
```

## Create and update

Create an idea with:

```json
{
  "title": "Build a search page",
  "content": "Add filters and keyboard navigation.",
  "status": "DRAFT",
  "tags": ["frontend", "search"]
}
```

`status` and `tags` are optional when creating an idea. A missing status uses
`DRAFT`. The API obtains `author_id` exclusively from the authenticated
session; it is not accepted in request JSON.

PATCH requests may contain `title`, `content`, `status`, or `tags`:

- An omitted field remains unchanged.
- Omitted `tags` preserve the existing tag set.
- `"tags": []` removes all tags.
- A non-empty `tags` array replaces the complete tag set.
- An empty PATCH object is rejected.

Tag names are trimmed, limited to 50 characters, and deduplicated
case-insensitively in application code. Idea creation and tag replacement use
D1 transactional batches. Existing ASCII tag names are reused through the
database's `UNIQUE(lower(name))` constraint, including during concurrent
requests.

SQLite's built-in `lower()` only case-folds ASCII characters. Unicode tag names
are accepted, but differently cased non-ASCII names are not currently
guaranteed to resolve to one database tag. Full Unicode uniqueness is deferred
until tags have an application-generated normalized column with a defined
normalization and case-folding policy.

## Search

`GET /api/search` requires `q` and accepts `status`, repeated `tagId`, `sort`,
`limit`, and `offset`. It applies status and tag filters in the same way as the
ideas list endpoint. `sort` defaults to `UPDATED_DESC` and also accepts
`BEST_MATCH` for weighted FTS relevance:

```text
GET /api/search?q=cloudflare+d1&status=ACTIVE&sort=BEST_MATCH&limit=20&offset=0
```

Search uses the custom `ideas_fts` FTS5 table and joins matches back through
`ideas.row_id = ideas_fts.rowid`. It indexes `title` and the server-generated
`content_plain` text instead of raw Markdown. The tokenizer keeps `+` and `#`
inside terms, which makes technical terms such as `C++`, `C#`, and `#workers`
searchable.
Searches for `C++`, `C#`, and `C` remain distinct. A period remains a
separator, so a term such as `Node.js` is tokenized as `node` and `js`.
Each whitespace-separated query term is treated as a word prefix, so `arch`
matches tokens such as `archive`, `archived`, and `archaeology`. All terms must
match somewhere across the title or content.

Results use the selected date sort by default. `sort=BEST_MATCH` uses weighted
BM25 relevance, where title matches are weighted more heavily than content
matches. Titles and excerpts are returned as plain text.

The existing migration triggers keep FTS synchronized after insert, searchable
updates, and deletion. API code must not write directly to `ideas_fts`.

## Validation and errors

Current input limits are:

- Title: 1–200 trimmed characters
- Content: at most 200,000 characters; an empty body is allowed
- Tags per request: at most 20
- Tag name: 1–50 trimmed characters
- List/search limit: 1–50
- Search offset: 0–10,000
- Public idea and tag IDs: UUIDs

API errors use one shape:

```json
{
  "error": {
    "code": "IDEA_NOT_FOUND",
    "message": "Idea not found"
  }
}
```

Common codes are `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, and
`IDEA_NOT_FOUND`.

## Same-origin protection

Unsafe API methods (`POST`, `PUT`, `PATCH`, and `DELETE`) require an `Origin`
header that exactly matches the request origin. Cross-site Fetch Metadata is
also rejected. Browser `fetch()` requests provide these headers automatically.

For local command-line requests, include the local origin explicitly:

```sh
curl http://localhost:5173/api/ideas \
  --request POST \
  --header 'Content-Type: application/json' \
  --header 'Origin: http://localhost:5173' \
  --cookie 'stashed_session=YOUR_LOCAL_SESSION_COOKIE' \
  --data '{"title":"Test idea","content":"Test content","tags":["test"]}'
```

## Local verification

Start the local database and Worker:

```sh
pnpm db:local
pnpm dev
```

Authenticate through `/api/auth/github`, then call the API from the browser
console so the signed HttpOnly session cookie is sent automatically:

```js
await fetch("/api/ideas").then((response) => response.json());

await fetch("/api/ideas", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Test idea",
    content: "Test content",
    tags: ["test"],
  }),
}).then((response) => response.json());
```

Run the repository quality gate after changes:

```sh
just check
```
