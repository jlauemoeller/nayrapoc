import { config } from "dotenv";
import path from "path";

/**
 * Load .env files in priority order (last wins).
 *
 * Next.js handles this automatically for the web app; this function is a
 * no-op in that context (dotenv won't override already-set vars).  It
 * exists so that non-Next.js consumers — CLI scripts, migrations, test
 * runners — get the same environment loading behaviour.
 *
 * Loading order (mirrors Next.js conventions):
 *   1. .env                    — base, committed
 *   2. .env.[NODE_ENV]         — environment-specific, committed
 *   3. .env.[NODE_ENV].local   — local overrides, NOT committed
 */
function loadEnv() {
  const env = process.env.NODE_ENV ?? "development";
  const root = process.cwd();

  config({ path: path.resolve(root, ".env") });
  config({ path: path.resolve(root, `.env.${env}`), override: true });
  config({ path: path.resolve(root, `.env.${env}.local`), override: true });
}

// Skip if running inside Next.js — it already loaded the env files.
if (!process.env.NEXT_RUNTIME && !process.env.__NEXT_PROCESSED_ENV) {
  loadEnv();
}

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const appConfig = {
  env: (process.env.NODE_ENV ?? "development") as "development" | "test" | "production",

  db: {
    get url() {
      return requireEnv("DATABASE_URL");
    }
  },

  email: {
    get configuration() {
      return {
        server: {
          auth: {
            user: requireEnv("EMAIL_SERVER_USER"),
            pass: requireEnv("EMAIL_SERVER_PASSWORD")
          },
          host: requireEnv("EMAIL_SERVER_HOST"),
          port: parseInt(requireEnv("EMAIL_SERVER_PORT"), 10)
        },
        from: requireEnv("EMAIL_FROM")
      };
    }
  },

  objectStorage: {
    get endpoint() {
      return requireEnv("OBJECT_STORAGE_ENDPOINT");
    },
    get region() {
      return process.env.OBJECT_STORAGE_REGION ?? "us-east-1";
    },
    get accessKeyId() {
      return requireEnv("OBJECT_STORAGE_ACCESS_KEY_ID");
    },
    get secretAccessKey() {
      return requireEnv("OBJECT_STORAGE_SECRET_ACCESS_KEY");
    },
    get bucket() {
      return requireEnv("OBJECT_STORAGE_BUCKET");
    },
    get forcePathStyle() {
      return (process.env.OBJECT_STORAGE_FORCE_PATH_STYLE ?? "false").toLowerCase() === "true";
    },
    get publicUrl() {
      return process.env.OBJECT_STORAGE_PUBLIC_URL ?? requireEnv("OBJECT_STORAGE_ENDPOINT");
    }
  },

  app: {
    // Hostname (with port if non-standard) that serves the dashboard.
    // Derived from NEXTAUTH_URL so we don't carry a duplicate env var; the
    // proxy uses this to decide whether an inbound request is dashboard
    // traffic or short-domain traffic.
    get host() {
      return new URL(requireEnv("NEXTAUTH_URL")).host;
    }
  }
} as const;

export const authConfig = {
  get secret() {
    return requireEnv("NEXTAUTH_SECRET");
  },
  get url() {
    return requireEnv("NEXTAUTH_URL");
  }
} as const;
