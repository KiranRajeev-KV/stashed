<img src="./public/app_icon_dark.png" alt="Stashed app icon" width="96" height="96" />

# Stashed

Save ideas worth coming back to.

Stashed is a self-hosted, shared idea archive designed for small groups. Members
can save their own ideas, discover what others are thinking, and return to
useful thoughts later.

Each signed-in member can read the shared archive. Authors retain control of
their own ideas and are the only members who can edit or delete them.

Stashed is a full-stack web app: the React frontend and Hono API run together
on a single Cloudflare Worker, backed by Cloudflare D1 and Drizzle ORM.

<img width="1920" height="1200" alt="image" src="https://github.com/user-attachments/assets/2c86726f-cb87-4a82-be30-e1f0723b2a71" />

## Current Features

- GitHub authentication and registration
- A shared idea feed, ordered by recently updated ideas
- Author-owned idea creation, editing, and deletion
- Idea statuses for tracking how thoughts develop
- Searchable tags created as ideas are saved
- Full-text search across idea titles and content
- Markdown editing and rendering
- Responsive light and dark appearances

> [!IMPORTANT]
> Registration is currently open through GitHub. Anyone who can reach a
> deployed instance and authenticate with GitHub can register; Stashed does not
> currently include invitations or an approved-members list.

## Tech Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, TanStack Router, TanStack Query, TanStack Form, Plate
- **Backend:** Hono on Cloudflare Workers (serves the SPA and the API from one Worker)
- **Database:** Cloudflare D1 + Drizzle ORM
- **Tooling:** pnpm, just, Oxlint, Prettier, Wrangler

## Architecture Decisions

Significant technical decisions are recorded as
[Architecture Decision Records](./docs/adr/README.md).

## Prerequisites

- Node.js 22+
- [pnpm](https://pnpm.io)
- [just](https://just.systems) (optional — you can use the npm scripts directly)
- A Cloudflare account (only needed for deploying and `db:remote`)

## Quickstart

```sh
pnpm install
pnpm db:local
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

## Production deployment

Stashed deploys the React frontend, Hono API, and static assets together as a
single Cloudflare Worker. The Worker uses the `stashed-db` D1 database declared
in `wrangler.jsonc`.

Production releases are branch-gated:

- Pull requests and pushes to `main` or `prod` run the CI workflow.
- Only a push to `prod` can run the production deployment workflow.
- The deployment applies pending D1 migrations before publishing the Worker.
- Production seed data is never applied automatically.

Some schema migrations also require a one-time data migration for existing
production records. See the [migration guide](./drizzle/migrations/README.md)
for release-specific instructions.

The current production origin is:

```text
https://stashed.kiranrajeevkv.workers.dev
```

Create a GitHub environment named `production`, restrict it to the `prod`
branch, and add these environment secrets:

| Secret                  | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `CLOUDFLARE_ACCOUNT_ID` | Selects the Cloudflare account            |
| `CLOUDFLARE_API_TOKEN`  | Deploys Workers and applies D1 migrations |

Scope the API token to this Cloudflare account. It needs **Workers Scripts:
Write** and **D1: Edit**. The GitHub App client ID, client secret, and Stashed
session secret are Worker secrets stored directly in Cloudflare; they do not
need to be duplicated in GitHub.

The intended release flow is to work normally on `main`, then open a pull
request from `main` into the protected `prod` branch when the current state is
ready for production.

For the initial Worker deployment, set the Worker secrets without committing
the local `.env` file:

```sh
pnpm exec wrangler secret bulk .env
pnpm db:remote
pnpm run deploy
```

Add this exact GitHub App callback URL alongside the existing localhost
callback:

```text
https://stashed.kiranrajeevkv.workers.dev/api/auth/github/callback
```
