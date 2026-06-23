import * as schema from "./schema";
import postgres from "postgres";
import { appConfig } from "@lib/config";
import { drizzle } from "drizzle-orm/postgres-js";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

// Use a Proxy because Next.js evaluates module-level code during `next build`
// and DATABASE_URL isn't available at build time (and should be runtime
// configurable for deployment anyway)

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    if (!_db) {
      const connectionString = appConfig.db.url;
      if (!connectionString) {
        throw new Error(`DATABASE_URL is not set in environment variables, ${appConfig}`);
      }
      const client = postgres(connectionString);
      _db = drizzle(client, { schema /*, logger: true */ });
    }
    return Reflect.get(_db, prop, receiver);
  }
});
