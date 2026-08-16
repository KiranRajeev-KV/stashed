import { z } from "zod";

const GITHUB_API_URL = "https://api.github.com";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_API_VERSION = "2026-03-10";

const tokenResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.literal("bearer"),
});

const githubUserSchema = z.object({
  id: z.number().int().positive().safe(),
  login: z.string().min(1),
  avatar_url: z.string().url().nullable(),
});

const githubEmailSchema = z.object({
  email: z.string().email(),
  primary: z.boolean(),
  verified: z.boolean(),
});

export type GitHubIdentity = {
  providerUserId: string;
  username: string;
  email: string | null;
  avatarUrl: string | null;
};

type GitHubTokenExchange = {
  clientId: string;
  clientSecret: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
};

function githubHeaders(accessToken: string): HeadersInit {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "Stashed",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(`GitHub returned an invalid response (${response.status})`);
  }
}

async function exchangeCodeForToken(input: GitHubTokenExchange) {
  const response = await fetch(GITHUB_TOKEN_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      code_verifier: input.codeVerifier,
      redirect_uri: input.redirectUri,
    }),
  });
  const body = await parseJson(response);
  const parsed = tokenResponseSchema.safeParse(body);

  if (!response.ok || !parsed.success) {
    throw new Error(`GitHub token exchange failed (${response.status})`);
  }

  return parsed.data.access_token;
}

async function fetchGitHubUser(accessToken: string) {
  const response = await fetch(`${GITHUB_API_URL}/user`, {
    headers: githubHeaders(accessToken),
  });
  const body = await parseJson(response);
  const parsed = githubUserSchema.safeParse(body);

  if (!response.ok || !parsed.success) {
    throw new Error(`GitHub user lookup failed (${response.status})`);
  }

  return parsed.data;
}

async function fetchGitHubPrimaryEmail(
  accessToken: string,
): Promise<string | null> {
  const response = await fetch(`${GITHUB_API_URL}/user/emails?per_page=100`, {
    headers: githubHeaders(accessToken),
  });

  // Identity proof does not depend on email access. This also lets users whose
  // enterprise policy withholds email information continue to sign in.
  if (response.status === 403 || response.status === 404) {
    return null;
  }

  const body = await parseJson(response);
  const parsed = z.array(githubEmailSchema).safeParse(body);

  if (!response.ok || !parsed.success) {
    throw new Error(`GitHub email lookup failed (${response.status})`);
  }

  return (
    parsed.data.find((email) => email.primary && email.verified)?.email ?? null
  );
}

export async function authenticateWithGitHub(
  input: GitHubTokenExchange,
): Promise<GitHubIdentity> {
  const accessToken = await exchangeCodeForToken(input);
  const [user, email] = await Promise.all([
    fetchGitHubUser(accessToken),
    fetchGitHubPrimaryEmail(accessToken),
  ]);

  // The GitHub access token (and any refresh token GitHub returned) is never
  // returned from this function or persisted. It becomes unreachable here.
  return {
    providerUserId: String(user.id),
    username: user.login,
    email,
    avatarUrl: user.avatar_url,
  };
}
