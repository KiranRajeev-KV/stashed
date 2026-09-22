import { ApiError } from "../api/errors.js";

export async function reserveSuggestionAttempt(db: D1Database, userId: string) {
  const now = new Date();
  const utcDay = now.toISOString().slice(0, 10);
  const utcMonth = utcDay.slice(0, 7);
  const id = crypto.randomUUID();

  try {
    await db
      .prepare(
        `
      INSERT INTO tag_suggestion_attempts (id, user_id, utc_day, utc_month, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
      )
      .bind(id, userId, utcDay, utcMonth, now.getTime())
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("SUGGESTIONS_DISABLED")) {
      throw new ApiError(
        503,
        "SUGGESTIONS_UNAVAILABLE",
        "Tag suggestions are currently unavailable",
      );
    }
    if (message.includes("USER_QUOTA_REACHED")) {
      throw new ApiError(
        429,
        "SUGGESTIONS_QUOTA_REACHED",
        "Daily tag suggestion allowance reached",
      );
    }
    if (message.includes("GLOBAL_QUOTA_REACHED")) {
      throw new ApiError(
        429,
        "SUGGESTIONS_QUOTA_REACHED",
        "Monthly tag suggestion budget reached",
      );
    }
    console.error(
      JSON.stringify({ message: "Tag suggestion quota reservation failed" }),
    );
    throw new ApiError(
      503,
      "SUGGESTIONS_UNAVAILABLE",
      "Tag suggestions are currently unavailable",
    );
  }

  return id;
}

export async function recordSuggestionUsage(
  db: D1Database,
  attemptId: string,
  providerStatus: number | null,
  inputTokens: number | null,
) {
  try {
    await db
      .prepare(
        `
      UPDATE tag_suggestion_attempts
      SET provider_status = ?, input_tokens = ?
      WHERE id = ?
    `,
      )
      .bind(providerStatus, inputTokens, attemptId)
      .run();
  } catch {
    // The reserved attempt still counts; surface missing usage through logs.
    console.error(
      JSON.stringify({
        message: "Tag suggestion usage update failed",
        attemptId,
      }),
    );
  }
}
