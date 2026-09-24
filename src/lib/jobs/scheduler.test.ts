import { describe, it, expect } from "vitest";
import { requestAssumptionEvaluation } from "@lib/jobs/scheduler";
import { transaction } from "@lib/db/connection";
import { AssumptionService } from "@lib/services/assumptionService";
import { setupTestDb } from "@lib/testing/dbTest";
import { createAssumption } from "@lib/testing/factories";
import { evaluationJobsFor } from "@lib/testing/jobs";
import { createDecisionWithProjectScenario } from "@lib/testing/scenarios";

const { db } = setupTestDb();

describe("requestAssumptionEvaluation", () => {
  it("stamps rationaleAiRequestedAt and enqueues an evaluation job", async () => {
    const { user, decision } = await createDecisionWithProjectScenario(db);
    const assumption = await createAssumption(db, decision.id, user.id);

    const result = await requestAssumptionEvaluation(assumption.id, db);

    expect(result.isOk()).toBe(true);
    const reloaded = await AssumptionService.get(assumption.id, db);
    expect(reloaded?.rationaleAiRequestedAt).toBeInstanceOf(Date);
    expect(await evaluationJobsFor(assumption.id)).toHaveLength(1);
  });

  // The job is inserted through the caller's transaction (`fromDrizzle(tx, sql)`), so a
  // rollback must take it along — otherwise a worker could evaluate a write that never happened.
  it("drops the job when the surrounding transaction rolls back", async () => {
    const { user, decision } = await createDecisionWithProjectScenario(db);
    const assumption = await createAssumption(db, decision.id, user.id);

    await expect(
      transaction(async (tx) => {
        await requestAssumptionEvaluation(assumption.id, tx);
        throw new Error("rollback");
      }, db)
    ).rejects.toThrow("rollback");

    const reloaded = await AssumptionService.get(assumption.id, db);
    expect(reloaded?.rationaleAiRequestedAt).toBeUndefined();
    expect(await evaluationJobsFor(assumption.id)).toEqual([]);
  });
});
