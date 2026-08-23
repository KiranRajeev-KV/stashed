# Tags API

The Tags API provides authenticated, read-only tag discovery. Tags are still
created and resolved only through the Ideas API.

## Structure

- `routes.ts` defines the Hono route and applies session authentication.
- `schemas.ts` validates tag discovery query parameters.
- `service.ts` defines the response shape.
- `../db/tags.ts` contains the filtered, paginated Drizzle query.

The route uses the request-scoped Drizzle instance placed in Hono context by
the database middleware.

## Endpoint

`GET /api/tags` returns tags currently attached to at least one idea.

Examples:

```text
GET /api/tags
GET /api/tags?q=back
GET /api/tags?limit=20&offset=20
```

Supported query parameters:

- `q` is an optional, case-insensitive tag-name prefix of 1–50 characters.
- `limit` is an integer from 1–100 and defaults to 50.
- `offset` is an integer from 0–10,000 and defaults to 0.

For example, `q=back` matches `backend` and `backend-infra`, but not
`fallback`.

The response includes the effective pagination values and whether another row
exists after the current page:

```json
{
  "tags": [
    {
      "id": "5df04a60-4b71-44b7-b98d-b8c9fddd62bb",
      "name": "backend",
      "ideaCount": 4
    }
  ],
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

Results are ordered by `ideaCount` descending, then case-insensitively by name
ascending. An additional stored-name comparison makes ordering deterministic
when names have the same lowercase representation. This ordering is preserved
when prefix search and pagination are used.

The database query reads the materialized `tags.idea_count` value, maintained by
`idea_tags` insert and delete triggers. It filters to `idea_count > 0` and uses
the `tags_idea_count_name_key_idx` index for its popularity-first order.
Consequently:

- tags with no idea relationships remain stored but are not returned;
- one tag used by multiple ideas reports the correct count;
- duplicate relationships cannot inflate the count (and are also prevented by
  the `idea_tags` composite primary key).

The service fetches one row beyond the requested limit to calculate `hasMore`;
that extra row is not returned. Prefix matching uses the stored `name_key`
column with an escaped `LIKE` prefix. Both `name_key` and the database's
`UNIQUE(lower(name))` constraint retain SQLite's ASCII-only case-folding
limitation.

The endpoint requires a valid Stashed session cookie. Unauthenticated requests
use the standard API error response:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

There are intentionally no tag create, update, or delete endpoints.
