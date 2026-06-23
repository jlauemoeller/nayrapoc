import postgres from "postgres";
import { appConfig } from "@lib/config";

async function main() {
  const adminUrl = new URL(appConfig.db.url);
  const dbName = adminUrl.pathname.slice(1);
  adminUrl.pathname = "/postgres";

  const sql = postgres(adminUrl.toString(), { max: 1, onnotice: () => {} });

  try {
    await sql.unsafe(`CREATE DATABASE "${dbName}"`);
    console.log(`Database "${dbName}" created.`);
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      err.code === "42P04"
    ) {
      console.log(`Database "${dbName}" already exists, skipping.`);
    } else {
      throw err;
    }
  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
