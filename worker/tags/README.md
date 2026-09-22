# Tags API

The Tags API provides public, read-only tag discovery and authenticated,
on-demand Jev suggestions. Tags are still created and resolved only through
the Ideas API.

## Structure

- `routes.ts` defines the Hono routes and authenticates suggestions.
- `schemas.ts` validates tag discovery query parameters.
- `service.ts` defines the response shape.
- `../db/tags.ts` contains the filtered, paginated Drizzle query.
- `jev.ts` scores eligible existing tags; `quota.ts` reserves attempts in D1.

The route uses the request-scoped Drizzle instance placed in Hono context by
the database middleware.

## Endpoint

`GET /api/tags` returns tags currently attached to at least one public idea.

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

The database query reads the materialized `tags.public_idea_count` value,
maintained by `idea_tags` and idea-visibility triggers. It filters to
`public_idea_count > 0` and uses the `tags_public_idea_count_name_key_idx`
index for its popularity-first order. This avoids exposing tags that occur only
on unlisted or private ideas.
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

There are intentionally no tag create, update, or delete endpoints.

## On-demand suggestions

`POST /api/tags/suggestions` requires a signed-in session and the normal
same-origin request headers. It accepts the unsaved form state:

```json
{
  "title": "Build a backup system",
  "content": "Markdown notes",
  "tags": ["backend"]
}
```

The request requires a nonempty title or plain-text notes and fewer than 20
selected tags. The response is `{ "tags": [{ "id": "...", "name": "..." }] }`,
up to five existing tags in relevance order. It never creates or attaches a
tag. No candidates is a successful empty result and does not spend quota.

The candidate shortlist is the 100 most recently linked distinct tags on
public ideas or the requesting author's own ideas. Links to other authors'
private or unlisted ideas are never included. Already-selected names are
removed after the 100-tag limit without backfilling older tags.

The provider sees the title, up to 4,000 plain-text note characters, and each
candidate tag name. It receives no selected tags. The Worker uses one Jev
request per button press, with a 15-second timeout and a bounded response.
Provider failures return `SUGGESTIONS_PROVIDER_ERROR` (503); a disabled or
unconfigured feature returns `SUGGESTIONS_UNAVAILABLE` (503); exhausted daily
or monthly allowances return `SUGGESTIONS_QUOTA_REACHED` (429). These errors
leave manual tagging unaffected.

The D1 control row starts disabled. Each outbound attempt atomically checks
the switch and increments a 10/user/UTC-day and 1,500/global/UTC-month
allowance. Provider errors consume an attempt. The per-month usage row tracks
reported input tokens; `0.042 * input_tokens / 1_000_000` is the approximate
input charge in USD at the initial listed price. Do not log or expose API keys
or idea text.

For local development, put `TYPESAFE_API_KEY` only in the ignored `.env` file.
For deployment, provision `TYPESAFE_API_KEY` as a Worker secret (for example,
`pnpm exec wrangler secret put TYPESAFE_API_KEY`) before enabling the control
row. Never copy the real value into `.env.example` or the browser.
