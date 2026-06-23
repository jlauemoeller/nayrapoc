import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { appConfig } from "@lib/config";
import * as schema from "@lib/db/schema";

// Single postgres client shared across every DB-touching test file.
// `max: 1` forces all queries to serialize on one connection, which makes
// concurrent TRUNCATEs from interleaved test files (something vitest's watch
// dispatcher does despite `fileParallelism: false`) impossible. The client
// lives for the lifetime of the worker process and is reaped on exit.
export const client = postgres(appConfig.db.url, { max: 1 });
export const db = drizzle(client, { schema });
