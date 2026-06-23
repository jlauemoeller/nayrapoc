import { getTableColumns } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { users, accounts, verificationTokens, projects, decisions, assumptions } from "@lib/db/schema";

// Shared between db-dump.ts (extract) and db-load.ts (seed).
//
// Why JSON-via-Drizzle rather than pg_dump/pg_restore? Three reasons specific
// to this project:
//   1. The users<->accounts circular FK can't be satisfied by a naive ordered
//      restore. We break the cycle in app code (insert users with a null
//      account_id, then patch it) without needing superuser to defer
//      constraints or flip session_replication_role.
//   2. It reuses the app's own Drizzle client, so the jsonb `Block[]` columns
//      serialize exactly the way the app writes them.
//   3. A curated JSON file is a controllable demo seed we can hand-edit/commit,
//      not an opaque binary dump.

// Insertion order: a table may only be loaded after every table it references
// by FK. The users<->accounts cycle is the one exception, handled specially in
// db-load.ts. The key here doubles as the JSON key in the dump file.
export const dumpTables = {
  users,
  accounts,
  verification_tokens: verificationTokens,
  projects,
  decisions,
  assumptions
} as const;

export type DumpTableName = keyof typeof dumpTables;
export type Dump = Record<DumpTableName, Record<string, unknown>[]>;

export const DEFAULT_DUMP_PATH = "db-dump.json";

// Drizzle's postgres-js driver returns `Date` objects for `timestamp` columns.
// JSON has no date type, so they survive the round-trip as ISO strings. Revive
// them before re-inserting — otherwise Drizzle forwards the raw string and the
// insert fails. We detect timestamp columns generically via Drizzle's column
// metadata (`dataType === "date"`) so this needs no hand-maintained list, and we
// key by the TS property name (the shape `db.select()` returns) so it survives
// any future camelCase/snake_case column split.
export function reviveRow<T extends PgTable>(table: T, row: Record<string, unknown>): T["$inferInsert"] {
  const revived = { ...row };
  for (const [key, column] of Object.entries(getTableColumns(table))) {
    const value = revived[key];
    if (value != null && column.dataType === "date") {
      revived[key] = new Date(value as string);
    }
  }
  return revived as T["$inferInsert"];
}
