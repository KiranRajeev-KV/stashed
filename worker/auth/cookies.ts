import type { Context } from "hono";
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { z } from "zod";

import type { AppEnv } from "../types.js";

const SESSION_COOKIE = "stashed_session";
const OAUTH_COOKIE = "stashed_oauth";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;
const OAUTH_TTL_SECONDS = 10 * 60;

const sessionPayloadSchema = z.object({
  v: z.literal(1),
  type: z.literal("session"),
  userId: z.string().uuid(),
  issuedAt: z.number().int().nonnegative(),
  expiresAt: z.number().int().positive(),
});

const oauthPayloadSchema = z.object({
  v: z.literal(1),
  type: z.literal("oauth"),
  state: z.string().min(32),
  codeVerifier: z.string().min(43).max(128),
  redirectUri: z.string().url(),
  expiresAt: z.number().int().positive(),
});

export type OAuthTransaction = z.infer<typeof oauthPayloadSchema>;

function isSecure(c: Context<AppEnv>) {
  return new URL(c.req.url).protocol === "https:";
}

function cookiePrefix(c: Context<AppEnv>): "host" | undefined {
  return isSecure(c) ? "host" : undefined;
}

function signingSecret(c: Context<AppEnv>, purpose: "session" | "oauth") {
  if (c.env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }
  return `${c.env.SESSION_SECRET}:${purpose}`;
}

function encode(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function decode(value: string): unknown {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function parsePayload<T extends { expiresAt: number }>(
  value: string | undefined | false,
  schema: z.ZodType<T>,
): T | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  try {
    const parsed = schema.safeParse(decode(value));
    if (
      !parsed.success ||
      parsed.data.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

function cookieOptions(c: Context<AppEnv>, maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    path: "/" as const,
    sameSite: "Lax" as const,
    secure: isSecure(c),
    prefix: cookiePrefix(c),
  };
}

function clearCookie(c: Context<AppEnv>, name: string) {
  deleteCookie(c, name, {
    path: "/",
    secure: isSecure(c),
    prefix: cookiePrefix(c),
  });
}

export async function setOAuthCookie(
  c: Context<AppEnv>,
  transaction: Omit<OAuthTransaction, "v" | "type" | "expiresAt">,
) {
  const expiresAt = Math.floor(Date.now() / 1000) + OAUTH_TTL_SECONDS;
  await setSignedCookie(
    c,
    OAUTH_COOKIE,
    encode({ v: 1, type: "oauth", ...transaction, expiresAt }),
    signingSecret(c, "oauth"),
    cookieOptions(c, OAUTH_TTL_SECONDS),
  );
}

export async function getOAuthCookie(c: Context<AppEnv>) {
  const value = await getSignedCookie(
    c,
    signingSecret(c, "oauth"),
    OAUTH_COOKIE,
    cookiePrefix(c),
  );
  return parsePayload(value, oauthPayloadSchema);
}

export function clearOAuthCookie(c: Context<AppEnv>) {
  clearCookie(c, OAUTH_COOKIE);
}

export async function setSessionCookie(c: Context<AppEnv>, userId: string) {
  const issuedAt = Math.floor(Date.now() / 1000);
  await setSignedCookie(
    c,
    SESSION_COOKIE,
    encode({
      v: 1,
      type: "session",
      userId,
      issuedAt,
      expiresAt: issuedAt + SESSION_TTL_SECONDS,
    }),
    signingSecret(c, "session"),
    cookieOptions(c, SESSION_TTL_SECONDS),
  );
}

export async function getSessionUserId(c: Context<AppEnv>) {
  const value = await getSignedCookie(
    c,
    signingSecret(c, "session"),
    SESSION_COOKIE,
    cookiePrefix(c),
  );
  return parsePayload(value, sessionPayloadSchema)?.userId;
}

export function clearSessionCookie(c: Context<AppEnv>) {
  clearCookie(c, SESSION_COOKIE);
}
