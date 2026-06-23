import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "@lib/db";
import { dumpTables, DEFAULT_DUMP_PATH, type Dump } from "./db-portable";

// Extracts every table in schema.ts into a single JSON file. Run on the dev
// machine against the developer database:
//
//   pnpm db:dump            # writes ./db-dump.json
//   pnpm db:dump path.json  # writes a custom path
//
// The file is then shipped to the demo deployment and consumed by db-load.ts.

async function main() {
  const outPath = resolve(process.argv[2] ?? DEFAULT_DUMP_PATH);
  const dump = {} as Dump;

  for (const [name, table] of Object.entries(dumpTables)) {
    const rows = await db.select().from(table);
    dump[name as keyof Dump] = rows as Record<string, unknown>[];
    console.log(`Dumped ${rows.length} row(s) from "${name}".`);
  }

  // `JSON.stringify` turns the Date objects from postgres-js into ISO strings
  // and leaves the jsonb columns as nested objects — db-load.ts reverses both.
  writeFileSync(outPath, JSON.stringify(dump, null, 2));
  console.log(`Wrote dump to ${outPath}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());
