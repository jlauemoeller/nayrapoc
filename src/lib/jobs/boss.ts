import { PgBoss } from "pg-boss";
import { omit } from "lodash";
import { appConfig } from "@lib/config";
import { queueDefinitions, type QueueName } from "./queues";

/**
 * Process-wide pg-boss instance.
 *
 * We configure a lazy, promise-cached singleton on `globalThis`:
 *
 *  - Lazy: like `db`, nothing should touch DATABASE_URL at import time —
 *    `next build` evaluates module scope and CLI scripts import freely.
 *  - Promise-cached: concurrent first callers (two server actions racing)
 *    share one `start()` instead of each opening a pool.
 *  - `globalThis`: `next dev` re-evaluates modules on hot reload, which would
 *    orphan a module-level variable and leak a second instance with its own
 *    pool and pollers. Same trick Prisma recommends for its client.
 *
 * Producers (server actions) and consumers (workers registered in
 * `src/instrumentation.ts`) share this instance; `start()` is required
 * before `send()` in pg-boss 12.
 */

type BossGlobal = typeof globalThis & { __nayraBoss?: Promise<PgBoss> };
const globalForBoss = globalThis as BossGlobal;

export function getBoss(): Promise<PgBoss> {
  if (!globalForBoss.__nayraBoss) {
    globalForBoss.__nayraBoss = createAndStart().catch((error) => {
      // Don't cache a failed start; let the next caller retry.
      globalForBoss.__nayraBoss = undefined;
      throw error;
    });
  }
  return globalForBoss.__nayraBoss;
}

/**
 * Stop the shared instance and forget it. Tests and one-shot scripts must call
 * this (as with `db.$client.end()`), otherwise the pool keeps the process alive.
 * `graceful: true` waits for active jobs before closing.
 */
export async function stopBoss(): Promise<void> {
  const pending = globalForBoss.__nayraBoss;
  if (!pending) return;
  globalForBoss.__nayraBoss = undefined;
  const boss = await pending;
  await boss.stop({ graceful: true, close: true, timeout: 5_000 });
}

async function createAndStart(): Promise<PgBoss> {
  const boss = new PgBoss({
    connectionString: appConfig.db.url,
    // Small pool: the web app already holds its own postgres.js connections
    // and this instance only polls a couple of queues.
    max: 3,
    schema: "pgboss"
  });

  // pg-boss is an EventEmitter; an 'error' event with no listener crashes
  // the process (Node semantics). Log instead — errors here are things like
  // a lost connection during a poll, which pg-boss retries itself.
  boss.on("error", (error) => {
    console.error("[pg-boss]", error);
  });

  await boss.start();
  await ensureQueues(boss);
  return boss;
}

/**
 * Create every queue in `queueDefinitions`, then push the current options.
 * `createQueue` is `INSERT ... ON CONFLICT DO NOTHING`, so it is idempotent
 * but never updates an existing queue; `updateQueue` applies edits made in
 * queues.ts. Note `policy` cannot be changed after creation — delete the
 * queue (`boss.deleteQueue(name)`) if you need a different one.
 */
async function ensureQueues(boss: PgBoss): Promise<void> {
  // Dead-letter queues must exist before the queues that reference them, so
  // create queues without a `deadLetter` first.
  const ordered = (Object.keys(queueDefinitions) as QueueName[]).sort(
    (a, b) => Number(Boolean(queueDefinitions[a].deadLetter)) - Number(Boolean(queueDefinitions[b].deadLetter))
  );

  for (const name of ordered) {
    const definition = queueDefinitions[name];
    await boss.createQueue(name, definition);
    // pg-boss validates option *presence* (`'retryDelay' in options`), so an
    // explicit `retryDelay: undefined` fails validation. Pass the definition
    // through (it omits unset keys) instead of destructuring into a new object.
    await boss.updateQueue(name, { ...omit(definition, "policy"), deadLetter: definition.deadLetter ?? null });
  }
}
