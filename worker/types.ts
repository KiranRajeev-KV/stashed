import type { Database } from "./db/client.js";
import type { AuthenticatedUser } from "./db/users.js";

export type AppEnv = {
  Bindings: Env;
  Variables: {
    db: Database;
    currentUser: AuthenticatedUser;
  };
};
