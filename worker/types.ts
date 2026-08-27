import type { Database } from "./db/client.js";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    db: Database;
    currentUserId: string;
    sessionUserId?: string;
  };
};
