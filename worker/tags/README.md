# Tags API

The Tags API provides authenticated, read-only tag discovery. Tags are still
created and resolved only through the Ideas API.

## Structure

- `routes.ts` defines the Hono route and applies session authentication.
- `service.ts` defines the response shape.
- `../db/tags.ts` contains the grouped Drizzle query.

The route uses the request-scoped Drizzle instance placed in Hono context by
the database middleware.

## Endpoint

`GET /api/tags` returns every tag currently attached to at least one idea:

```json
{
  "data": [
    {
      "id": "5df04a60-4b71-44b7-b98d-b8c9fddd62bb",
      "name": "backend",
      "ideaCount": 4
    }
  ]
}
```

Results are ordered by `ideaCount` descending, then case-insensitively by name
ascending. An additional stored-name comparison makes ordering deterministic
when names have the same lowercase representation.

The database query uses an inner join between `tags` and `idea_tags`, groups by
tag, and counts distinct idea IDs. Consequently:

- tags with no idea relationships remain stored but are not returned;
- one tag used by multiple ideas reports the correct count;
- duplicate relationships cannot inflate the count (and are also prevented by
  the `idea_tags` composite primary key).

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
