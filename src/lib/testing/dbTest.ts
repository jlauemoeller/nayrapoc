import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { appConfig } from "@lib/config";
import * as schema from "@lib/db/schema";

// Arbitrary stable ID — every test file claims the same lock so they serialize
// across workers (vitest can otherwise overlap files in watch mode).
const TEST_DB_LOCK_ID = 4815162342;

/**
 * Per-file Postgres test harness. Hold a session-scoped advisory lock for the
 * entire file so no other test file can run TRUNCATE/INSERT against the same
 * `nayra_test` DB while we're using it. `max: 1` keeps every query on a single
 * connection, which is what makes the session-scoped lock cover all queries.
 */
export function setupTestDb() {
  const client = postgres(appConfig.db.url, { max: 1 });
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    await client`SELECT pg_advisory_lock(${TEST_DB_LOCK_ID})`;
  });

  afterAll(async () => {
    try {
      await client`SELECT pg_advisory_unlock(${TEST_DB_LOCK_ID})`;
    } finally {
      await client.end();
    }
  });

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE users, accounts CASCADE`);
  });

  return { db, client };
}
