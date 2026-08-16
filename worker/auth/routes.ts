import { Hono } from "hono";

import { apiError } from "../api/errors.js";
import { findOrCreateGitHubUser } from "../db/users.js";
import { requireSession } from "../middleware/session.js";
import type { AppEnv } from "../types.js";
import {
  clearOAuthCookie,
  clearSessionCookie,
  getOAuthCookie,
  setOAuthCookie,
  setSessionCookie,
} from "./cookies.js";
import { authenticateWithGitHub } from "./github.js";
import { createOAuthParameters, secureEqual } from "./pkce.js";

const GITHUB_AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const CALLBACK_PATH = "/api/auth/github/callback";

function callbackUrl(requestUrl: string) {
  return new URL(CALLBACK_PATH, requestUrl).toString();
}

export const authRoutes = new Hono<AppEnv>()
  .use("*", async (c, next) => {
    c.header("Cache-Control", "no-store");
    await next();
  })
  .get("/github", async (c) => {
    const { state, codeVerifier, codeChallenge } =
      await createOAuthParameters();
    const redirectUri = callbackUrl(c.req.url);

    await setOAuthCookie(c, { state, codeVerifier, redirectUri });

    const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
    authorizeUrl.search = new URLSearchParams({
      client_id: c.env.GITHUB_CLIENT_ID,
      redirect_uri: redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    }).toString();

    return c.redirect(authorizeUrl.toString(), 302);
  })
  .get("/github/callback", async (c) => {
    const transaction = await getOAuthCookie(c);
    clearOAuthCookie(c);

    const returnedState = c.req.query("state");
    const stateMatches =
      transaction &&
      returnedState &&
      (await secureEqual(returnedState, transaction.state));
    if (
      !transaction ||
      !stateMatches ||
      transaction.redirectUri !== callbackUrl(c.req.url)
    ) {
      return apiError(
        c,
        400,
        "AUTH_STATE_INVALID",
        "Invalid or expired authorization state",
      );
    }

    const githubError = c.req.query("error");
    if (githubError) {
      return apiError(
        c,
        400,
        "AUTHORIZATION_FAILED",
        "GitHub authorization was not completed",
      );
    }

    const code = c.req.query("code");
    if (!code) {
      return apiError(
        c,
        400,
        "AUTHORIZATION_FAILED",
        "GitHub did not provide an authorization code",
      );
    }

    const identity = await authenticateWithGitHub({
      clientId: c.env.GITHUB_CLIENT_ID,
      clientSecret: c.env.GITHUB_CLIENT_SECRET,
      code,
      codeVerifier: transaction.codeVerifier,
      redirectUri: transaction.redirectUri,
    });
    const user = await findOrCreateGitHubUser(c.get("db"), identity);

    await setSessionCookie(c, user.id);
    return c.redirect("/ideas", 302);
  })
  .get("/me", requireSession, (c) => {
    return c.json({ user: c.get("currentUser") });
  })
  .post("/logout", (c) => {
    clearSessionCookie(c);
    clearOAuthCookie(c);
    return c.body(null, 204);
  });
