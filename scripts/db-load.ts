import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { eq, sql } from "drizzle-orm";
import { db } from "@lib/db";
import { transaction } from "@lib/db/connection";
import { users, accounts, projects, decisions, assumptions, verificationTokens } from "@lib/db/schema";
import { reviveRow, DEFAULT_DUMP_PATH, type Dump } from "./db-portable";

// Seeds the *current* database from a dump produced by db-dump.ts. Intended to
// run inside the demo deployment, where the Postgres instance lives in the same
// Docker swarm and isn't reachable from outside.
//
// Locally / in a full image (devDeps + source present):
//   tsx scripts/db-load.ts [path.json]      # defaults to ./db-dump.json
//
// In the demo's Next.js `output: "standalone"` image there is no tsx, no
// scripts/ dir and no tsconfig path resolution — so we don't run the .ts there.
// Instead bundle this file (and all its deps) to a single self-contained .cjs on
// the dev machine / in CI, ship that + the dump into the image, and run it with
// plain node. The only thing it needs from the environment is DATABASE_URL:
//   pnpm db:load:bundle                      # -> dist/db-load.cjs
//   node dist/db-load.cjs [path.json]        # in the swarm, DATABASE_URL set
//
// DESTRUCTIVE: it TRUNCATEs every domain table first so the load is a clean,
// repeatable reset — exactly what a periodically-reset demo wants. Schema must
// already exist (run migrations first).

async function main() {
  const inPath = resolve(process.argv[2] ?? DEFAULT_DUMP_PATH);
  const dump = JSON.parse(readFileSync(inPath, "utf8")) as Dump;

  // Revive timestamps per table (see reviveRow). Inserting full rows — ids,
  // created_at, updated_at and all — preserves the original primary keys, which
  // every cross-table foreign key in the dump depends on.
  const userRows = dump.users.map((r) => reviveRow(users, r));
  const accountRows = dump.accounts.map((r) => reviveRow(accounts, r));
  const projectRows = dump.projects.map((r) => reviveRow(projects, r));
  const decisionRows = dump.decisions.map((r) => reviveRow(decisions, r));
  const assumptionRows = dump.assumptions.map((r) => reviveRow(assumptions, r));
  const tokenRows = dump.verification_tokens.map((r) => reviveRow(verificationTokens, r));

  await transaction(async (tx) => {
    // Wipe first so the load is idempotent. CASCADE covers any FK; the explicit
    // list keeps it readable.
    await tx.execute(
      sql`TRUNCATE users, accounts, projects, decisions, assumptions, verification_tokens RESTART IDENTITY CASCADE`
    );

    // users <-> accounts is a circular FK (users.account_id -> accounts.id,
    // accounts.owner_id -> users.id). account_id is nullable, so insert users
    // with it nulled, insert accounts, then patch account_id back in.
    if (userRows.length) {
      await tx.insert(users).values(userRows.map((u) => ({ ...u, account_id: null })));
    }
    if (accountRows.length) {
      await tx.insert(accounts).values(accountRows);
    }
    for (const u of userRows) {
      if (u.account_id != null) {
        await tx.update(users).set({ account_id: u.account_id }).where(eq(users.id, u.id!));
      }
    }

    // Remaining tables in FK order.
    if (projectRows.length) await tx.insert(projects).values(projectRows);
    if (decisionRows.length) await tx.insert(decisions).values(decisionRows);
    if (assumptionRows.length) await tx.insert(assumptions).values(assumptionRows);
    if (tokenRows.length) await tx.insert(verificationTokens).values(tokenRows);
  });

  const counts = [userRows, accountRows, projectRows, decisionRows, assumptionRows, tokenRows];
  const total = counts.reduce((sum, rows) => sum + rows.length, 0);
  console.log(`Loaded ${total} row(s) from ${inPath}.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
