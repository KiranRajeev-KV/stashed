# ADR-0001: Defer Additional D1 Optimizations

## Status

Accepted on 2026-08-23.

## Context

The D1 query audit found expensive historical query shapes in Insights, but the
current `main` branch already eliminates the user lookup from request
authentication, batches tag lookups, and replaces tag aggregation with
materialized tag counts. Those changes have not yet been deployed, so the D1
Insights data still describes the previous Worker.

At the time of this decision, production contains 31 ideas, 8 users, 8
identities, 42 tags, and 46 idea-tag relationships. The database uses an APAC
primary and has D1 read replication disabled.

The audit considered four additional changes:

1. Add a separate case-insensitive prefix index for tag typeahead.
2. Cache tag discovery in Workers KV.
3. Enable D1 read replication and use the D1 Sessions API.
4. Add further indexes for idea status and `(user_id, provider)` identities.

## Decision

Defer all four changes. Deploy the existing `main` changes first, then use D1
Insights and query plans to decide whether a new ADR should supersede this one.

The current indexed D1 tag-discovery query remains the source of truth; do not
introduce a Workers KV cache at this stage.

## Consequences

Positive:

- Avoids index maintenance, KV invalidation, replica-consistency, and bookmark
  propagation complexity before the workload demonstrates a need.
- Keeps tag discovery strongly current after idea/tag edits.
- Preserves low write cost and a smaller database while the data set is small.
- Avoids implementing read replication before there is evidence of
  geographically distributed latency.

Negative:

- Tag prefix search cannot seek directly by `name_key`; the current index first
  selects tags with `idea_count > 0` and then applies the prefix filter.
- Reads continue to use the D1 primary, so globally distant users may see
  higher database latency.
- Status-filtered lists continue to scan and sort ideas at the current scale.

## Revisit Triggers

Create a superseding ADR when any applicable condition is met:

| Deferred change         | Revisit when                                                                                                                                 | Verify before changing                                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Tag prefix index        | Tag discovery becomes a top D1 read consumer after deployment, or the tag catalog reaches several hundred active tags.                       | Run `EXPLAIN QUERY PLAN` for the actual prefix query and compare rows read with and without an index on `name_key COLLATE NOCASE`. |
| Workers KV cache        | The direct tag-discovery query remains costly after the materialized-count deployment and a short period of stale tag results is acceptable. | Define TTL, invalidation on all tag-link writes, and a read-after-write UX policy.                                                 |
| Read replication        | Users outside APAC have measured database latency issues or read volume needs scale-out capacity.                                            | Enable it in D1 settings, design bookmark propagation, and define which requests use `first-primary` versus `first-unconstrained`. |
| Status/identity indexes | Insights identifies a status-filtered or identity lookup query with substantial rows-read overhead after data growth.                        | Use the complete production query, `EXPLAIN QUERY PLAN`, data distribution, and write-cost impact to choose a composite index.     |

## Evidence

- The 2026-08-23 D1 audit recorded 1,002 reads and 54,109 rows read in the
  preceding 24 hours.
- The historical user lookup ran 1,622 times over seven days. It is addressed
  in the undeployed `main` branch by session-only authentication and a cached
  `GET /api/auth/me` query.
- The historical feed tag lookup ran 772 times and tag discovery aggregation
  ran 755 times over seven days. Both are replaced in `main` by the batched tag
  lookup and materialized `tags.idea_count` design.
- Production confirms the `tags_idea_count_name_key_idx` index is used for tag
  discovery, while a status-filtered idea list currently scans and sorts the
  small `ideas` table.
