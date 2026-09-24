import { AssumptionService } from "@/lib/services/assumptionService";
import { db } from "@/lib/db";
import { DbConnection } from "@/lib/db/connection";
import { AssumptionEvaluationService } from "@/lib/services/assumptionEvaluationService";

export type EvaluateAssumptionJob = { assumptionId: string };
export async function evaluateAssumption(
  { assumptionId }: EvaluateAssumptionJob,
  connection: DbConnection = db
): Promise<void> {
  const snapshotAt = new Date();
  const assumption = await AssumptionService.get(assumptionId, connection);

  if (assumption) {
    const evaluation = await AssumptionEvaluationService.evaluateAssumption(assumption, connection);

    const result = await AssumptionService.update(
      assumptionId,
      {
        rationaleAiRating: evaluation.rating,
        rationaleAiEvaluation: evaluation.evaluation,
        rationaleAiEvaluatedAt: snapshotAt
      },
      connection
    );

    if (result.isErr()) {
      console.error(`Unable to save evaluation result for assumption ${assumptionId}: ${result.error}`);
    }
  }
}
