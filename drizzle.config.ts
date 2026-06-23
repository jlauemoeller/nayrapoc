import "./src/lib/config";
import { defineConfig } from "drizzle-kit";
import { appConfig } from "./src/lib/config";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: appConfig.db.url,
  },
});
