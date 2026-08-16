# Authentication

Stashed uses a GitHub App only to prove user identity. It requests the minimum
account permission needed to read a verified primary email, does not request
repository or organization access, and does not store GitHub access or refresh
tokens. Stashed sessions are signed, HttpOnly cookies with a fixed seven-day
lifetime.

## Register the GitHub App

Open **GitHub → Settings → Developer settings → GitHub Apps → New GitHub App**
and configure it as follows:

- **GitHub App name:** any globally unique name, such as `Stashed (your-name)`
- **Homepage URL:** `http://localhost:5173` for local setup; use the production
  origin once it exists
- **Callback URL:**
  `http://localhost:5173/api/auth/github/callback`
- **Callback wildcard matching:** disabled
- **Request user authorization (OAuth) during installation:** disabled
- **Enable Device Flow:** disabled
- **Webhook:** inactive
- **Repository permissions:** none
- **Organization permissions:** none
- **Account permissions → Email addresses:** read-only
- **Where can this GitHub App be installed?:** any account (public)

The app must be public because Stashed accepts any GitHub user. Users can
authorize a GitHub App without installing it, so this identity-only flow does
not require installation or a GitHub App private key.

After creating the app, copy its **Client ID** (not its App ID) and generate a
new client secret. When a production origin is available, add this second exact
callback URL to the same GitHub App:

```text
https://your-production-origin.example/api/auth/github/callback
```

GitHub Apps support multiple callback URLs. Keep wildcard matching disabled.
The Worker derives the callback from the origin receiving the login request, so
no production domain is hardcoded in the application.

## Configure local secrets

Use `.env` for local development; it is already ignored by Git:

```sh
cp .env.example .env
openssl rand -base64 32
```

Put the GitHub App Client ID, client secret, and generated random value into
`.env`. Use the same local origin and port as the registered callback URL.

## Run locally

```sh
pnpm db:local
pnpm dev
```

Open <http://localhost:5173/api/auth/github> in a browser. After GitHub
authorization, Stashed redirects to `/`. The auth endpoints are:

| Method | Endpoint                    | Behavior                         |
| ------ | --------------------------- | -------------------------------- |
| GET    | `/api/auth/github`          | Starts GitHub authorization      |
| GET    | `/api/auth/github/callback` | Completes login and sets session |
| GET    | `/api/auth/me`              | Returns the signed-in user       |
| POST   | `/api/auth/logout`          | Clears the session (`204`)       |

From the browser console, verify the session and logout:

```js
await fetch("/api/auth/me").then((response) => response.json());
await fetch("/api/auth/logout", { method: "POST" });
```

Local HTTP cookies are unprefixed and omit `Secure`. Production HTTPS cookies
use the `__Host-` prefix with `Secure`, `HttpOnly`, `SameSite=Lax`, and
`Path=/`.

## Configure Cloudflare and deploy

Set each value through Wrangler's interactive secret prompt so values do not
appear in shell history:

```sh
pnpm exec wrangler secret put GITHUB_CLIENT_ID
pnpm exec wrangler secret put GITHUB_CLIENT_SECRET
pnpm exec wrangler secret put SESSION_SECRET
```

Generate a separate production session secret with `openssl rand -base64 32`.
Rotating `SESSION_SECRET` immediately invalidates every existing Stashed
session.

Apply migrations and deploy:

```sh
pnpm db:remote
pnpm deploy
```

Add the deployed origin's exact callback URL to the GitHub App before testing
production login. No schema migration is required specifically for auth; the
existing `users` and `user_identities` tables provide the required model.
