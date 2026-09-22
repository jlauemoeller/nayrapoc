import type { PgBoss } from "pg-boss";
import { getBoss } from "./boss";
import { QUEUES } from "./queues";
import { EvaluateAssumptionJob, evaluateAssumption } from "./evaluateAssumption";
/**
 * Register every worker and cron schedule on the shared pg-boss instance.
 *
 * Called once per server process from `src/instrumentation.ts`. Server actions
 * never call this — they only `send()`; consuming happens here.
 *
 * Adding a job:
 *   1. write the handler as a plain async function in its own module
 *      (`evaluateAssumption.ts`), taking the job data. This makes it callable
 *      from tests without a running boss;
 *   2. add a `boss.work(...)` line below;
 *   3. for cron jobs, also `boss.schedule(...)` — it is an upsert, so calling
 *      it on every boot is the intended usage.
 */
export async function startWorkers(): Promise<PgBoss> {
  const boss = await getBoss();

  await boss.work<EvaluateAssumptionJob>(QUEUES.evaluateAssumption, async ([job]) => {
    await evaluateAssumption(job.data);
  });

  // await boss.work(QUEUES.sweepStaleEvaluations, async () => {
  //   await sweepStaleEvaluations();
  // });
  // await boss.schedule(QUEUES.sweepStaleEvaluations, "*/10 * * * *");

  console.log(`[pg-boss] workers started (queues: ${Object.values(QUEUES).join(", ")})`);
  return boss;
}
