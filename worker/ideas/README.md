# Ideas API

The Ideas API is a Hono API backed by Cloudflare D1 and Drizzle ORM. Public
ideas are readable by anyone through a direct link; authors can additionally
read their own private ideas. Only an idea's author can update or delete it.

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

Create, update, and delete endpoints require a valid Stashed session cookie.
Read endpoints use a session when present to include the author's own ideas.

## Access and distribution

`access` is `PUBLIC` or `PRIVATE`; `distribution` is `LISTED`,
`COLLECTIONS_ONLY`, or `UNLISTED`. Direct detail reads allow any public idea
and only the author of a private idea. `distribution` remains stored when an
idea becomes private, so switching it back to public restores its placement.

| Surface                          | Idea policy                                           |
| -------------------------------- | ----------------------------------------------------- |
| `/api/ideas` default `DISCOVER`  | Public listed only                                    |
| `/api/ideas?scope=MINE`          | Authenticated author's ideas, including hidden        |
| `/api/search` default `DISCOVER` | Public listed plus the requester's private ideas      |
| `/api/search?scope=MINE`         | Authenticated author's ideas, including public hidden |
| Direct detail                    | Public ideas or the private idea's author             |
| Tag discovery                    | Public listed only                                    |

Collection-local policy additionally requires access to the collection. It
includes public listed, public collections-only, and the requester's private
ideas, but never public unlisted. All list and search predicates run in SQL
before sorting and pagination. `policy.ts` defines the same decisions for
in-memory checks, Drizzle queries, and parameterized FTS SQL.

Malformed legacy `visibility` query values fall back to public discovery.
The `visibility` request/response field is retained during the frontend
transition. New writes should use `access` and `distribution`; a request may
not mix these with `visibility`. The legacy projection is `PUBLIC/LISTED →
PUBLIC`, `PUBLIC/*hidden → UNLISTED`, and `PRIVATE/* → PRIVATE`.

## List ideas

`GET /api/ideas` accepts these query parameters:

| Parameter      | Behavior                                         |
| -------------- | ------------------------------------------------ |
| `status`       | Filter by one of the configured idea statuses    |
| `scope`        | `DISCOVER` (default) or authenticated `MINE`     |
| `access`       | Filter by `PUBLIC` or `PRIVATE` within the scope |
| `distribution` | Filter by stored distribution within the scope   |
| `sort`         | Order results; defaults to `UPDATED_DESC`        |
| `tagId`        | Filter by one or more tag UUIDs (repeat the key) |
| `cursor`       | Continue after an opaque pagination cursor       |
| `limit`        | Page size; defaults to `20` and is at most `50`  |

Multiple `tagId` values use AND matching: an idea is included only when it has
every selected tag. A single `tagId` remains supported for backwards
compatibility.

Sort accepts `UPDATED_DESC` (default), `CREATED_DESC`, `CREATED_ASC`,
`NAME_ASC`, or `NAME_DESC`. The cursor is tied to its sort order and does not expose
`ideas.row_id` or full idea content:

```json
{
  "ideas": [
    {
      "id": "7bc599f8-6fd3-4784-8c8b-b45ef1ab12c9",
      "title": "Build a search page",
      "excerpt": "Add filters and keyboard navigation…",
      "status": "DRAFT",
      "access": "PUBLIC",
      "distribution": "LISTED",
      "visibility": "PUBLIC",
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
  "access": "PUBLIC",
  "distribution": "UNLISTED",
  "tags": ["frontend", "search"]
}
```

`status`, `access`, `distribution`, and `tags` are optional when creating an idea. Missing
values use `DRAFT`, `PUBLIC`, and `LISTED`. The API obtains `author_id` exclusively from
the authenticated session; it is not accepted in request JSON.

PATCH requests may contain `title`, `content`, `status`, `access`, `distribution`, or `tags`:

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

Tags also store an application-generated `name_key`, but SQLite's
`UNIQUE(lower(name))` constraint and the legacy migration trigger use
ASCII-only case-folding. Unicode tag names are accepted, but differently cased
non-ASCII names are not guaranteed to resolve to one database tag. Full Unicode
uniqueness remains deferred until Stashed defines a normalization and
case-folding policy that is enforced consistently by the application and
database.

## Search

`GET /api/search` requires `q` and accepts `scope`, `status`, `access`,
`distribution`, repeated `tagId`, `sort`, `limit`, and `offset`. Its default
scope includes listed public ideas and the requester's private ideas. `sort` defaults to
`UPDATED_DESC` and accepts the same values as the ideas list endpoint:

```text
GET /api/search?q=cloudflare+d1&status=ACTIVE&access=PUBLIC&sort=NAME_ASC&limit=20&offset=0
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

Results use the selected sort, with recently updated first by default. Titles and
excerpts are returned as plain text.

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
- Access: `PUBLIC` or `PRIVATE`; distribution: `LISTED`, `COLLECTIONS_ONLY`, or `UNLISTED`
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
    visibility: "PRIVATE",
    tags: ["test"],
  }),
}).then((response) => response.json());
```

Run the repository quality gate after changes:

```sh
just check
```
