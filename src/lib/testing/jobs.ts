import { getBoss } from "@lib/jobs/boss";
import { QUEUES } from "@lib/jobs/queues";
import type { EvaluateAssumptionJob } from "@lib/jobs/evaluateAssumption";

// Jobs queued to evaluate the given assumption. Assumption ids are unique per test, so
// this needs no cleanup between tests (pgboss.* tables are not truncated).
export async function evaluationJobsFor(assumptionId: string) {
  const boss = await getBoss();
  return boss.findJobs<EvaluateAssumptionJob>(QUEUES.evaluateAssumption, { data: { assumptionId } });
}
