import { and, eq } from "drizzle-orm";

import type { GitHubIdentity } from "../auth/github.js";
import type { Database } from "./client.js";
import { userIdentities, users } from "./schema.js";

const GITHUB_PROVIDER = "github";

export type AuthenticatedUser = {
  id: string;
  displayName: string;
  identity: {
    provider: typeof GITHUB_PROVIDER;
    providerUserId: string;
    username: string;
    email: string | null;
    avatarUrl: string | null;
  };
};

type StoredUser = {
  id: string;
  displayName: string;
  providerUserId: string;
  username: string | null;
  email: string | null;
  avatarUrl: string | null;
};

function toAuthenticatedUser(user: StoredUser): AuthenticatedUser {
  if (!user.username) {
    throw new Error("GitHub identity is missing its username");
  }

  return {
    id: user.id,
    displayName: user.displayName,
    identity: {
      provider: GITHUB_PROVIDER,
      providerUserId: user.providerUserId,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  };
}

async function findGitHubUser(
  db: Database,
  providerUserId: string,
): Promise<StoredUser | undefined> {
  return db
    .select({
      id: users.id,
      displayName: users.displayName,
      providerUserId: userIdentities.providerUserId,
      username: userIdentities.providerUsername,
      email: userIdentities.providerEmail,
      avatarUrl: userIdentities.providerAvatarUrl,
    })
    .from(userIdentities)
    .innerJoin(users, eq(users.id, userIdentities.userId))
    .where(
      and(
        eq(userIdentities.provider, GITHUB_PROVIDER),
        eq(userIdentities.providerUserId, providerUserId),
      ),
    )
    .get();
}

export async function getUserById(
  db: Database,
  userId: string,
): Promise<AuthenticatedUser | undefined> {
  const stored = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      providerUserId: userIdentities.providerUserId,
      username: userIdentities.providerUsername,
      email: userIdentities.providerEmail,
      avatarUrl: userIdentities.providerAvatarUrl,
    })
    .from(users)
    .innerJoin(
      userIdentities,
      and(
        eq(userIdentities.userId, users.id),
        eq(userIdentities.provider, GITHUB_PROVIDER),
      ),
    )
    .where(eq(users.id, userId))
    .get();

  return stored ? toAuthenticatedUser(stored) : undefined;
}

async function updateGitHubIdentity(
  db: Database,
  user: StoredUser,
  identity: GitHubIdentity,
): Promise<AuthenticatedUser> {
  await db
    .update(userIdentities)
    .set({
      providerUsername: identity.username,
      providerEmail: identity.email,
      providerAvatarUrl: identity.avatarUrl,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(userIdentities.provider, GITHUB_PROVIDER),
        eq(userIdentities.providerUserId, identity.providerUserId),
      ),
    );

  return toAuthenticatedUser({
    ...user,
    username: identity.username,
    email: identity.email,
    avatarUrl: identity.avatarUrl,
  });
}

export async function findOrCreateGitHubUser(
  db: Database,
  identity: GitHubIdentity,
): Promise<AuthenticatedUser> {
  const existing = await findGitHubUser(db, identity.providerUserId);
  if (existing) {
    return updateGitHubIdentity(db, existing, identity);
  }

  const userId = crypto.randomUUID();
  const identityId = crypto.randomUUID();
  const now = new Date();

  try {
    await db.batch([
      db.insert(users).values({
        id: userId,
        displayName: identity.username,
        createdAt: now,
        updatedAt: now,
      }),
      db.insert(userIdentities).values({
        id: identityId,
        userId,
        provider: GITHUB_PROVIDER,
        providerUserId: identity.providerUserId,
        providerUsername: identity.username,
        providerEmail: identity.email,
        providerAvatarUrl: identity.avatarUrl,
        createdAt: now,
        updatedAt: now,
      }),
    ]);
  } catch (error) {
    // A second callback for the same GitHub account may win the insert race.
    // D1 rolls the failed batch back, so reuse the identity that won.
    const racedUser = await findGitHubUser(db, identity.providerUserId);
    if (racedUser) {
      return updateGitHubIdentity(db, racedUser, identity);
    }
    throw error;
  }

  return {
    id: userId,
    displayName: identity.username,
    identity: {
      provider: GITHUB_PROVIDER,
      providerUserId: identity.providerUserId,
      username: identity.username,
      email: identity.email,
      avatarUrl: identity.avatarUrl,
    },
  };
}
