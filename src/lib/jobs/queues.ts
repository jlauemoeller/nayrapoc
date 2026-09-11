import type { Queue } from "pg-boss";

/**
 * Every queue the app uses, declared in one place.
 *
 * pg-boss 12 requires queues to exist before `send()`; `ensureQueues()` in
 * boss.ts creates them idempotently on startup. Add a queue here and it is
 * created on the next boot — no migration needed, pg-boss owns its own schema.
 */
export const QUEUES = {
  /** Evaluate one assumption's rationale against its unresolved comments. Data: `{ assumptionId }`. */
  evaluateAssumption: "evaluate-assumption",
  /** Dead-letter queue for `evaluateAssumption` — jobs that exhausted their retries land here. */
  evaluateAssumptionDlq: "evaluate-assumption-dlq",
  /** Janitor: re-request evaluations that are missing, outdated or stuck. Cron-scheduled, no data. */
  sweepStaleEvaluations: "sweep-stale-evaluations"
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

type QueueDefinition = Omit<Queue, "name">;

export const queueDefinitions: Record<QueueName, QueueDefinition> = {
  [QUEUES.evaluateAssumption]: {
    // Debounced sends (`sendDebounced`) need the default policy: one job per
    // singletonKey per time slot, and a trailing slot when throttled.
    policy: "standard",
    retryLimit: 3,
    retryBackoff: true, // 1s, 2s, 4s (+ jitter)
    // An LLM call takes seconds, not minutes. A short expiry means a job left
    // `active` by a killed process is retried quickly after restart instead of
    // after pg-boss's default 15 minutes.
    expireInSeconds: 120,
    deadLetter: QUEUES.evaluateAssumptionDlq
  },
  [QUEUES.evaluateAssumptionDlq]: {
    policy: "standard",
    retryLimit: 0
  },
  [QUEUES.sweepStaleEvaluations]: {
    // Only one sweep should ever be queued or running.
    policy: "exclusive",
    retryLimit: 1,
    expireInSeconds: 300
  }
};
