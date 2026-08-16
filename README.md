# Stashed

A place for ideas worth keeping.

A full-stack web app — React frontend + Hono API running together on a single Cloudflare Worker, backed by Cloudflare D1 with Drizzle ORM.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Router, TanStack Query
- **Backend:** Hono on Cloudflare Workers (serves the SPA and the API from one Worker)
- **Database:** Cloudflare D1 + Drizzle ORM
- **Tooling:** pnpm, just, Oxlint, Prettier, Wrangler

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io)
- [just](https://just.systems) (optional — you can use the npm scripts directly)
- A Cloudflare account (only needed for deploying and `db:remote`)

## Quickstart

```sh
pnpm install
pnpm dev
```

Open http://localhost:5173. Confirm the server is up with:

```sh
curl http://localhost:5173/api/health
# {"ok":true,"app":"Stashed"}
```

## Scripts

Run `just` to list every recipe. The ones you'll use most:

| Command            | What it does                                              |
| ------------------ | --------------------------------------------------------- |
| `just dev`         | Start the dev server (SPA + Worker) at localhost:5173     |
| `just build`       | Type-check + production build                             |
| `just check`       | lint + format-check + typecheck + build (pre-commit gate) |
| `just deploy`      | Build, then deploy to Cloudflare                          |
| `just db-generate` | Generate Drizzle migrations from the schema               |
| `just db-local`    | Apply migrations to the local D1 database                 |
| `just db-remote`   | Apply migrations to the remote D1 database                |
| `just clean`       | Remove build artifacts (dist, .wrangler, tsbuildinfo)     |
