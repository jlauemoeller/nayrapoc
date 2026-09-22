import { AssumptionRepository } from "@/lib/repositories/assumptionRepository";
import { getBoss } from "@/lib/jobs/boss";
import { QUEUES } from "@/lib/jobs/queues";
import { fromDrizzle } from "pg-boss";
import { DbConnection } from "@/lib/db/connection";
import { sql } from "drizzle-orm";

export async function requestAssumptionEvaluation(assumptionId: string, tx: DbConnection) {
  const updated = await AssumptionRepository.update(
    assumptionId,
    {
      rationale_ai_requested_at: new Date()
    },
    tx
  );

  if (updated.isOk()) {
    const boss = await getBoss();
    await boss.sendDebounced(
      QUEUES.evaluateAssumption,
      { assumptionId },
      { db: fromDrizzle(tx, sql) },
      15,
      assumptionId
    );
  } else {
    console.error(updated.error);
  }

  return updated;
}
